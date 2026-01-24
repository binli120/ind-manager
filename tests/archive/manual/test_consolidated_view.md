# Manual Test: Consolidated View (Report + Editor)

## Test ID: 7-consolidated-view

## Objective
Verify that the consolidated gap-analysis.html file properly displays both Report View and Editor View with proper view switching and inline validation indicators.

## Prerequisites
- Development server running (npm run dev)
- Test files available:
  - `gap_analysis_scoping/resources/template_2.6.2_poc.json`
  - `gap_analysis_scoping/resources/2.6.2-summary.json`

## Test Steps

### 1. Access Consolidated View
1. Navigate to: `http://localhost:3001/gap-analysis.html`
2. **Expected**: Page loads with header "Gap Analysis - Consolidated View"
3. **Expected**: Two view mode buttons visible: "📊 Report View" and "✏️ Editor View"
4. **Expected**: Report View button is active (highlighted) by default
5. **Expected**: Description shows: "Best for early-stage documents with many missing sections..."

### 2. Load Test Files
1. Click "Load Test Files" button
2. **Expected**: Button text changes to "Loading..."
3. **Expected**: After ~1-2 seconds, button shows "✓ Test Files Loaded" with green background
4. **Expected**: Template file name shows: "Selected: template_2.6.2_poc.json (Test File)"
5. **Expected**: Document file name shows: "Selected: 2.6.2-summary.json (Test File)"
6. **Expected**: "Start Validation" button becomes enabled

### 3. Test Report View
1. Click "Start Validation" button
2. **Expected**: Validation status shows "Validating document..."
3. **Expected**: After ~2-3 seconds, validation completes
4. **Expected**: Validation status shows "Validation complete!" in green
5. **Expected**: Results section appears with:
   - Completeness score circle (percentage)
   - Stats grid showing: Total Rules, Passed, Failed, Critical Issues, Warnings, Info
   - List of validation alerts with:
     - Alert title and severity badge
     - Alert message
     - Remediation steps
     - Action buttons (Acknowledge, Mark as Resolved, Dismiss)

### 4. Test Alert Interactions (Report View)
1. Find any alert in the list
2. Click "Acknowledge" button
3. **Expected**: Status badge changes to "Acknowledged" (yellow)
4. **Expected**: Acknowledge button becomes disabled
5. Find another alert
6. Click "Mark as Resolved" button
7. **Expected**: Status badge changes to "Resolved" (green)
8. **Expected**: Alert becomes semi-transparent (opacity 0.6)
9. **Expected**: All action buttons become disabled
10. Find another alert
11. Click "Dismiss" button
12. **Expected**: Alert fades out and disappears from the list

### 5. Switch to Editor View
1. Click "✏️ Editor View" button
2. **Expected**: Button becomes active (highlighted)
3. **Expected**: Report View button becomes inactive
4. **Expected**: Description changes to: "Best for later-stage editing with inline validation..."
5. **Expected**: Report view content disappears
6. **Expected**: Editor view appears with:
   - Toolbar with formatting buttons (B, I, U, H2, H3, P, List)
   - Validation badge showing issue count (e.g., "87 issues")
   - Editor content area with document text

### 6. Test Inline Indicators (Editor View)
1. Scroll through the editor content
2. **Expected**: Document content is loaded and formatted with headings and paragraphs
3. **Expected**: Missing sections banner appears at the top showing:
   - "⚠️ X Missing Sections"
   - List of first 5 missing sections
   - "View All Missing Sections" button
   - "View Report" button
4. **Expected**: Inline badges appear next to section headings showing:
   - Severity icon (🔴 for critical, ⚠️ for warning, ℹ️ for info)
   - Issue count for that section
   - Colored background based on severity

### 7. Test Side Panel (Editor View)
1. Click on any inline badge next to a heading
2. **Expected**: Side panel slides in from the right
3. **Expected**: Panel shows "Validation Issues" header with close button
4. **Expected**: Panel lists all issues for that section with:
   - Severity icon and rule name
   - Description
   - "How to fix:" section with remediation steps
5. Click the close button (✕)
6. **Expected**: Panel slides out to the right

### 8. Test Missing Sections Banner (Editor View)
1. Scroll to the top of the editor
2. Click "View All Missing Sections" button in the banner
3. **Expected**: Side panel opens showing all missing sections
4. Click "View Report" button in the banner
5. **Expected**: View switches back to Report View
6. **Expected**: Report View shows all validation alerts

### 9. Test View Switching with Validation Results
1. Switch between Report View and Editor View multiple times
2. **Expected**: Validation results persist across view switches
3. **Expected**: No need to re-run validation
4. **Expected**: Both views show the same validation data in different formats

### 10. Test Editor Formatting (Editor View)
1. Switch to Editor View
2. Click in the editor content area
3. Select some text
4. Click "B" button in toolbar
5. **Expected**: Selected text becomes bold
6. Click "H2" button
7. **Expected**: Current line becomes a heading 2
8. **Expected**: Inline indicators remain visible and functional

## Expected Results Summary

### Report View
- ✅ Shows comprehensive list of all validation issues
- ✅ Displays completeness score and statistics
- ✅ Provides detailed remediation steps for each issue
- ✅ Allows acknowledging, resolving, and dismissing alerts
- ✅ Best for early-stage documents with many gaps

### Editor View
- ✅ Shows document content in editable format
- ✅ Displays inline validation indicators next to relevant sections
- ✅ Shows missing sections banner at the top
- ✅ Provides side panel with detailed issue information
- ✅ Allows quick navigation between issues
- ✅ Best for later-stage editing with fewer gaps

### View Switching
- ✅ Smooth transition between views
- ✅ Validation results persist across switches
- ✅ No data loss or re-validation needed
- ✅ Clear visual indication of active view

## Pass Criteria
- All expected results are observed
- No console errors
- View switching works smoothly
- Inline indicators are visible and clickable
- Side panel opens and closes correctly
- Report view shows all alerts with proper formatting
- Both views display the same validation data

## Notes
- The consolidated view successfully combines both UX patterns
- Report View is ideal for initial document review
- Editor View is ideal for active editing and fixing issues
- Users can switch between views based on their workflow needs
