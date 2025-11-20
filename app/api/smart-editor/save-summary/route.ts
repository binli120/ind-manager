// Author: Bin Lee (blee@filynai.com)
// Description: API route for persisting generated summaries into the mock filesystem.
import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

interface SaveSummaryPayload {
  content?: string;
  fileName?: string;
  folder?: string;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9\-_.\s]/g, '').trim() || 'summary';
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SaveSummaryPayload;
    const content = typeof body.content === 'string' ? body.content : '';
    const folder = typeof body.folder === 'string' ? body.folder : '';
    const fileName = typeof body.fileName === 'string' ? body.fileName : '';

    if (!content.trim()) {
      return NextResponse.json({ error: 'Summary content missing.' }, { status: 400 });
    }

    if (!folder.trim()) {
      return NextResponse.json({ error: 'Target folder missing.' }, { status: 400 });
    }

    if (!fileName.trim()) {
      return NextResponse.json({ error: 'File name missing.' }, { status: 400 });
    }

    const sanitizedName = sanitizeFileName(fileName);
    const finalName = sanitizedName.endsWith('.txt') ? sanitizedName : `${sanitizedName}.txt`;

    const summariesRoot = path.join(process.cwd(), 'summaries');
    const targetDir = path.join(summariesRoot, folder);
    const targetPath = path.join(targetDir, finalName);

    await mkdir(targetDir, { recursive: true });
    await writeFile(targetPath, content, 'utf8');

    return NextResponse.json({ success: true, path: path.relative(process.cwd(), targetPath) });
  } catch (error) {
    console.error('[save-summary] error', error);
    return NextResponse.json(
      {
        error: 'Failed to save summary.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
