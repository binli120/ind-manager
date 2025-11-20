// Author: Bin Lee (blee@filynai.com)
// Description: API route that returns mock gap analysis results for the workspace assistant.
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

interface GapAnalysisPayload {
  sectionName?: string | null;
  sectionCode?: string | null;
  sectionId?: string | null;
  documents?: Array<{
    id?: string;
    title?: string;
    content?: string;
  }>;
  templateOverride?: string;
}

type TemplateConfig = {
  instructions?: string;
  prompt?: string;
  model?: string;
};

function extractSectionCandidates(value?: string | null): string[] {
  if (!value) {
    return [];
  }

  const matches = value.match(/[0-9]+(?:\.[0-9]+)+/g);
  if (!matches) {
    return [];
  }

  const seen = new Set<string>();
  const candidates: string[] = [];

  for (const match of matches) {
    const segments = match.split('.').filter(Boolean);
    for (let length = segments.length; length >= 2; length--) {
      const candidate = segments.slice(0, length).join('.');
      if (!seen.has(candidate)) {
        seen.add(candidate);
        candidates.push(candidate);
      }
    }
  }

  return candidates;
}

function collectSectionCandidates(
  ...values: Array<string | null | undefined>
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    for (const candidate of extractSectionCandidates(value)) {
      if (!seen.has(candidate)) {
        seen.add(candidate);
        result.push(candidate);
      }
    }
  }

  return result;
}

async function loadTemplateByCode(sectionCode: string): Promise<TemplateConfig | null> {
  const normalized = sectionCode.trim();
  if (!normalized) {
    return null;
  }

  const basePath = path.join(process.cwd(), 'templates', normalized);
  const templatePath = path.join(basePath, 'base.json');

  try {
    const raw = await readFile(templatePath, 'utf8');
    const parsed = JSON.parse(raw) as TemplateConfig;
    return parsed || {};
  } catch (error) {
    console.warn('[gap-analysis] Missing or invalid template at', templatePath, error);
    return null;
  }
}

async function resolveTemplate(
  ...hints: Array<string | null | undefined>
): Promise<{ template: TemplateConfig; matchedCode: string | null }> {
  const candidates = collectSectionCandidates(...hints);

  for (const candidate of candidates) {
    const template = await loadTemplateByCode(candidate);
    if (template) {
      return { template, matchedCode: candidate };
    }
  }

  if (candidates.length > 0) {
    console.warn(
      '[gap-analysis] No template matched any of the candidates:',
      candidates.join(', ')
    );
  }

  return { template: {}, matchedCode: null };
}

function buildFallbackInstructions(sectionName?: string | null): string {
  const label = sectionName ? `the ${sectionName}` : 'this section';
  return `You are reviewing ${label} for a regulatory submission. Identify material gaps, rule or validation violations, and clarity issues within the provided source content. For each finding, include a short label, description, and recommended action. Group findings by category when possible.`;
}

function sanitizeText(value: string | undefined, fallback = ''): string {
  if (!value) return fallback;
  return value
    .replace(/\s+/g, ' ')
    .replace(/\u0000/g, '')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GapAnalysisPayload;
    const documents = Array.isArray(body.documents) ? body.documents : [];

    if (documents.length === 0) {
      return NextResponse.json(
        { error: 'No documents provided for analysis.' },
        { status: 400 }
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured.' },
        { status: 500 }
      );
    }

    const { template, matchedCode } = await resolveTemplate(
      body.sectionCode,
      body.sectionId,
      body.sectionName
    );

    let instructions =
      body.templateOverride || template.instructions || template.prompt;

    if (!instructions) {
      instructions = buildFallbackInstructions(body.sectionName ?? matchedCode);
      console.warn(
        '[gap-analysis] Using fallback instructions because no template instructions were found.'
      );
    }

    if (!instructions) {
      return NextResponse.json(
        {
          error:
            'Template instructions not found. Please add templates/<section>/base.json with an "instructions" field.',
        },
        { status: 400 }
      );
    }

    const documentSummaries = documents
      .map((doc, index) => {
        const title = sanitizeText(doc.title, `Document ${index + 1}`);
        const content = sanitizeText(doc.content, '');
        return content
          ? `### ${title}\n${content}`
          : `### ${title}\n(No content provided)`;
      })
      .join('\n\n');

    const prompt = `${instructions}\n\n--- SOURCE DOCUMENTS ---\n${documentSummaries}`;

    const controller = new AbortController();
    const timeoutMs = Number(process.env.GAP_ANALYSIS_TIMEOUT_MS ?? 20000);
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 20000);

    let response: globalThis.Response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: template.model || 'gpt-4o-mini',
          temperature: 0.3,
          messages: [
            {
              role: 'system',
              content:
                'You are a regulatory compliance reviewer. Identify gaps, rule violations, and writing issues in the provided documents. Respond in clear, bullet-listed findings grouped by category.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          {
            error:
              'Gap analysis request timed out while contacting the AI service. Please verify network connectivity and try again.',
          },
          { status: 504 }
        );
      }

      throw error;
    }

    if (!response.ok) {
      const details = await response.text();
      return NextResponse.json(
        { error: 'Gap analysis request failed.', details },
        { status: response.status }
      );
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim();

    if (!result) {
      return NextResponse.json(
        { error: 'Gap analysis produced no content.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('[gap-analysis] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Unexpected error performing gap analysis.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
