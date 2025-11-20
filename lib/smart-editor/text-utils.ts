export function convertPlainTextToHtml(text: string): string {
  if (!text) {
    return '';
  }

  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const paragraphs = escapedText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n/g, '<br />').trim())
    .filter(Boolean);

  if (paragraphs.length > 0) {
    return paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('\n');
  }

  return `<p>${escapedText.replace(/\n/g, '<br />')}</p>`;
}
