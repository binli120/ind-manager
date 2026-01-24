# Fix: Display Document Content Instead of Template Text

## Issue
The in-editor validation was displaying template requirement text in large placeholder blocks instead of showing the actual uploaded document content with small inline validation indicators.

## Root Cause
1. The HTML file was missing a document file upload input - only had template upload
2. The `updateValidationIndicators()` function was creating large placeholder elements for validation gaps without first loading and displaying the actual document content
3. The "Load Test Files" button only loaded the template, not the document

## Solution

### 1. Add Document File Upload Input
Added a second file input for uploading the document to validate:
- Template file input: for the validation rules template (Excel or JSON)
- Document file input: for the actual document to validate (PDF, DOCX, TXT, JSON)
- Both files are now required before validation can start

### 2. Update "Load Test Files" Button
Modified to load both template and document test files:
- Fetches template from `/api/gap-analysis/test-files?type=template`
- Fetches document from `/api/gap-analysis/test-files?type=document`
- Updates both file name displays
- Enables validation button only when both files are loaded

### 3. Load Document Content on Validation Start
Added `loadDocumentContent()` function that:
- Reads the uploaded document file
- For JSON files: extracts the `summary_text` field containing the actual document content
- For other files: reads as plain text
- Converts plain text to formatted HTML using `convertTextToHTML()`
- Displays the document content in the editor

### 4. Convert Text to HTML with Proper Formatting
Created `convertTextToHTML()` function that:
- Splits text into lines
- Identifies section headings (e.g., "2.6.2.1 Brief Summary") and formats as `<h2>`
- Identifies subsection headings (e.g., "2.6.2.2-a Objectives") and formats as `<h3>`
- Formats regular text as `<p>` paragraphs
- Preserves empty lines for spacing

### 5. Add Small Inline Indicators
Replaced large placeholder blocks with small inline badges:
- **Inline Badges**: Small colored badges (🔴, ⚠️, ℹ️) appear next to section headings
- **Missing Sections Banner**: A compact banner at the top lists missing sections
- **Side Panel**: Clicking badges opens a side panel with full validation details

### 6. New Functions

#### `handleDocumentChange(e)`
- Handles document file selection
- Updates file name display
- Checks if validation button should be enabled

#### `checkStartValidationButton()`
- Enables validation button only when both template and document are selected
- Updates button text to show current status

#### `readFileAsText(file)`
- Reads uploaded file as text
- Returns a Promise with file content

#### `addInlineIndicators(gaps)`
- Finds all headings in the document
- Matches headings with validation gaps
- Adds small inline badges next to relevant headings
- Creates a banner for missing sections

#### `createInlineBadge(gaps)`
- Creates a small, colored badge showing issue count
- Color-coded by severity (red for critical, yellow for warning, blue for info)
- Clickable to show details in side panel

#### `createMissingSectionsBanner(gaps)`
- Shows a compact banner for missing sections
- Lists first 5 missing sections
- Provides "View All" button to open side panel

#### `createValidationSidePanel(gaps)`
- Creates a slide-out side panel (400px wide)
- Initially hidden, slides in from right when clicked
- Shows detailed validation information

#### `showGapDetailsInPanel(gaps)`
- Populates side panel with gap details
- Shows severity, description, and remediation steps
- Formatted as cards with color-coded borders

## User Experience

### Before
- Only template file upload available
- Editor showed large placeholder blocks with template requirements
- No actual document content visible
- Confusing UX - users couldn't edit their document

### After
- Both template and document file uploads available
- "Load Test Files" loads both files automatically
- Editor displays the actual document content from uploaded file
- Small inline badges indicate issues at specific locations
- Clicking badges opens side panel with full details
- Users can edit their document with contextual hints
- Missing sections shown in a compact banner at the top

## Testing

To test the changes:

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3001/gap-analysis-html`
3. Click "Load Test Files" to load both template and document
4. Click "Start Validation" to begin validation
5. Observe:
   - Document content is displayed in the editor
   - Small inline badges appear next to section headings
   - Missing sections banner appears at the top
   - Clicking badges opens the side panel with details

## Files Modified

- `public/gap-analysis-editor.html`:
  - Added document file input (`<input id="documentFile">`)
  - Added `documentFile` state variable
  - Added `handleDocumentChange()` function
  - Added `checkStartValidationButton()` function
  - Modified `loadTestFiles()` to fetch both template and document
  - Modified `loadDocumentContent()` to read from uploaded file
  - Added `readFileAsText()` helper function
  - Modified `performValidation()` to use uploaded document file
  - Replaced `updateValidationIndicators()` with new implementation
  - Added `addInlineIndicators()`, `createInlineBadge()`, `createMissingSectionsBanner()`
  - Added `createValidationSidePanel()`, `showGapDetailsInPanel()`
  - Removed old placeholder block functions

## Next Steps

1. Test with different document formats (PDF, DOCX)
2. Improve section matching algorithm for more accurate indicator placement
3. Add ability to insert missing sections from the side panel
4. Implement real-time validation updates as user edits
5. Add keyboard shortcuts for navigating between issues
6. Support drag-and-drop file upload
