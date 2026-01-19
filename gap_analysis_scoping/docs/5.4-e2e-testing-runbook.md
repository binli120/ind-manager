# Gap Analysis E2E Testing Runbook

## Overview

This runbook provides comprehensive instructions for testing the Gap Analysis Completeness Check system end-to-end. It covers manual testing through the HTML interface, automated testing via API, and validation of all system components.

**System Version**: 1.0.0  
**Last Updated**: 2026-01-18  
**Status**: Production Ready

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start Testing](#quick-start-testing)
3. [Manual E2E Testing](#manual-e2e-testing)
4. [Automated Testing](#automated-testing)
5. [Component Testing](#component-testing)
6. [Expected Results](#expected-results)
7. [Troubleshooting](#troubleshooting)
8. [Test Data](#test-data)

---

## Prerequisites

### Required Software

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Web Browser**: Chrome, Firefox, Safari, or Edge (latest version)
- **Text Editor**: For viewing test results and logs

### Environment Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Verify server is running**:
   - Open browser to `http://localhost:3000`
   - Server should respond without errors

---

## Quick Start Testing

### 5-Minute Smoke Test

This quick test verifies the system is working end-to-end.

**Steps**:

1. **Open the HTML interface**:
   - Navigate to `gap_analysis_scoping/features/gap-analysis-poc.html`
   - Open in your browser (double-click or right-click → Open with → Browser)

2. **Upload template**:
   - Click "Upload Template File"
   - Select `gap_analysis_scoping/resources/template_2.6.2_poc.xlsx`
   - Verify "Selected: template_2.6.2_poc.xlsx" appears
   - Ensure "Excel" radio button is selected

3. **Upload document**:
   - Click "Upload Document to Validate"
   - Select `gap_analysis_scoping/docs/2.6.2-summary.json`
   - Verify "Selected: 2.6.2-summary.json" appears

4. **Run validation**:
   - Click "Validate Document" button
   - Wait for spinner to complete (2-5 seconds)

5. **Verify results**:
   - ✅ Completeness score displays (should be ~12-15%)
   - ✅ Statistics show: Total Rules (87), Passed (~10-13), Failed (~74-77)
   - ✅ Alert cards appear with severity badges
   - ✅ Remediation steps are visible
   - ✅ Action buttons work (Acknowledge, Resolve, Dismiss)

**Expected Outcome**: System displays validation results with low completeness score and multiple alerts.

---

## Manual E2E Testing

### Test Scenario 1: Excel Template with JSON Document

**Objective**: Validate that Excel templates parse correctly and validate JSON documents.

**Steps**:

1. **Prepare files**:
   - Template: `gap_analysis_scoping/resources/template_2.6.2_poc.xlsx`
   - Document: `gap_analysis_scoping/docs/2.6.2-summary.json`

2. **Execute validation**:
   - Open `gap-analysis-poc.html` in browser
   - Upload template (Excel type selected)
   - Upload document
   - Click "Validate Document"

3. **Verify results**:
   - **Completeness Score**: 10-20% (red indicator)
   - **Total Rules**: 87 rules
   - **Passed Rules**: 10-15 rules
   - **Failed Rules**: 72-77 rules
   - **Critical Issues**: 0-1
   - **Warnings**: 10-12
   - **Info**: 60-65

4. **Verify alerts**:
   - Alerts are sorted by priority (critical → warning → info)
   - Each alert has:
     - Title (section identifier)
     - Severity badge (color-coded)
     - Message (description of gap)
     - Remediation steps (numbered list)
     - Action buttons (Acknowledge, Resolve, Dismiss)
     - Status badge (Open)

5. **Test alert interactions**:
   - Click "Acknowledge" on first alert
     - Status badge changes to "Acknowledged" (orange)
     - Acknowledge button becomes disabled
   - Click "Mark as Resolved" on second alert
     - Status badge changes to "Resolved" (green)
     - Alert card grays out
     - All buttons become disabled
   - Click "Dismiss" on third alert
     - Alert fades out
     - Alert is removed from display

**Expected Outcome**: 
- Low completeness score due to minimal document content
- Multiple alerts for missing sections
- Alert interactions work correctly

---

### Test Scenario 2: JSON Template with Text Document

**Objective**: Validate that JSON templates work with text documents.

**Steps**:

1. **Create test files**:
   
   **Template** (`test-template.json`):
   ```json
   {
     "section": "2.6.2",
     "summary_text": "Brief summary of nonclinical findings",
     "status": "complete",
     "summary_id": "test-123"
   }
   ```

   **Document** (`test-document.txt`):
   ```
   Section 2.6.2: Nonclinical Overview
   
   This document contains a brief summary of nonclinical findings.
   The status is complete and the summary ID is test-123.
   ```

2. **Execute validation**:
   - Open `gap-analysis-poc.html`
   - Upload `test-template.json`
   - Select "JSON" radio button
   - Upload `test-document.txt`
   - Click "Validate Document"

3. **Verify results**:
   - **Completeness Score**: 80-100% (green indicator)
   - **Passed Rules**: Most rules should pass
   - **Failed Rules**: 0-2 rules
   - **Alerts**: 0-2 alerts (if any)

**Expected Outcome**: 
- High completeness score
- Few or no alerts
- Success message if 100% complete

---

### Test Scenario 3: Error Handling

**Objective**: Verify system handles errors gracefully.

#### Test 3a: Missing Template

**Steps**:
1. Open `gap-analysis-poc.html`
2. Upload document only (no template)
3. Click "Validate Document"

**Expected Outcome**:
- Button remains disabled (cannot validate without template)

#### Test 3b: Missing Document

**Steps**:
1. Open `gap-analysis-poc.html`
2. Upload template only (no document)
3. Click "Validate Document"

**Expected Outcome**:
- Button remains disabled (cannot validate without document)

#### Test 3c: Invalid Template Format

**Steps**:
1. Create invalid JSON file: `{"invalid": json}`
2. Upload as template with "JSON" selected
3. Upload any document
4. Click "Validate Document"

**Expected Outcome**:
- Error alert displays: "Template parsing failed"
- Error details explain JSON syntax error
- No validation results shown

#### Test 3d: Corrupted Excel File

**Steps**:
1. Create text file with `.xlsx` extension
2. Upload as template with "Excel" selected
3. Upload any document
4. Click "Validate Document"

**Expected Outcome**:
- Error alert displays: "Template parsing failed"
- Error details explain Excel parsing error

---

### Test Scenario 4: Large Document Validation

**Objective**: Verify system handles larger documents efficiently.

**Steps**:

1. **Create large document**:
   - Copy `2.6.2-summary.json`
   - Add multiple sections (repeat content 10-20 times)
   - Save as `large-document.json`

2. **Execute validation**:
   - Upload `template_2.6.2_poc.xlsx`
   - Upload `large-document.json`
   - Click "Validate Document"
   - Note processing time

3. **Verify results**:
   - Validation completes within 10 seconds
   - Results display correctly
   - No browser freezing or errors

**Expected Outcome**: 
- System handles large documents without performance issues
- Processing time displayed in results

---

## Automated Testing

### Run All Tests

Execute the complete test suite:

```bash
npm test gap_analysis_scoping/tests
```

**Expected Output**:
```
✓ Template Parser Tests (8 tests)
✓ Document Analyzer Tests (6 tests)
✓ Rule Engine Tests (7 tests)
✓ Alert Generator Tests (5 tests)
✓ Frontend-Backend Integration (5 tests)

Test Files: 5 passed (5)
Tests: 31 passed (31)
Duration: 3-5 seconds
```

---

### Run Specific Test Suites

#### Template Parser Tests

```bash
npm test gap_analysis_scoping/tests/template-parser.test.ts
```

**What it tests**:
- Excel template parsing
- JSON template parsing
- Rule extraction from templates
- Multi-dimensional validation rules

**Expected Results**:
- ✅ Parses Excel files correctly
- ✅ Extracts 87 rules from template_2.6.2_poc.xlsx
- ✅ Parses JSON templates correctly
- ✅ Handles invalid templates gracefully

---

#### Document Analyzer Tests

```bash
npm test gap_analysis_scoping/tests/document-analyzer.test.ts
```

**What it tests**:
- Document content analysis
- Gap detection
- Completeness calculation
- Format validation

**Expected Results**:
- ✅ Analyzes documents correctly
- ✅ Identifies missing content
- ✅ Calculates accurate completeness scores
- ✅ Generates gap reports

---

#### Rule Engine Tests

```bash
npm test gap_analysis_scoping/tests/rule-engine.test.ts
```

**What it tests**:
- Rule execution logic
- Completeness scoring
- Issue prioritization
- Severity handling

**Expected Results**:
- ✅ Executes rules correctly
- ✅ Calculates weighted scores
- ✅ Prioritizes issues by severity and impact
- ✅ Handles edge cases

---

#### Alert Generator Tests

```bash
npm test gap_analysis_scoping/tests/alert-generator.test.ts
```

**What it tests**:
- Alert creation from gaps
- Remediation step generation
- Alert formatting for HTML
- Alert lifecycle management

**Expected Results**:
- ✅ Generates alerts from validation gaps
- ✅ Creates actionable remediation steps
- ✅ Formats alerts for display
- ✅ Manages alert status transitions

---

#### Integration Tests

```bash
npm test gap_analysis_scoping/tests/frontend-backend-integration.test.ts
```

**What it tests**:
- Complete validation workflow
- API request/response structure
- Frontend-backend communication
- End-to-end data flow

**Expected Results**:
- ✅ Complete workflow executes successfully
- ✅ API returns correct response structure
- ✅ Alerts display correctly in frontend
- ✅ All components integrate properly

---

### Run Integration Test with Real Data

Execute manual integration test with real template and document:

```bash
npx tsx gap_analysis_scoping/tests/test-rule-engine-integration.ts
```

**Expected Output**:
```
=== RuleEngine Integration Test ===

📄 Loading template: template_2.6.2_poc.xlsx
✅ Template loaded: IND Module 2.6.2 Validation Template
   Rules extracted: 87

📄 Loading real document: 2.6.2-summary.json
✅ Document loaded: Section 2.6.2
   Status: draft
   Summary text length: 450 characters

🔍 Executing validation rules...

📊 Completeness Score:
   Overall Score: 12%
   Weighted Score: 15%
   Total Rules: 87
   Passed: 11
   Failed: 76

📈 Breakdown by Severity:
   Critical: 1 passed, 0 failed
   Warning: 10 passed, 1 failed
   Info: 0 passed, 75 failed

🚨 Prioritized Issues (76 total):

1. [Priority 10] WARNING - HIGH impact
   Rule: 2.6.2.1 - a: Brief Summary - Content Presence
   Required: Yes
   Hint: Add the required section with complete content...

... (showing top 5 issues)

✅ Consistency Check:
   RuleEngine failed rules: 76
   DocumentAnalyzer gaps: 76
   ✅ Results are consistent

=== Integration Test Complete ===
```

---

## Component Testing

### Test Template Parser Independently

```bash
npx tsx gap_analysis_scoping/tests/test-excel-parsing.ts
```

**What it tests**:
- Excel file reading
- Multi-dimensional rule extraction
- Rule categorization by severity

**Expected Output**:
```
=== Excel Template Parsing Test ===

📄 Loading template: template_2.6.2_poc.xlsx
✅ Template loaded successfully

📊 Validation Rules Extracted:
   Total Rules: 87
   Critical: 1
   Warning: 11
   Info: 75

📋 Rule Breakdown:
   Content Presence: 16
   Data Inputs: 14
   Source Traceability: 15
   Critical Claims: 12
   Modality Requirements: 25
   Tables/Figures: 5

✅ Multi-dimensional extraction complete
```

---

### Test Document Analyzer Independently

```bash
npx tsx gap_analysis_scoping/tests/test-document-analyzer.ts
```

**What it tests**:
- Document parsing
- Content extraction
- Gap identification

**Expected Output**:
```
=== Document Analyzer Test ===

📄 Analyzing document: 2.6.2-summary.json
✅ Document parsed successfully

📊 Analysis Results:
   Completeness: 12%
   Gaps Found: 76
   Processing Time: 150ms

🔍 Sample Gaps:
   1. Missing: 2.6.2.1 - a (Brief Summary)
   2. Missing: 2.6.2.2 - a (Primary Pharmacodynamics)
   3. Missing: 2.6.2.3 - a (Secondary Pharmacodynamics)
   ...

✅ Analysis complete
```

---

## Expected Results

### Validation with Minimal Document

**Input**:
- Template: `template_2.6.2_poc.xlsx` (87 rules)
- Document: `2.6.2-summary.json` (minimal content)

**Expected Results**:

| Metric | Expected Value | Acceptable Range |
|--------|---------------|------------------|
| Completeness Score | 12% | 10-15% |
| Total Rules | 87 | 87 |
| Passed Rules | 11 | 10-13 |
| Failed Rules | 76 | 74-77 |
| Critical Issues | 0 | 0-1 |
| Warnings | 11 | 10-12 |
| Info Issues | 75 | 73-77 |
| Processing Time | 1-2 seconds | < 5 seconds |
| Alerts Generated | 76 | 74-77 |

**Alert Distribution**:
- Critical alerts: 0-1 (red badges)
- Warning alerts: 10-12 (orange badges)
- Info alerts: 73-77 (blue badges)

**Alert Content**:
- Each alert has title, message, severity, remediation steps
- Remediation steps are actionable (numbered list)
- Alerts are sorted by priority (high to low)

---

### Validation with Complete Document

**Input**:
- Template: Simple JSON template (4 rules)
- Document: Complete text document with all required content

**Expected Results**:

| Metric | Expected Value |
|--------|---------------|
| Completeness Score | 100% |
| Total Rules | 4 |
| Passed Rules | 4 |
| Failed Rules | 0 |
| Alerts Generated | 0 |

**Display**:
- Green completeness indicator
- Success message: "No Issues Found"
- "Your document meets all validation requirements!"

---

### API Response Structure

**Successful Validation**:

```json
{
  "success": true,
  "message": "Validation completed successfully",
  "data": {
    "documentName": "2.6.2-summary.json",
    "templateName": "template_2.6.2_poc.xlsx",
    "templateType": "excel",
    "status": "completed",
    "validation": {
      "completenessPercentage": 12,
      "totalRules": 87,
      "passedRules": 11,
      "failedRules": 76,
      "weightedScore": 15,
      "breakdown": {
        "critical": { "passed": 1, "failed": 0 },
        "warning": { "passed": 10, "failed": 1 },
        "info": { "passed": 0, "failed": 75 }
      }
    },
    "gaps": [
      {
        "ruleId": "2.6.2.1 - a: Brief Summary - Content Presence",
        "severity": "warning",
        "category": "missing_content",
        "description": "Section 2.6.2.1 - a is missing or incomplete",
        "remediationSteps": ["Add the required section..."],
        "required": true
      }
      // ... more gaps
    ],
    "alerts": [
      {
        "id": "alert-1",
        "gapId": "2.6.2.1 - a",
        "title": "Missing: 2.6.2.1 - a (Brief Summary)",
        "message": "Section 2.6.2.1 - a is missing...",
        "severity": "warning",
        "remediationSteps": ["Add the required section..."],
        "status": "open",
        "priority": 10,
        "required": true
      }
      // ... more alerts
    ],
    "processingTime": 1250,
    "analysisDate": "2026-01-18T10:30:00.000Z"
  }
}
```

**Error Response**:

```json
{
  "error": "Template parsing failed",
  "details": "Invalid Excel file format: Unable to read workbook"
}
```

---

## Troubleshooting

### Issue: Validation Button Disabled

**Symptoms**:
- "Validate Document" button is grayed out
- Cannot click to start validation

**Causes**:
1. Template file not uploaded
2. Document file not uploaded
3. Template type not selected

**Solutions**:
1. Verify both files are uploaded (check for "Selected: filename" text)
2. Ensure template type radio button is selected (Excel or JSON)
3. Refresh page and try again

---

### Issue: "Template parsing failed" Error

**Symptoms**:
- Red error alert appears
- Message: "Template parsing failed"

**Causes**:
1. Corrupted template file
2. Wrong template type selected (Excel vs JSON)
3. Invalid file format

**Solutions**:
1. Verify template file opens correctly in Excel/text editor
2. Ensure correct template type is selected:
   - `.xlsx` or `.xls` → Select "Excel"
   - `.json` → Select "JSON"
3. Try a different template file
4. Re-download template from resources folder

---

### Issue: "Document analysis failed" Error

**Symptoms**:
- Red error alert appears
- Message: "Document analysis failed"

**Causes**:
1. Corrupted document file
2. Unsupported file format
3. File too large

**Solutions**:
1. Verify document file opens correctly
2. Check file format is supported (PDF, DOCX, TXT, JSON)
3. Try a smaller document file
4. Check browser console for detailed error (F12)

---

### Issue: Validation Takes Too Long

**Symptoms**:
- Spinner runs for more than 30 seconds
- Browser becomes unresponsive

**Causes**:
1. Very large document file
2. Network issues
3. Server not running

**Solutions**:
1. Check development server is running (`npm run dev`)
2. Verify server is accessible at `http://localhost:3000`
3. Try with a smaller document first
4. Check browser console for errors (F12)
5. Restart development server

---

### Issue: No Alerts Displayed

**Symptoms**:
- Validation completes successfully
- Completeness score shows
- No alert cards appear

**Possible Reasons**:
1. **Document is complete** (100% score) - This is expected!
2. **Template has no rules** - Check template file
3. **Display issue** - Refresh page

**Solutions**:
1. If score is 100%, this is correct behavior
2. Verify template file has validation rules
3. Check browser console for JavaScript errors
4. Try a different template/document combination

---

### Issue: Alert Buttons Not Working

**Symptoms**:
- Clicking Acknowledge/Resolve/Dismiss does nothing
- No visual feedback

**Causes**:
1. JavaScript error in browser
2. Event listeners not attached
3. Browser compatibility issue

**Solutions**:
1. Open browser console (F12) and check for errors
2. Refresh page and try again
3. Try a different browser (Chrome, Firefox, Safari)
4. Clear browser cache

---

### Issue: Tests Failing

**Symptoms**:
- `npm test` shows failed tests
- Error messages in console

**Common Causes & Solutions**:

#### Missing Dependencies
```bash
npm install
```

#### TypeScript Compilation Errors
```bash
npm run build
```

#### Missing Test Files
- Verify all test files exist in `gap_analysis_scoping/tests/`
- Check file paths in test imports

#### Missing Resource Files
- Verify `template_2.6.2_poc.xlsx` exists in `gap_analysis_scoping/resources/`
- Verify `2.6.2-summary.json` exists in `gap_analysis_scoping/docs/`

---

## Test Data

### Available Test Templates

#### 1. template_2.6.2_poc.xlsx
- **Location**: `gap_analysis_scoping/resources/template_2.6.2_poc.xlsx`
- **Type**: Excel
- **Rules**: 87 validation rules
- **Sections**: IND Module 2.6.2 (Nonclinical Overview)
- **Use Case**: Comprehensive validation with multi-dimensional rules

#### 2. template_v0.xlsx
- **Location**: `gap_analysis_scoping/resources/template_v0.xlsx`
- **Type**: Excel
- **Rules**: Varies
- **Use Case**: Alternative template structure

---

### Available Test Documents

#### 1. 2.6.2-summary.json
- **Location**: `gap_analysis_scoping/docs/2.6.2-summary.json`
- **Type**: JSON
- **Content**: Minimal IND Module 2.6.2 summary
- **Expected Score**: 10-15% completeness
- **Use Case**: Testing with incomplete document

**Content**:
```json
{
  "section": "2.6.2",
  "summary_text": "Brief overview of nonclinical findings...",
  "status": "draft",
  "summary_id": "summary-2.6.2-001"
}
```

---

### Creating Custom Test Data

#### Custom JSON Template

Create `custom-template.json`:

```json
{
  "rules": [
    {
      "name": "Section Header",
      "type": "content_presence",
      "field": "header",
      "required": true,
      "severity": "critical"
    },
    {
      "name": "Summary Text",
      "type": "content_presence",
      "field": "summary",
      "required": true,
      "severity": "warning"
    },
    {
      "name": "Author Name",
      "type": "content_presence",
      "field": "author",
      "required": false,
      "severity": "info"
    }
  ]
}
```

#### Custom Test Document

Create `custom-document.txt`:

```
Header: Test Document

Summary: This is a test document for validation.

Author: Test User
```

**Expected Result**: 100% completeness (all 3 rules pass)

---

## Test Checklist

Use this checklist to verify all testing is complete:

### Manual Testing
- [ ] Quick smoke test (5 minutes)
- [ ] Excel template with JSON document
- [ ] JSON template with text document
- [ ] Error handling (missing files)
- [ ] Error handling (invalid formats)
- [ ] Large document validation
- [ ] Alert interactions (Acknowledge)
- [ ] Alert interactions (Resolve)
- [ ] Alert interactions (Dismiss)

### Automated Testing
- [ ] All unit tests pass
- [ ] Template parser tests pass
- [ ] Document analyzer tests pass
- [ ] Rule engine tests pass
- [ ] Alert generator tests pass
- [ ] Integration tests pass
- [ ] Real data integration test passes

### API Testing
- [ ] POST /api/validation returns correct structure
- [ ] GET /api/validation health check works
- [ ] Error responses have correct format
- [ ] Processing time is reasonable (< 5 seconds)

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Performance
- [ ] Small documents (< 1KB) validate in < 2 seconds
- [ ] Medium documents (1-10KB) validate in < 5 seconds
- [ ] Large documents (10-100KB) validate in < 10 seconds
- [ ] No browser freezing or crashes

---

## Conclusion

This runbook provides comprehensive testing coverage for the Gap Analysis Completeness Check system. Follow the test scenarios in order, verify expected results, and use the troubleshooting section if issues arise.

**Key Success Criteria**:
- ✅ All automated tests pass
- ✅ Manual E2E tests complete successfully
- ✅ Error handling works correctly
- ✅ Performance is acceptable
- ✅ Alert interactions function properly

**Next Steps After Testing**:
1. Document any issues found
2. Create bug reports for failures
3. Verify fixes with regression testing
4. Deploy to production environment

---

**Document Version**: 1.0.0  
**Author**: Gap Analysis Team  
**Date**: 2026-01-18  
**Status**: Complete
