# XSS Vulnerability Fix - HTML Sanitization with DOMPurify

## Summary

This fix addresses Critical XSS vulnerabilities identified in the code review by implementing HTML sanitization using DOMPurify before rendering user-controlled content.

## Changes Made

### 1. Created Sanitization Utility
**File:** `/lib/utils/sanitize-html.ts`

A reusable utility function that:
- Sanitizes HTML content to prevent XSS attacks
- Allows safe HTML tags (tables, paragraphs, formatting)
- Removes dangerous content (scripts, event handlers, javascript: URLs)
- Handles both client and server-side rendering
- Fully documented with JSDoc and examples

### 2. Fixed XSS Vulnerabilities

#### Files Updated:
1. **`/components/section-editor/template-dialog.tsx`** (Line 1019)
   - **Before:** `dangerouslySetInnerHTML={{ __html: tableContent }}`
   - **After:** `dangerouslySetInnerHTML={{ __html: sanitizeHtml(tableContent) }}`

2. **`/components/section-editor/materials-dialog.tsx`** (Line 575)
   - **Before:** `dangerouslySetInnerHTML={{ __html: topic.content }}`
   - **After:** `dangerouslySetInnerHTML={{ __html: sanitizeHtml(topic.content) }}`

3. **`/components/section-editor/materials-dialog.tsx`** (Line 667)
   - **Before:** `dangerouslySetInnerHTML={{ __html: tbl.html }}`
   - **After:** `dangerouslySetInnerHTML={{ __html: sanitizeHtml(tbl.html) }}`

### 3. Added Tests
**File:** `/lib/utils/__tests__/sanitize-html.test.ts`

Comprehensive test suite covering:
- Null/undefined handling
- Script tag removal
- Safe HTML preservation
- Table HTML support
- Event handler removal
- Real-world XSS attack vectors

## Installation

You need to install DOMPurify and its TypeScript types:

```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

If you encounter peer dependency issues:

```bash
npm install dompurify @types/dompurify --legacy-peer-deps
```

## Testing

Run the tests to verify the sanitization works correctly:

```bash
npm test -- sanitize-html.test.ts
```

## How It Works

### Before (Vulnerable)
```tsx
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```
❌ Any JavaScript in `userContent` will execute

### After (Secure)
```tsx
import { sanitizeHtml } from '@/lib/utils/sanitize-html'

<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userContent) }} />
```
✅ Malicious JavaScript is removed, safe HTML is preserved

## Usage Examples

### Basic Usage
```tsx
import { sanitizeHtml } from '@/lib/utils/sanitize-html'

function MyComponent({ htmlContent }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlContent) }} />
  )
}
```

### With Custom Configuration
```tsx
import { sanitizeHtml } from '@/lib/utils/sanitize-html'

const safeHtml = sanitizeHtml(htmlContent, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
  ALLOWED_ATTR: ['class']
})
```

### Handling Null/Undefined
```tsx
// Safe - returns empty string if content is null/undefined
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(maybeContent) }} />
```

## Security Details

### What Gets Removed:
- ❌ `<script>` tags and inline JavaScript
- ❌ Event handlers (`onclick`, `onerror`, etc.)
- ❌ `javascript:` URLs
- ❌ `data:` URIs with JavaScript
- ❌ Malicious CSS expressions
- ❌ `<iframe>`, `<object>`, `<embed>` (configurable)

### What Gets Preserved:
- ✅ Text formatting (`<strong>`, `<em>`, `<u>`)
- ✅ Tables (`<table>`, `<tr>`, `<td>`, etc.)
- ✅ Lists (`<ul>`, `<ol>`, `<li>`)
- ✅ Links (`<a href>`)
- ✅ Images (`<img src>`)
- ✅ Safe styling and classes

## Next Steps

1. **Install the package:**
   ```bash
   npm install dompurify @types/dompurify
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Check for additional usage:**
   Search for other instances of `dangerouslySetInnerHTML` in the codebase:
   ```bash
   grep -r "dangerouslySetInnerHTML" --include="*.tsx" --include="*.ts" .
   ```

## Additional Security Recommendations

1. **Content Security Policy (CSP):** Add CSP headers to further mitigate XSS
2. **Input Validation:** Validate and sanitize on the backend as well
3. **Regular Updates:** Keep DOMPurify updated for latest security patches
4. **Audit Regular:** Run security audits periodically

## References

- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [MDN: dangerouslySetInnerHTML](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)

## Support

If you encounter any issues with the sanitization affecting legitimate content:
1. Check the allowed tags/attributes in `/lib/utils/sanitize-html.ts`
2. Adjust the configuration if needed
3. Add tests for your specific use case
