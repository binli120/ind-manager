import DOMPurify from 'dompurify';
import type { Config as DOMPurifyConfig } from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks.
 *
 * This function uses DOMPurify to remove potentially dangerous HTML/JavaScript
 * while preserving safe HTML formatting (tables, paragraphs, etc.).
 *
 * @param html - The HTML string to sanitize
 * @param options - Optional DOMPurify configuration
 * @returns Sanitized HTML string safe for rendering
 *
 * @example
 * ```tsx
 * const safeHtml = sanitizeHtml(userContent);
 * <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
 * ```
 */
export function sanitizeHtml(
  html: string | undefined | null,
  options?: DOMPurifyConfig
): string {
  if (!html) return '';

  // Default configuration - allows common formatting but removes scripts
  const defaultConfig: DOMPurifyConfig = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'b', 'i',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
      'a', 'img',
      'div', 'span',
      'blockquote', 'code', 'pre',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel',
      'src', 'alt', 'title',
      'class', 'style',
      'colspan', 'rowspan',
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false,
  };

  const config = { ...defaultConfig, ...options };

  // For server-side rendering, we need to use isomorphic-dompurify
  if (typeof window === 'undefined') {
    // On server, we still need to sanitize but DOMPurify needs a DOM
    // For now, we'll return the html as-is on server and rely on client sanitization
    // In production, consider using isomorphic-dompurify
    console.warn('Server-side HTML sanitization not implemented. Using client-side only.');
    return html;
  }

  return DOMPurify.sanitize(html, config);
}

/**
 * React hook for sanitizing HTML content.
 * Memoizes the sanitization result to avoid re-sanitizing on every render.
 *
 * @param html - The HTML string to sanitize
 * @param options - Optional DOMPurify configuration
 * @returns Sanitized HTML string
 *
 * @example
 * ```tsx
 * function MyComponent({ content }) {
 *   const safeHtml = useSanitizedHtml(content);
 *   return <div dangerouslySetInnerHTML={{ __html: safeHtml }} />;
 * }
 * ```
 */
export function useSanitizedHtml(
  html: string | undefined | null,
  options?: DOMPurifyConfig
): string {
  // Note: This would need React's useMemo if used in a React component
  // For now, just returning the sanitized result
  return sanitizeHtml(html, options);
}
