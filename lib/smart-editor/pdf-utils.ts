// Simplified PDF processing - no PDF.js initialization needed

import { createLogger } from '@/lib/smart-editor/logger';

const logger = createLogger('PdfUtils');

export interface PDFExtractionResult {
  text: string;
  pages: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
}

export function parsePdfDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const match = value.match(/D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?/);
  if (!match) return undefined;

  const [
    ,
    year,
    month = '01',
    day = '01',
    hour = '00',
    minute = '00',
    second = '00',
  ] = match;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );
}

/**
 * Extract text content from a PDF file
 * NOTE: This is a simplified version that creates a template instead of actual text extraction
 * to avoid PDF.js initialization issues in Next.js
 */
export async function extractPDFText(file: File): Promise<PDFExtractionResult> {
  logger.info('Starting simplified PDF processing', { name: file.name });

  // Create a structured template instead of actual PDF text extraction
  const fileInfo = {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified).toLocaleDateString(),
  };

  const templateText = `PDF Document: ${fileInfo.name}

Document Information:
- File Name: ${fileInfo.name}
- File Size: ${Math.round(fileInfo.size / 1024)} KB
- File Type: ${fileInfo.type}
- Last Modified: ${fileInfo.lastModified}

PDF Content:
This PDF file has been uploaded successfully. You can now work with this document in the editor.

Note: PDF text extraction is available but currently simplified to avoid initialization issues.
You can manually add content below or use other tools to extract text from the PDF.

--- Content Area ---
[Start typing your content here...]

--- Additional Notes ---
[Add any additional notes or extracted content here...]`;

  logger.debug('Created structured template for PDF', { name: file.name });

  return {
    text: templateText,
    pages: 1, // Simplified - we don't know actual page count
    metadata: {
      title: file.name.replace('.pdf', ''),
      creator: 'PDF Import Tool',
      producer: 'Smart Editor',
      creationDate: new Date(file.lastModified),
    },
  };
}

/**
 * Convert extracted PDF text to HTML for TipTap editor
 */
export function convertPDFTextToHTML(pdfResult: PDFExtractionResult): string {
  let html = '';

  // Add document metadata if available
  if (pdfResult.metadata.title) {
    html += `<h1>${escapeHtml(pdfResult.metadata.title)}</h1>\n`;
  }

  if (pdfResult.metadata.author) {
    html += `<p><strong>Author:</strong> ${escapeHtml(
      pdfResult.metadata.author
    )}</p>\n`;
  }

  if (pdfResult.metadata.subject) {
    html += `<p><strong>Subject:</strong> ${escapeHtml(
      pdfResult.metadata.subject
    )}</p>\n`;
  }

  html += '<hr>\n';

  // Process the text content
  const text = pdfResult.text;
  const sections = text.split(/--- Page \d+ ---/);

  sections.forEach((section, index) => {
    if (index === 0 && !section.trim()) return; // Skip empty first section

    const trimmedSection = section.trim();
    if (!trimmedSection) return;

    if (index > 0) {
      html += `<h3>Page ${index}</h3>\n`;
    }

    // Split into paragraphs and format
    const paragraphs = trimmedSection.split(/\n\s*\n/);
    paragraphs.forEach((paragraph) => {
      const cleanParagraph = paragraph.replace(/\s+/g, ' ').trim();
      if (cleanParagraph) {
        // Check if it looks like a heading (all caps, short, etc.)
        if (
          cleanParagraph.length < 100 &&
          cleanParagraph === cleanParagraph.toUpperCase() &&
          cleanParagraph.length > 5
        ) {
          html += `<h4>${escapeHtml(cleanParagraph)}</h4>\n`;
        } else {
          html += `<p>${escapeHtml(cleanParagraph)}</p>\n`;
        }
      }
    });
  });

  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Create a preview of PDF content for display
 */
export function createPDFPreview(
  pdfResult: PDFExtractionResult,
  maxLength: number = 500
): string {
  const text = pdfResult.text.replace(/--- Page \d+ ---/g, '').trim();

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + '...';
}
// Author: Bin Lee (blee@filynai.com)
// Description: Provides simplified PDF processing stubs and HTML conversion helpers for imported documents.
