// Alternative PDF processing using more standard approach

import { createLogger } from '@/lib/smart-editor/logger';
import type {
  PDFDocumentProxy,
  PDFPageProxy,
  TextContent,
  TextItem,
  TextMarkedContent,
} from 'pdfjs-dist/types/src/display/api';

type PdfJsLib = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (options: { data: ArrayBuffer }) => {
    promise: Promise<PDFDocumentProxy>;
  };
};

type PdfTextContentItem = TextItem | TextMarkedContent<string>;

interface WindowWithPdfjs extends Window {
  pdfjsLib?: PdfJsLib;
}

let pdfjsLib: PdfJsLib | null = null;

const logger = createLogger('PdfUtilsAlt');

// Load PDF.js from CDN if not already loaded
async function loadPDFJS() {
  if (pdfjsLib) {
    return pdfjsLib;
  }

  if (typeof window === 'undefined') {
    throw new Error('PDF processing is only available in the browser');
  }

  // Check if PDF.js is already loaded globally
  const windowWithPdfjs = window as WindowWithPdfjs;
  if (windowWithPdfjs.pdfjsLib) {
    logger.debug('PDF.js already available globally');
    pdfjsLib = windowWithPdfjs.pdfjsLib;
    return pdfjsLib;
  }

  logger.info('Loading PDF.js from CDN...');

  return new Promise<PdfJsLib>((resolve, reject) => {
    // Load the main PDF.js library
    const script = document.createElement('script');
    script.src =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.min.mjs';
    script.type = 'module';

    script.onload = () => {
      logger.debug('PDF.js script loaded');
      // PDF.js should be available as a module, try different access patterns
      setTimeout(() => {
        const loadedLib = (window as WindowWithPdfjs).pdfjsLib;
        if (loadedLib) {
          logger.debug('PDF.js found on window.pdfjsLib');
          pdfjsLib = loadedLib;
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.min.mjs';
          resolve(pdfjsLib);
        } else {
          logger.error('PDF.js not found on window after loading');
          reject(new Error('PDF.js not available after loading'));
        }
      }, 100);
    };

    script.onerror = (event) => {
      logger.error('Failed to load PDF.js', event);
      reject(new Error('Failed to load PDF.js script'));
    };

    document.head.appendChild(script);
  });
}

export async function extractPDFTextAlternative(file: File) {
  try {
    logger.info('Starting alternative PDF extraction', { name: file.name });

    const pdfLib = await loadPDFJS();
    logger.debug('PDF.js loaded', { methods: Object.keys(pdfLib) });

    const arrayBuffer = await file.arrayBuffer();
    logger.debug('File loaded into array buffer');

    const pdf = await pdfLib.getDocument({ data: arrayBuffer }).promise;
    logger.info('PDF document loaded', { pages: pdf.numPages });

    const page1: PDFPageProxy = await pdf.getPage(1);
    const textContent: TextContent = await page1.getTextContent();
    const text = textContent.items
      .map((item: PdfTextContentItem) => ('str' in item ? item.str : ''))
      .join(' ');

    logger.debug('Extracted text from first page', { preview: text.substring(0, 100) });

    return {
      text,
      pages: pdf.numPages,
      success: true,
    };
  } catch (error) {
    logger.error('Alternative PDF extraction failed', error);
    return {
      text: '',
      pages: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
// Author: Bin Lee (blee@filynai.com)
// Description: Provides an alternative PDF text extraction approach using client-side PDF.js loading.
