import { sanitizeHtml } from '../sanitize-html';

// Use the manual mock from __mocks__/dompurify.ts
jest.mock('dompurify');

describe('sanitizeHtml', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty string for null or undefined input', () => {
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
    expect(sanitizeHtml('')).toBe('');
  });

  it('should sanitize HTML with script tags', () => {
    const maliciousHtml = '<p>Hello</p><script>alert("XSS")</script>';
    const result = sanitizeHtml(maliciousHtml);

    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
  });

  it('should preserve safe HTML tags', () => {
    const safeHtml = '<p>Hello <strong>world</strong></p>';
    const result = sanitizeHtml(safeHtml);

    expect(result).toContain('<p>');
    expect(result).toContain('<strong>');
  });

  it('should handle table HTML', () => {
    const tableHtml = `
      <table>
        <thead>
          <tr><th>Header</th></tr>
        </thead>
        <tbody>
          <tr><td>Data</td></tr>
        </tbody>
      </table>
    `;
    const result = sanitizeHtml(tableHtml);

    expect(result).toContain('<table>');
    expect(result).toContain('<thead>');
    expect(result).toContain('<tbody>');
  });

  it('should remove inline event handlers', () => {
    const maliciousHtml = '<div onclick="alert(\'XSS\')">Click me</div>';
    const result = sanitizeHtml(maliciousHtml);

    // Our mock removes onclick attributes
    expect(result).not.toContain('onclick');
  });

  it('should handle complex nested HTML', () => {
    const complexHtml = `
      <div class="container">
        <h1>Title</h1>
        <p>Paragraph with <em>emphasis</em> and <strong>strong</strong> text.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      </div>
    `;
    const result = sanitizeHtml(complexHtml);

    expect(result).toContain('<div');
    expect(result).toContain('<h1>');
    expect(result).toContain('<ul>');
  });

  it('should accept custom DOMPurify config', () => {
    const html = '<p>Test</p>';
    const customConfig = {
      ALLOWED_TAGS: ['div'],
    };

    // Should not throw
    expect(() => sanitizeHtml(html, customConfig)).not.toThrow();
  });

  describe('Real-world XSS attack vectors', () => {
    it('should prevent javascript: URL XSS', () => {
      const xssHtml = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const result = sanitizeHtml(xssHtml);

      expect(result).not.toContain('javascript:');
    });

    it('should prevent onerror XSS in images', () => {
      const xssHtml = '<img src="invalid.jpg" onerror="alert(\'XSS\')">';
      const result = sanitizeHtml(xssHtml);

      expect(result).not.toContain('onerror');
    });

    it('should prevent data URI XSS attempts', () => {
      const xssHtml = '<iframe src="data:text/html,<script>alert(\'XSS\')</script>"></iframe>';
      const result = sanitizeHtml(xssHtml);

      // Should remove script from data URI
      expect(result).not.toContain('script');
    });

    it('should prevent style-based XSS', () => {
      const xssHtml = '<div style="background: url(javascript:alert(\'XSS\'))">Test</div>';
      const result = sanitizeHtml(xssHtml);

      expect(result).not.toContain('javascript:');
    });
  });
});
