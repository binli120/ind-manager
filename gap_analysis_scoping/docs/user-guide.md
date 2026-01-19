# Gap Analysis Completeness Check - User Guide

## Quick Start

### Step 1: Access the Application

Open the HTML interface:
- **Development**: Open `gap_analysis_scoping/features/gap-analysis-poc.html` in your browser
- **Production**: Navigate to your deployed application URL

### Step 2: Upload Template

1. Click on the **"Upload Template File"** input
2. Select your template file:
   - Excel format: `.xlsx` or `.xls`
   - JSON format: `.json`
3. Choose the template type (Excel or JSON) using the radio buttons
4. You'll see "Selected: [filename]" confirmation

### Step 3: Upload Document

1. Click on the **"Upload Document to Validate"** input
2. Select your document file:
   - PDF: `.pdf`
   - Word: `.docx` or `.doc`
   - Text: `.txt`
3. You'll see "Selected: [filename]" confirmation

### Step 4: Run Validation

1. Click the **"Validate Document"** button
2. Wait for validation to complete (you'll see a loading spinner)
3. Results will appear below the button

## Understanding Results

### Completeness Score

The large circular indicator shows your document's completeness:

- **Green (80-100%)**: Excellent - Document meets most requirements
- **Orange (50-79%)**: Good - Some improvements needed
- **Red (0-49%)**: Needs Work - Many gaps identified

### Statistics Dashboard

Six key metrics displayed in cards:

1. **Total Rules**: Number of validation rules checked
2. **Passed**: Rules that passed validation (green)
3. **Failed**: Rules that failed validation (red)
4. **Critical Issues**: High-priority problems requiring immediate attention
5. **Warnings**: Medium-priority issues to address
6. **Info**: Low-priority suggestions for improvement

### Validation Alerts

Each alert card shows:

- **Title**: Brief description of the issue
- **Severity Badge**: Critical (red), Warning (orange), or Info (blue)
- **Message**: Detailed explanation of what's missing or incorrect
- **Remediation Steps**: Numbered list of actions to fix the issue
- **Action Buttons**: Acknowledge, Resolve, or Dismiss

## Interacting with Alerts

### Acknowledge an Alert

**When to use**: You've seen the alert and plan to address it later

**How to**:
1. Click the **"Acknowledge"** button on the alert
2. Status badge changes to "Acknowledged" (orange)
3. Alert remains visible for tracking

### Resolve an Alert

**When to use**: You've fixed the issue in your document

**How to**:
1. Click the **"Mark as Resolved"** button
2. Status badge changes to "Resolved" (green)
3. Alert card becomes grayed out
4. All buttons are disabled

### Dismiss an Alert

**When to use**: Alert is not relevant or you want to hide it

**How to**:
1. Click the **"Dismiss"** button
2. Alert fades out and is removed from view
3. Alert is no longer tracked

## Example Workflow

### Scenario: Validating an IND Module 2.6.2 Document

1. **Upload Template**
   - Select `template_2.6.2_poc.xlsx`
   - Choose "Excel" template type

2. **Upload Document**
   - Select your draft `module_2.6.2.pdf`

3. **Run Validation**
   - Click "Validate Document"
   - Wait 2-5 seconds for processing

4. **Review Results**
   - Completeness Score: 65% (Orange - needs improvement)
   - Statistics:
     - Total Rules: 87
     - Passed: 56
     - Failed: 31
     - Critical Issues: 2
     - Warnings: 8
     - Info: 21

5. **Address Critical Issues First**
   - Find alerts with red "CRITICAL" badges
   - Read remediation steps
   - Fix issues in your document
   - Mark as resolved when complete

6. **Handle Warnings**
   - Review orange "WARNING" badges
   - Prioritize based on your timeline
   - Acknowledge to track progress

7. **Consider Info Suggestions**
   - Review blue "INFO" badges
   - Implement if time permits
   - Dismiss if not applicable

8. **Re-validate**
   - Upload the updated document
   - Run validation again
   - Verify improvements in score

## Tips for Best Results

### Template Selection

- **Use the correct template** for your document type
- **Keep templates updated** with latest regulatory requirements
- **Verify template format** matches your selection (Excel vs JSON)

### Document Preparation

- **Complete as much as possible** before validation
- **Include all required sections** even if partially filled
- **Use proper section numbering** (e.g., 2.6.2.1, 2.6.2.2)
- **Reference source documents** where required

### Validation Strategy

1. **Run early and often** - Don't wait until the end
2. **Fix critical issues first** - Highest impact on completeness
3. **Track progress** - Use acknowledge feature to mark work in progress
4. **Re-validate frequently** - Verify fixes are working
5. **Document changes** - Keep notes on what you fixed

### Alert Management

- **Don't dismiss too quickly** - You might need the remediation steps later
- **Acknowledge to track** - Shows you're aware and working on it
- **Resolve when verified** - Only mark resolved after confirming the fix
- **Export results** (future feature) - Save validation reports for records

## Troubleshooting

### "Missing required fields" Error

**Problem**: API returns 400 error about missing fields

**Solution**:
- Ensure both template and document files are selected
- Verify template type is selected (Excel or JSON)
- Try uploading files again

### "Template parsing failed" Error

**Problem**: Template file cannot be parsed

**Solution**:
- Verify template file is not corrupted
- Check file format matches selected type (Excel vs JSON)
- Try opening template in Excel/text editor to verify it's valid
- Use a different template file

### "Document analysis failed" Error

**Problem**: Document file cannot be analyzed

**Solution**:
- Verify document file is not corrupted
- Check file format is supported (PDF, DOCX, TXT)
- Try a different document file
- For PDF: Ensure it's not password-protected or image-only

### Validation Takes Too Long

**Problem**: Validation spinner runs for more than 30 seconds

**Solution**:
- Check your internet connection
- Try with a smaller document first
- Refresh the page and try again
- Check browser console for errors (F12)

### No Alerts Displayed

**Problem**: Validation completes but no alerts shown

**Possible Reasons**:
1. **Document is complete** - Congratulations! No issues found
2. **Template has no rules** - Verify template is properly formatted
3. **Display issue** - Refresh page and try again

## API Integration (For Developers)

### Endpoint

```
POST /api/validation
```

### Request Format

```javascript
{
  templateFile: "base64_encoded_content",
  templateName: "template.xlsx",
  documentFile: "base64_encoded_content",
  documentName: "document.pdf",
  templateType: "excel" // or "json"
}
```

### Response Format

```javascript
{
  success: true,
  message: "Validation completed successfully",
  data: {
    documentName: "document.pdf",
    templateName: "template.xlsx",
    validation: {
      completenessPercentage: 75,
      totalRules: 87,
      passedRules: 65,
      failedRules: 22,
      weightedScore: 80,
      breakdown: {
        critical: { passed: 1, failed: 0 },
        warning: { passed: 10, failed: 1 },
        info: { passed: 54, failed: 21 }
      }
    },
    gaps: [...],
    alerts: [...],
    processingTime: 1250,
    analysisDate: "2026-01-18T..."
  }
}
```

## Support

For technical issues or questions:

1. Check this user guide first
2. Review the troubleshooting section
3. Check the developer documentation in `gap_analysis_scoping/docs/`
4. Contact your system administrator

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-18  
**Status**: Production Ready
