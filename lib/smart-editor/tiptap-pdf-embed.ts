import { mergeAttributes, Node } from '@tiptap/core';

export const DEFAULT_PDF_EMBED_HEIGHT = '720';

export interface PdfEmbedOptions {
  HTMLAttributes: Record<string, unknown>;
  defaultHeight: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pdfEmbed: {
      setPdf: (attrs: { src: string; title?: string; height?: string | number }) => ReturnType;
    };
  }
}

export const PdfEmbed = Node.create<PdfEmbedOptions>({
  name: 'pdfEmbed',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'pdf-embed-wrapper my-6',
      },
      defaultHeight: DEFAULT_PDF_EMBED_HEIGHT,
    } satisfies PdfEmbedOptions;
  },

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-src') ||
          element.querySelector('iframe')?.getAttribute('src') ||
          null,
        renderHTML: (attributes) =>
          attributes.src ? { 'data-src': attributes.src as string } : {},
      },
      title: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-title'),
        renderHTML: (attributes) =>
          attributes.title ? { 'data-title': attributes.title as string } : {},
      },
      height: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-height'),
        renderHTML: (attributes) =>
          attributes.height ? { 'data-height': attributes.height as string } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="pdf-embed"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const src: string | null = node.attrs.src || null;
    const title: string | null = node.attrs.title || null;
    const height: string = node.attrs.height || this.options.defaultHeight;

    if (!src) {
      return [
        'div',
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          'data-type': 'pdf-embed',
        }),
        ['p', { class: 'text-sm text-destructive' }, 'PDF preview unavailable.'],
      ];
    }

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'pdf-embed',
        'data-src': src,
        'data-title': title ?? '',
        'data-height': height,
      }),
      [
        'iframe',
        {
          src,
          title: title || 'Embedded PDF',
          class: 'pdf-embed-frame w-full rounded-md',
          width: '100%',
          height,
          allow: 'fullscreen',
        },
      ],
    ];
  },

  addCommands() {
    return {
      setPdf:
        ({ src, title, height }) =>
        ({ chain }) => {
          if (!src) {
            return false;
          }

          return chain()
            .focus()
            .insertContent({
              type: this.name,
              attrs: {
                src,
                title: title ?? null,
                height: height ? String(height) : this.options.defaultHeight,
              },
            })
            .run();
        },
    };
  },
});

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;');
}

function unescapeHtmlAttribute(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function extractDataAttribute(html: string, name: string): string | null {
  const regex = new RegExp(`data-${name}=(\"([^\"]*)\"|'([^']*)')`, 'i');
  const match = html.match(regex);
  if (!match) {
    return null;
  }
  const value = match[2] ?? match[3] ?? '';
  return unescapeHtmlAttribute(value);
}

export function createPdfEmbedHtml({
  src,
  title,
  height,
}: {
  src: string;
  title?: string | null;
  height?: string | number;
}): string {
  if (!src) {
    return '';
  }

  const resolvedHeight = height ? String(height) : DEFAULT_PDF_EMBED_HEIGHT;
  const safeTitle = title && title.trim().length > 0 ? title : 'Embedded PDF';
  const escapedSrc = escapeHtmlAttribute(src);
  const escapedTitle = escapeHtmlAttribute(safeTitle);
  const escapedHeight = escapeHtmlAttribute(resolvedHeight);

  return `
<div data-type="pdf-embed" data-src="${escapedSrc}" data-title="${escapedTitle}" data-height="${escapedHeight}" class="pdf-embed-wrapper my-6">
  <iframe src="${escapedSrc}" title="${escapedTitle}" class="pdf-embed-frame w-full rounded-md" width="100%" height="${escapedHeight}" allow="fullscreen"></iframe>
</div>
`.trim();
}

export function normalizePdfEmbedHtml(html: string | null): string | null {
  if (!html) {
    return null;
  }

  if (html.includes('<iframe')) {
    return html;
  }

  const src = extractDataAttribute(html, 'src');
  if (!src) {
    return html;
  }

  const title = extractDataAttribute(html, 'title') ?? undefined;
  const height = extractDataAttribute(html, 'height') ?? undefined;

  return createPdfEmbedHtml({
    src,
    title,
    height,
  });
}

export type ParsedPdfEmbed = {
  src: string;
  title?: string;
  height: string;
};

export function parsePdfEmbedAttributes(
  html: string | null
): ParsedPdfEmbed | null {
  if (!html) {
    return null;
  }

  const src = extractDataAttribute(html, 'src');
  if (!src) {
    return null;
  }

  const title = extractDataAttribute(html, 'title') ?? undefined;
  const height = extractDataAttribute(html, 'height') ?? DEFAULT_PDF_EMBED_HEIGHT;

  return {
    src,
    title,
    height,
  };
}
// Author: Bin Lee (blee@filynai.com)
// Description: Defines a Tiptap node extension that renders embedded PDF viewers inside the editor.
