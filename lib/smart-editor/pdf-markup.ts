import { createLogger } from '@/lib/smart-editor/logger';
import type { PDFPageProxy, TextContent, TextItem } from 'pdfjs-dist/types/src/display/api';

const CSS_UNITS = 96 / 72;

const logger = createLogger('PdfMarkup');

let pdfjsModulePromise: Promise<typeof import('pdfjs-dist/legacy/build/pdf.mjs')> | null = null;

async function loadPdfJs() {
  if (!pdfjsModulePromise) {
    pdfjsModulePromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  }

  return pdfjsModulePromise;
}

interface TextContentWithStyles extends TextContent {
  styles: Record<string, PdfJsFontStyle>;
}

type PdfJsFontStyle = {
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  ascent?: number;
  descent?: number;
  vertical?: boolean;
  fillColor?: number[];
  strokeColor?: number[];
  charSpacing?: number;
};

export interface PdfMarkupExtractionResult {
  html: string;
  text: string;
  pages: number;
  info?: Record<string, unknown>;
}

export async function extractPdfMarkup(buffer: Uint8Array): Promise<PdfMarkupExtractionResult> {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data: buffer });
  const pdfDocument = await loadingTask.promise;

  logger.debug('Loaded PDF document for markup extraction', {
    pages: pdfDocument.numPages,
  });

  let info: Record<string, unknown> | undefined;
  try {
    const metadata = await pdfDocument.getMetadata();
    info = metadata.info as Record<string, unknown>;
  } catch (error) {
    logger.warn('Unable to read PDF metadata', error);
  }

  const pageFragments: string[] = [];
  const plainTextFragments: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const pageHtml = await renderPageToMarkup(pdfjs, page, pageNumber);
    pageFragments.push(pageHtml.html);
    plainTextFragments.push(pageHtml.text);
  }

  return {
    html: `<div class="pdf-markup-document">${pageFragments.join('\n')}</div>`,
    text: plainTextFragments.join('\n\n'),
    pages: pdfDocument.numPages,
    info,
  };
}

async function renderPageToMarkup(
  pdfjs: typeof import('pdfjs-dist/legacy/build/pdf.mjs'),
  page: PDFPageProxy,
  pageNumber: number
) {
  const viewport = page.getViewport({ scale: 1 });
  const textContent = (await page.getTextContent({ includeMarkedContent: true })) as TextContentWithStyles;
  const { pageWidth, pageHeight, pageX, pageY } = viewport.rawDims;
  const baseTransform = [1, 0, 0, -1, -pageX, pageY + pageHeight];

  const spans: string[] = [];
  const plainTextPieces: string[] = [];

  for (const item of textContent.items) {
    if (!isTextItem(item) || !item.str) {
      continue;
    }

    const tx = pdfjs.Util.transform(baseTransform, item.transform);
    let angle = Math.atan2(tx[1], tx[0]);
    const fontHeight = Math.hypot(tx[2], tx[3]);

    const fontStyle = textContent.styles[item.fontName] ?? {};
    if (fontStyle.vertical) {
      angle += Math.PI / 2;
    }
    const ascentRatio = typeof fontStyle.ascent === 'number' && fontStyle.ascent > 0 ? fontStyle.ascent : 0.8;
    const fontAscent = fontHeight * ascentRatio;

    let left = tx[4];
    let top: number;
    const isUpright = Math.abs(angle) < 1e-3;

    if (isUpright) {
      top = tx[5] - fontAscent;
    } else {
      left = tx[4] + fontAscent * Math.sin(angle);
      top = tx[5] - fontAscent * Math.cos(angle);
    }

    const leftPx = left * CSS_UNITS;
    const topPx = top * CSS_UNITS;
    const fontSizePx = fontHeight * CSS_UNITS;

    const styleParts: string[] = [
      `left:${leftPx.toFixed(2)}px`,
      `top:${topPx.toFixed(2)}px`,
      `font-size:${fontSizePx.toFixed(2)}px`,
      `font-family:${quoteFontFamily(fontStyle.fontFamily)}`,
      'transform-origin:0 0',
    ];

    const fontWeight = resolveFontWeight(fontStyle, item.fontName);
    if (fontWeight) {
      styleParts.push(`font-weight:${fontWeight}`);
    }

    const fontStyleCss = resolveFontStyle(fontStyle, item.fontName);
    if (fontStyleCss) {
      styleParts.push(`font-style:${fontStyleCss}`);
    }

    const fillColor = resolveColor(fontStyle.fillColor);
    if (fillColor) {
      styleParts.push(`color:${fillColor}`);
    }

    if (typeof fontStyle.charSpacing === 'number' && fontStyle.charSpacing !== 0) {
      const charSpacingPx = fontStyle.charSpacing * fontSizePx;
      styleParts.push(`letter-spacing:${charSpacingPx.toFixed(2)}px`);
    }

    if (!isUpright) {
      styleParts.push(`transform:rotate(${(angle * (180 / Math.PI)).toFixed(3)}deg)`);
    }

    const safeText = escapeHtml(item.str);
    spans.push(
      `<span class="pdf-markup-text" style="${styleParts.join(';')}">${safeText}</span>`
    );
    plainTextPieces.push(item.str);

    if (item.hasEOL) {
      plainTextPieces.push('\n');
    }
  }

  const scaledWidth = viewport.width * CSS_UNITS;
  const scaledHeight = viewport.height * CSS_UNITS;

  return {
    html: `<section class="pdf-markup-page" data-page="${pageNumber}" style="width:${scaledWidth.toFixed(2)}px;height:${scaledHeight.toFixed(2)}px;"><div class="pdf-markup-layer">${spans.join('')}</div></section>`,
    text: plainTextPieces.join('').trim(),
  };
}

function resolveFontWeight(style: PdfJsFontStyle, fontName: string): string | undefined {
  if (style.fontWeight) {
    return typeof style.fontWeight === 'number' ? String(style.fontWeight) : style.fontWeight;
  }

  if (/bold/i.test(fontName)) {
    return '700';
  }

  return undefined;
}

function resolveFontStyle(style: PdfJsFontStyle, fontName: string): string | undefined {
  if (style.fontStyle) {
    return style.fontStyle;
  }

  if (/italic|oblique/i.test(fontName)) {
    return 'italic';
  }

  return undefined;
}

function resolveColor(color?: number[]): string | undefined {
  if (!Array.isArray(color) || color.length < 3) {
    return undefined;
  }

  const [r, g, b] = color.map((channel) => Math.max(0, Math.min(255, Math.round(channel * 255))));
  return `rgb(${r}, ${g}, ${b})`;
}

function quoteFontFamily(fontFamily?: string): string {
  if (!fontFamily) {
    return 'sans-serif';
  }

  if (/^[a-z0-9\-\s]+$/i.test(fontFamily)) {
    return fontFamily;
  }

  return `'${fontFamily.replace(/'/g, "\\'")}'`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isTextItem(item: TextContent['items'][number]): item is TextItem {
  return typeof (item as TextItem).str === 'string';
}
// Author: Bin Lee (blee@filynai.com)
// Description: Extracts positioned HTML markup from PDFs using PDF.js to preserve original formatting.
