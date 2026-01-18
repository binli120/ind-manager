# Gap Analysis Validation Module

This module provides template parsing and validation functionality for the Gap Analysis Completeness Check feature.

## Overview

The validation module parses Excel and JSON templates to extract validation rules that can be used to check document completeness. It supports multiple template formats and provides structured validation rule extraction.

## Components

### TemplateParser

The main class for parsing templates and extracting validation rules.

#### Features

- **JSON Template Parsing**: Parse JSON templates with structured validation rules
- **Excel Template Parsing**: Placeholder for future Excel template support
- **Validation Rule Extraction**: Automatically extract validation rules from template structures
- **Multiple Severity Levels**: Support for critical, warning, and info severity levels
- **Remediation Hints**: Each rule includes actionable remediation guidance

#### Usage

```typescript
import { TemplateParser } from '@/gap_analysis_scoping/features/validation/template-parser';

// Create parser instance
const parser = new TemplateParser();

// Parse JSON template
const jsonContent = JSON.stringify({
  section: '2.6.2',
  summary_text: 'Document summary...',
  status: 'draft'
});

const ruleSet = parser.parseJsonTemplate(jsonContent);

// Access extracted rules
console.log('Template:', ruleSet.name);
console.log('Rules:', ruleSet.rules);

// Iterate through rules
ruleSet.rules.forEach(rule => {
  console.log(`${rule.name}: ${rule.description}`);
  console.log(`  Required: ${rule.required}`);
  console.log(`  Severity: ${rule.severity}`);
  console.log(`  Remediation: ${rule.remediationHint}`);
});
```

## Data Models

### ValidationRule

Represents a single validation rule extracted from a template.

```typescript
interface ValidationRule {
  name: string;                                    // Rule name
  description: string;                             // Rule description
  type: 'content_presence' | 'format_requirement'; // Rule type
  field: string;                                   // Field being validated
  required: boolean;                               // Whether the field is required
  severity: 'critical' | 'warning' | 'info';       // Severity level
  remediationHint: string;                         // Actionable guidance
}
```

### ValidationRuleSet

Represents a complete set of validation rules from a template.

```typescript
interface ValidationRuleSet {
  name: string;                    // Template name
  templateType: 'excel' | 'json';  // Template format
  rules: ValidationRule[];         // Extracted rules
}
```

## Validation Rules

The parser automatically generates validation rules based on template structure:

### Critical Rules (Required)

- **Summary Text Presence**: Document must contain a summary text section
- **Section Identifier**: Document must have a valid section identifier

### Warning Rules (Recommended)

- **Summary Text Length**: Summary should be sufficiently detailed (minimum 100 characters)
- **Document Status**: Document should have a status indicator

### Info Rules (Optional)

- **Summary ID**: Document should have a unique summary identifier
- **Element Numbers**: Document may include element number references

## Example Templates

### Minimal JSON Template

```json
{
  "section": "2.6.2",
  "summary_text": "This is a test summary.",
  "status": "draft"
}
```

### Complete JSON Template

```json
{
  "summary_id": "b880386f-fda6-4e92-8c90-d2db18adf774",
  "section": "2.6.2",
  "status": "draft",
  "summary_text": "Complete summary text with all required details...",
  "element_numbers": [1, 2, 3],
  "previous_summary_id": null
}
```

## Testing

Unit tests are provided in `template-parser.test.ts`:

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

## Future Enhancements

- [ ] Implement Excel template parsing using xlsx library
- [ ] Add support for custom validation rule definitions
- [ ] Add template validation (validate template structure itself)
- [ ] Support for template versioning
- [ ] Add more sophisticated rule extraction logic
- [ ] Support for conditional rules
- [ ] Add rule priority/ordering

## Requirements Validation

This implementation validates the following requirements:

- **Requirement 1.1**: Parse and load validation rules from templates
- **Requirement 3.1**: Parse validation criteria from file formats
- **Requirement 3.2**: Validate required sections exist in documents
- **Requirement 3.3**: Check document formatting against specifications

## API Integration

The TemplateParser is designed to be used in the Next.js API route `/api/validation`:

```typescript
// app/api/validation/route.ts
import { TemplateParser } from '@/gap_analysis_scoping/features/validation/template-parser';

export async function POST(request: Request) {
  const { template } = await request.json();
  
  const parser = new TemplateParser();
  const ruleSet = parser.parseJsonTemplate(template);
  
  return Response.json(ruleSet);
}
```

## Error Handling

The parser includes comprehensive error handling:

- **Invalid JSON**: Throws descriptive error for malformed JSON
- **Missing Fields**: Gracefully handles templates with missing optional fields
- **Excel Not Implemented**: Clear error message for Excel parsing (POC limitation)

## Performance Considerations

- Parsing is synchronous and in-memory for POC simplicity
- No database storage required
- Suitable for templates up to several MB in size
- For production, consider streaming for very large templates
