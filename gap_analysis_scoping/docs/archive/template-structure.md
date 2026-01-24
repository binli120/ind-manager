# Template Structure Documentation

## Overview

This document describes the structure of validation templates used in the Gap Analysis Completeness Check feature. Templates define the validation rules that documents must satisfy to be considered complete.

## Template Formats

The system supports two template formats:

1. **JSON Templates**: Structured JSON files with validation rules
2. **Excel Templates**: Spreadsheet-based templates (e.g., `template_2.6.2_poc.xlsx`)

## JSON Template Structure

### Example Template (2.6.2-summary.json)

```json
{
  "summary_id": "b880386f-fda6-4e92-8c90-d2db18adf774",
  "section": "2.6.2",
  "status": "draft",
  "summary_text": "2.6.2 Pharmacology Written Summary...",
  "element_numbers": [],
  "previous_summary_id": null
}
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `summary_id` | UUID string | No | Unique identifier for the document summary |
| `section` | String | Yes | Section identifier (e.g., "2.6.2") |
| `status` | String | No | Document status: "draft", "review", "final", "submitted" |
| `summary_text` | String | Yes | Main content of the document summary |
| `element_numbers` | Array<number> | No | Array of element number references |
| `previous_summary_id` | UUID string | No | Reference to previous version (for revisions) |

## Excel Template Structure

### Expected Structure (template_2.6.2_poc.xlsx)

The Excel template should contain the following columns/structure:

#### Sheet 1: Template Metadata
- **Template Name**: Name of the template (e.g., "2.6.2 Pharmacology Summary")
- **Version**: Template version number
- **Section**: Target section identifier
- **Last Updated**: Date of last template update

#### Sheet 2: Validation Rules
Each row represents a validation rule with the following columns:

| Column | Description | Example |
|--------|-------------|---------|
| Rule ID | Unique identifier | "RULE_001" |
| Field Name | Field being validated | "summary_text" |
| Rule Type | Type of validation | "content_presence", "format_requirement" |
| Required | Whether field is required | TRUE/FALSE |
| Severity | Issue severity | "critical", "warning", "info" |
| Description | Human-readable description | "Document must contain summary text" |
| Remediation Hint | Guidance for fixing issues | "Add a comprehensive summary section" |
| Validation Logic | Specific validation criteria | "min_length: 100" |

#### Sheet 3: Field Definitions
Defines all fields that can be validated:

| Column | Description |
|--------|-------------|
| Field Name | Name of the field |
| Data Type | Expected data type (string, number, array, uuid) |
| Format | Expected format (e.g., "X.Y.Z" for section) |
| Example | Example valid value |

## Extracted Validation Rules

The template parser automatically extracts the following validation rules from templates:

### Critical Rules (Required)

1. **Summary Text Presence**
   - Field: `summary_text`
   - Type: content_presence
   - Description: Document must contain a summary text section
   - Remediation: Add a comprehensive summary text section to the document

2. **Section Identifier Presence**
   - Field: `section`
   - Type: content_presence
   - Description: Document must have a valid section identifier
   - Remediation: Add a section identifier (e.g., "2.6.2") to the document

3. **Section Identifier Format**
   - Field: `section`
   - Type: format_requirement
   - Description: Section identifier must follow the format X.Y.Z
   - Remediation: Ensure section identifier follows the format X.Y.Z (e.g., "2.6.2")

### Warning Rules (Recommended)

4. **Summary Text Minimum Length**
   - Field: `summary_text`
   - Type: format_requirement
   - Description: Summary text should be sufficiently detailed (minimum 100 characters)
   - Remediation: Expand the summary text to provide more detail

5. **Summary Text Structure**
   - Field: `summary_text`
   - Type: format_requirement
   - Description: Summary text should contain structured sections with proper headings
   - Remediation: Organize summary text with clear section headings (e.g., 2.6.2.1, 2.6.2.2)

6. **Document Status Presence**
   - Field: `status`
   - Type: content_presence
   - Description: Document should have a status indicator
   - Remediation: Add a status field (e.g., "draft", "final", "review")

7. **Document Status Valid Values**
   - Field: `status`
   - Type: format_requirement
   - Description: Document status should be one of: draft, review, final, submitted
   - Remediation: Set status to one of the valid values

### Info Rules (Optional)

8. **Summary ID Presence**
   - Field: `summary_id`
   - Type: content_presence
   - Description: Document should have a unique summary identifier
   - Remediation: Add a unique summary ID (UUID format) for tracking purposes

9. **Summary ID Format**
   - Field: `summary_id`
   - Type: format_requirement
   - Description: Summary ID should be a valid UUID
   - Remediation: Ensure summary ID is a valid UUID

10. **Element Numbers Presence**
    - Field: `element_numbers`
    - Type: content_presence
    - Description: Document may include element number references
    - Remediation: Consider adding element number references if applicable

11. **Element Numbers Format**
    - Field: `element_numbers`
    - Type: format_requirement
    - Description: Element numbers should be an array of integers
    - Remediation: Ensure element_numbers is an array of integer values

12. **Previous Summary ID Reference**
    - Field: `previous_summary_id`
    - Type: content_presence
    - Description: Document may reference a previous version
    - Remediation: If this is a revision, add previous_summary_id to link to the previous version

## Rule Severity Levels

### Critical
- **Impact**: Prevents document from being considered complete
- **Action Required**: Must be fixed before submission
- **Examples**: Missing required fields, invalid section identifiers

### Warning
- **Impact**: Document may be incomplete or non-standard
- **Action Required**: Should be addressed but not blocking
- **Examples**: Short summary text, missing status field

### Info
- **Impact**: Optional improvements or best practices
- **Action Required**: Nice to have but not required
- **Examples**: Missing tracking IDs, optional metadata

## Rule Types

### content_presence
Validates that a field exists and has a value.

**Example**: Checking if `summary_text` field is present and non-empty.

### format_requirement
Validates that a field's value meets specific format requirements.

**Examples**:
- Minimum/maximum length
- Pattern matching (e.g., section format "X.Y.Z")
- Valid value enumeration (e.g., status must be "draft", "review", "final", or "submitted")
- Data type validation (e.g., UUID format, array of integers)

## Template Validation Workflow

1. **Template Upload**: User uploads JSON or Excel template
2. **Template Parsing**: System parses template structure
3. **Rule Extraction**: System extracts validation rules based on template fields
4. **Rule Storage**: Rules are stored in memory (POC) or database (production)
5. **Document Validation**: Documents are validated against extracted rules
6. **Gap Reporting**: System generates gap reports with remediation hints

## Extending Templates

### Adding New Fields

To add a new field to templates:

1. Add the field to the JSON template structure
2. Update `extractValidationRules()` method in `template-parser.ts`
3. Define validation rules for the new field
4. Add field definition to Excel template (Sheet 3)
5. Update this documentation

### Adding New Rule Types

To add a new rule type:

1. Update `ValidationRule` interface to include new type
2. Implement validation logic in `DocumentAnalyzer` class
3. Update rule extraction logic in `TemplateParser`
4. Document the new rule type in this file

## Example: Section 2.6.2 Template

### Purpose
Validates pharmacology written summaries for IND submissions.

### Required Fields
- `section`: Must be "2.6.2"
- `summary_text`: Must contain comprehensive pharmacology summary

### Recommended Fields
- `status`: Should indicate document status
- `summary_text`: Should be well-structured with subsections

### Optional Fields
- `summary_id`: Unique tracking identifier
- `element_numbers`: References to related elements
- `previous_summary_id`: Link to previous version

### Expected Summary Structure
The summary_text should contain:
- 2.6.2.1 Brief Summary
- 2.6.2.2 Primary Pharmacodynamics
- 2.6.2.3 Secondary Pharmacodynamics
- 2.6.2.4 Safety Pharmacology
- 2.6.2.5 Pharmacodynamic Drug Interactions
- 2.6.2.6 Discussion and Conclusions
- 2.6.2.7 Tables and Figures

## Migration from Excel to JSON

For POC purposes, Excel templates can be converted to JSON format:

1. Extract field definitions from Excel Sheet 3
2. Create JSON structure with all defined fields
3. Set default/example values for each field
4. Save as `.json` file
5. Use JSON template for validation

## Future Enhancements

- [ ] Implement full Excel parsing using xlsx library
- [ ] Support for custom validation logic in templates
- [ ] Template versioning and migration
- [ ] Template inheritance (base templates + overrides)
- [ ] Conditional rules based on document type
- [ ] Cross-field validation rules
- [ ] Regular expression pattern matching
- [ ] Numeric range validation
- [ ] Date/time format validation

## References

- **Requirements**: `.kiro/specs/gap-analysis-initial-poc/requirements.md`
- **Design**: `.kiro/specs/gap-analysis-initial-poc/design.md`
- **Example Template**: `gap_analysis_scoping/2.6.2-summary.json`
- **Excel Template**: `gap_analysis_scoping/template_2.6.2_poc.xlsx`

---

**Last Updated**: 2026-01-18
**Status**: POC Active
**Next Steps**: Implement Excel parsing and advanced rule extraction
