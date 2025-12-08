// Author: Bin Lee (blee@filynai.com)
// Description: Handles server-side PDF uploads, returning extracted markup and metadata for the editor.
import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/smart-editor/logger';
import { extractPdfMarkup } from '@/lib/smart-editor/pdf-markup';

export const runtime = 'nodejs';

const logger = createLogger('PDFExtractAPI');

export async function POST(request: NextRequest) {
  try {
    logger.info('Starting server-side PDF processing...');

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    logger.debug('File received:', { name: file.name, size: file.size });

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    logger.debug('File converted to buffer', { size: buffer.length });

    // Pre-compute a data URL so the client can embed the original PDF when needed
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'application/pdf';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    let pdfMarkup;
    try {
      // Extract structured markup from PDF
      pdfMarkup = await extractPdfMarkup(new Uint8Array(buffer));
      logger.info('PDF parsed successfully', {
        pages: pdfMarkup.pages,
        textLength: pdfMarkup.text.length,
      });

      return NextResponse.json({
        success: true,
        message: 'PDF markup extracted successfully',
        filename: file.name,
        size: file.size,
        text: pdfMarkup.text,
        html: pdfMarkup.html,
        pages: pdfMarkup.pages,
        info: pdfMarkup.info,
        dataUrl,
      });
    } catch (extractionError) {
      logger.warn('Primary PDF extraction failed, attempting text-only fallback', extractionError);

      try {
        const pdfParseModule = await import('pdf-parse/lib/pdf-parse.js');
        const pdfParse = pdfParseModule.default || pdfParseModule;
        const parsed = await pdfParse(buffer);

        const plainText = parsed.text?.trim() ?? '';
        const html = plainText
          ? plainText
              .split(/\n{2,}/)
              .map((block: string) => block.trim())
              .filter(Boolean)
              .map((block: string) =>
                `<p>${block
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/\n/g, '<br>')}</p>`
              )
              .join('\n')
          : '';

        return NextResponse.json({
          success: true,
          message: 'PDF text extracted with fallback parser',
          warning:
            'Structured markup was unavailable; content rendered as plain text.',
          filename: file.name,
          size: file.size,
          text: plainText,
          html,
          pages: parsed.numpages ?? 0,
          info: parsed.info ?? {},
          dataUrl,
        });
      } catch (fallbackError) {
        logger.error('Fallback PDF extraction failed', fallbackError);

        return NextResponse.json({
          success: true,
          message: 'PDF embedded without extracted text',
          warning:
            fallbackError instanceof Error
              ? `${fallbackError.message} (original: ${
                  extractionError instanceof Error
                    ? extractionError.message
                    : 'unknown'
                })`
              : 'PDF extraction failed due to an unknown error.',
          filename: file.name,
          size: file.size,
          text: '',
          html: '',
          pages: 0,
          info: {},
          dataUrl,
        });
      }
    }
  } catch (error) {
    logger.error('Error processing PDF:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
      },
      { status: 500 }
    );
  }
}

// Also add a GET method for testing
export async function GET() {
  return NextResponse.json({
    message: 'PDF extract API is working',
    timestamp: new Date().toISOString(),
  });
}
