// Author: Bin Lee (blee@filynai.com)
// Description: API route stub that simulates summary generation responses for the editor.
import { NextRequest, NextResponse } from 'next/server';

function stripHtml(input: string): string {
  return input
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateText(text: string, maxLength = 900): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}…`;
}

interface ParagraphDescriptor {
  id: string;
  docTitle: string;
  docLabel: string;
  index: number;
  text: string;
}

export async function POST(request: NextRequest) {
  try {
    const { sectionName, documents } = await request.json();

    if (!Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { error: 'No source documents provided for summarization.' },
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

    const documentsArray = documents as Array<{
      id?: string;
      title?: string;
      paragraphs?: Array<{ id?: string; text?: string }>;
      content?: string;
    }>;

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    const paragraphEntries: ParagraphDescriptor[] = [];

    documentsArray.forEach((doc, docIndex) => {
      const docTitle = doc.title || `Document ${docIndex + 1}`;
      const docLabel = (() => {
        const letter = alphabet[docIndex % alphabet.length];
        const suffix = docIndex >= alphabet.length ? `${Math.floor(docIndex / alphabet.length) + 1}` : '';
        return `${letter}${suffix}`;
      })();

      const paragraphs = Array.isArray(doc.paragraphs) ? doc.paragraphs : [];
      paragraphs.forEach((paragraph, paragraphIndex) => {
        const id = paragraph.id || `${doc.id ?? `doc-${docIndex}`}-para-${paragraphIndex}`;
        const text = stripHtml(paragraph.text ?? '').trim();
        if (!text) {
          return;
        }

        paragraphEntries.push({
          id,
          docTitle,
          docLabel,
          index: paragraphIndex,
          text,
        });
      });
    });

    if (paragraphEntries.length === 0) {
      const assembledContext = documentsArray
        .map((doc) => {
          const title = doc.title || 'Untitled Document';
          const content = stripHtml(doc.content || '');
          return `### ${title}\n${content}`.trim();
        })
        .join('\n\n');

      const fallbackPrompt = `You are assisting with the preparation of the Module ${sectionName ?? ''} summary for a regulatory dossier. Using the supplied source material, craft a concise but comprehensive executive summary that captures:

1. Context and objectives for the section.
2. Key findings or conclusions grouped logically (bullets are acceptable).
3. Identified risks, gaps, or outstanding actions.
4. Recommended next steps for downstream writers.

Write the response in clear markdown, using headings and bullet lists where helpful. Keep the tone professional and aligned with regulatory documentation.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.4,
          messages: [
            {
              role: 'system',
              content:
                'You are a senior regulatory medical writer who creates precise, structured summaries from provided source material.',
            },
            {
              role: 'user',
              content: `${fallbackPrompt}\n\n--- SOURCE MATERIAL ---\n${assembledContext}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          { error: 'Failed to generate summary', details: errorText },
          { status: response.status }
        );
      }

      const data = await response.json();
      const summary = data.choices?.[0]?.message?.content?.trim();

      if (!summary) {
        return NextResponse.json(
          { error: 'OpenAI response did not include summary text.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ summary });
    }

    const paragraphGuide = paragraphEntries
      .map((entry) => {
        const label = `${entry.docLabel}§${entry.index + 1}`;
        const snippet = truncateText(entry.text, 600);
        return `${label} — ID: ${entry.id}\n${snippet}`;
      })
      .join('\n\n');

    const combinedContext = paragraphEntries
      .map((entry) => `${entry.id}: ${entry.text}`)
      .join('\n\n');

    const prompt = `You are assisting with the preparation of the Module ${sectionName ?? ''} summary for a regulatory dossier. Using the supplied paragraph reference list, craft a concise but comprehensive executive summary that captures:

1. Context and objectives for the section.
2. Key findings or conclusions grouped logically (bullets are acceptable).
3. Identified risks, gaps, or outstanding actions.
4. Recommended next steps for downstream writers.

Rules for citations:
- Every factual statement must include one or more citations using the exact format [ref:PARAGRAPH_ID].
- You may cite multiple paragraphs by separating IDs with commas, e.g. [ref:DocA-para-1, DocA-para-3].
- Citations should appear at the end of the sentence they support.
- Use only the IDs provided in the reference list. Never invent or alter IDs.
- Maintain professional tone and clear structure (use headings and bullet lists as appropriate).

Reference list:
${paragraphGuide}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              'You are a senior regulatory medical writer who creates precise, structured summaries from provided source material.',
          },
          {
            role: 'user',
            content: `${prompt}\n\n--- PARAGRAPH TEXT ---\n${combinedContext}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Failed to generate summary', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      return NextResponse.json(
        { error: 'OpenAI response did not include summary text.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Unexpected error while generating summary.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
