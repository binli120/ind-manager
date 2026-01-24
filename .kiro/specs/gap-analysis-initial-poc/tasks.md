# Implementation Plan: Gap Analysis Completeness Check

## Overview

This implementation plan creates a simplified proof-of-concept for document completeness validation using a simple HTML frontend and Next.js API backend. The system reads local documents, validates them against Excel or JSON templates, and provides interactive alerts - no database or file upload complexity.

## Tasks
- [x] structure: store tests under gap_analysis_scoping/tests, store .md and docs under gap_analysis_scoping/docs, store code under gap_analysis_scoping/features. 
  - for every reports, name it as {task-id}-{purpose}.md 
  - update steering and spec docs to reflect these file structure
  - refactor the files under gap_analysis_scoping to meet the requirements

- [x] 1. Set up basic HTML frontend and API structure
  - Create simple HTML interface for document and template selection
  - Set up Next.js API route `/api/validation` for processing
  - Create basic file input handling for local documents and templates
  - _Requirements: 1.1, 2.1_

- [ ] 2. Implement template parsing functionality
  - [x] 2.1 Create TemplateParser class for Excel and JSON parsing
    - Implement parseExcelTemplate() using existing document libraries
    - Implement parseJsonTemplate() for structured template files
    - Extract validation rules from template structures
    - _Requirements: 1.1, 3.1_
  - [x] 2.2 read gap_analysis_scoping\template_2.6.2_poc.xlsx as example and then break it into more structured validation rules
  - [ ]* 2.2 Write property test for template parsing
    - **Property 1: Template Parsing Completeness**
    - **Validates: Requirements 1.1, 3.1**

- [x] 3. Implement document analysis and validation engine
  - [x] 3.1 Create DocumentAnalyzer class
    - Implement analyzeLocalDocument() for processing uploaded documents
    - Add content presence checking against template rules
    - Add format requirement validation
    - _Requirements: 1.2, 1.3, 1.4, 1.5_
  
  - [x] 3.2 Create RuleEngine for validation logic
    - Implement executeRule() for individual rule processing
    - Add calculateCompleteness() for overall scoring
    - Add prioritizeIssues() for gap severity handling
    - _Requirements: 1.2, 1.5_
  
  - [x] 3.3 run integration test with real data
    - use gap_analysis_scoping\docs\2.6.2-summary.json as the doc to validate
  - [ ]* 3.3 Write property tests for validation accuracy
    - **Property 2: Document Validation Accuracy**
    - **Validates: Requirements 1.2, 1.5**
    - **Property 3: Gap Detection Precision**
    - **Validates: Requirements 1.3**
    - **Property 4: Completeness Recognition**
    - **Validates: Requirements 1.4**

- [x] 4. Implement interactive alert system
  - [x] 4.1 Create AlertGenerator class
    - Implement generateAlerts() for creating user-friendly alerts
    - Add createRemediationSteps() for actionable guidance
    - Create formatAlertMessage() for HTML display
    - _Requirements: 2.1, 2.2_
  
  - [x] 4.2 Add alert interaction handling
    - Implement alert acknowledgment tracking
    - Add resolution status management
    - Create interactive DOM elements for alerts
    - _Requirements: 2.3, 2.4, 2.5_
  
  - [ ]* 4.3 Write property tests for alert functionality
    - **Property 5: Interactive Alert Generation**
    - **Validates: Requirements 2.1, 2.2, 2.3**
    - **Property 6: Alert Lifecycle Management**
    - **Validates: Requirements 2.4, 2.5**

- [x] 5. Wire frontend and backend together
  - [x] 5.1 Connect HTML interface to API endpoint
    - Implement file reading and API communication
    - Add validation result display in HTML
    - Connect alert interactions to frontend
    - _Requirements: 1.1, 2.1, 2.3_
   
  - [ ]* 5.3 Write integration tests
    - Test end-to-end validation workflow
    - Test error handling scenarios
    - Test alert interaction functionality
    - _Requirements: All requirements_

- [x] 5.4 write a Runbook about how to test this gap analysis e2e 
  - include what to expect

### Fix integ tests
- [x] fix issues:
  - [x] convert gap_analysis_scoping\resources\template_2.6.2_poc.xlsx into a json file for faster load
  - [x] validate button is not clickable
  - [x] upload document not accepting json by default
  - [x] for test reason, take test files as default values
    - doc: gap_analysis_scoping\resources\2.6.2-summary.json
    - template: gap_analysis_scoping\resources\template_2.6.2_poc.json
- [ ] fix html
  - [x] when click load test files, i saw ✗ Failed to load test files . fix it


- [-] 6. Build HTML-based in-editor validation demo (no Tiptap dependency)
  - [x] 6.1 Create HTML editor with contenteditable
    - Build simple HTML editor using contenteditable div
    - Add basic formatting toolbar (bold, italic, headings)
    - Implement content change detection
    - _Requirements: 4.1_
  
  - [x] 6.2 Create InEditorValidationManager class (HTML-based)
    - Implement attachToEditor() for contenteditable integration
    - Create inline validation indicators using HTML spans
    - Implement showPlaceholderHints() for missing content
    - Implement highlightProblematicContent() for format errors
    - Add real-time validation status updates
    - _Requirements: 4.1, 4.2, 4.3, 4.6_
  
  - [x] 6.3 Implement validation indicator rendering
    - Create severity-based styling (critical/warning/info)
    - Implement placeholder hints with ➕ icon
    - Add colored underlines for format errors
    - Create hover tooltips with gap details and remediation steps
    - _Requirements: 4.2, 4.3, 4.4, 4.7_
  
  - [x] 6.4 Implement outline view for blank documents
    - Create OutlineView HTML component
    - Render hierarchical section structure from template
    - Add progress tracking and completeness percentage
    - Add expand/collapse functionality
    - Add "insert template" action for sections
    - _Requirements: 4.5_
  
  - [x] 6.5 Add validation toolbar controls
    - Add validation toggle button to editor toolbar
    - Implement severity filter dropdown (critical/warning/info)
    - Add "Jump to next issue" navigation
    - Add issue count badge
    - _Requirements: 4.1, 4.7_
  
  - [x] 6.6 Implement smart indicator grouping
    - Group related indicators by section
    - Add count badges for grouped issues
    - Implement progressive disclosure (show critical first)
    - Add expand/collapse for grouped indicators
    - _Requirements: 4.7_
  
  - [x] 6.7 Add acknowledgment and dismissal system
    - Implement indicator dismissal with tracking
    - Add acknowledgment with reason capture
    - Create "Dismissed items" review panel
    - Track validation status changes
    - _Requirements: 4.8_
  
  - [x] 6.8 Integrate with existing validation API
    - Connect HTML editor to /api/validation endpoint
    - Trigger validation on content changes (debounced)
    - Update indicators based on validation results
    - Handle validation errors gracefully
    - _Requirements: 4.1, 4.6_
  
  - [x] 6.9 Write property tests for in-editor validation
    - **Property 9: In-Editor Validation Indicator Display**
    - **Validates: Requirements 4.1, 4.3, 4.7**
    - **Property 10: Placeholder Hint Generation**
    - **Validates: Requirements 4.2**
    - **Property 11: Real-Time Validation Updates**
    - **Validates: Requirements 4.6**
    - **Property 12: Outline View Completeness**
    - **Validates: Requirements 4.5**

- [x] 7. consolidate the report and in-editor experience
  - [x] now consolidate both UX in the same gap-analysis.html, offer 2 button to generate the 2 different view. The report review that list out the alerts will be helpful when the document is relatively empty, while the editor view with inline indicator will be more effective for later-stage editing. Make sure you still display indicators in the editor view
  - [x] add a feature that when user clicks validate button, you actually generate results for both views. so when user switch between report/edit view, they will see results immediately, and they don't need to to reclick validate 
  - [ ] generate a .md report about if we really need TipTap
  - [ ] generate a .md report about how to finalize the branch for production deployment: cleanup the intermediate docs/tests, only maintain the most important readme and integ tests, and also how to refactor the code/files under folder gap_analysis_scoping into where they belongs

- [ ] 7. Final checkpoint - Ensure complete system works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Remove authentication backdoor for gap-analysis-poc routes
  - Remove `/gap-analysis-poc` and `/gap-analysis-html` from public routes in `lib/supabase/middleware.ts`
  - Remove `/gap-analysis-poc` and `/gap-analysis-html` from public pages in `components/auth/auth-guard.tsx`
  - Add proper authentication to the gap analysis POC pages
  - Or move the POC to a proper authenticated section of the application

- [ ] 9. Integrate in-editor validation with Tiptap (follow-up)
  - [ ] 9.1 Create Tiptap validation extension
    - Create ValidationIndicatorExtension for Tiptap
    - Implement decoration management (widget, inline, node decorations)
    - Add ProseMirror plugin for validation state management
    - _Requirements: 4.1, 4.3_
  
  - [ ] 9.2 Migrate HTML validation to Tiptap decorations
    - Convert HTML spans to Tiptap decorations
    - Implement widget decorations for placeholder hints
    - Implement inline decorations for format errors
    - Implement node decorations for section-level issues
    - _Requirements: 4.2, 4.3, 4.7_
  
  - [ ] 9.3 Integrate with existing Tiptap editor
    - Add validation extension to components/section-editor/tiptap-editor.tsx
    - Connect to validation API
    - Add validation toolbar button
    - Test with existing editor features (comments, smart assistant)
    - _Requirements: 4.1, 4.6_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Implementation uses TypeScript with existing Next.js infrastructure
- No database or file upload complexity - focuses on core validation logic
- Leverages existing document processing libraries (pdf-lib, mammoth, etc.)
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases