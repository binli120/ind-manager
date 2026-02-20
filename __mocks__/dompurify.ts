/**
 * Mock implementation of DOMPurify for testing
 * This allows tests to run before the actual package is installed
 */

export interface Config {
  ALLOWED_TAGS?: string[];
  ALLOWED_ATTR?: string[];
  ALLOWED_URI_REGEXP?: RegExp;
  KEEP_CONTENT?: boolean;
  RETURN_TRUSTED_TYPE?: boolean;
}

const mockSanitize = (dirty: string | Node, config?: Config): string => {
  if (typeof dirty !== 'string') {
    return '';
  }

  // Simple mock implementation that removes common XSS vectors
  let clean = dirty;

  // Remove script tags
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove inline event handlers
  clean = clean.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove javascript: protocol
  clean = clean.replace(/javascript:/gi, '');

  // Remove data: URIs with scripts
  clean = clean.replace(/data:text\/html[^"']*(script|javascript)[^"']*/gi, '');

  return clean;
};

const DOMPurify = {
  sanitize: mockSanitize,
  addHook: jest.fn(),
  removeHook: jest.fn(),
  removeHooks: jest.fn(),
  isSupported: true,
};

export default DOMPurify;
