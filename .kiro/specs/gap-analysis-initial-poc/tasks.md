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
  - [x] generate a .md report about if we really need TipTap
  - [x] generate a .md report about how to finalize the branch for production deployment: cleanup the intermediate docs/tests, only maintain the most important readme and integ tests, and also how to refactor the code/files under folder gap_analysis_scoping into where they belongs
  - [x] update gap_analysis_scoping\docs\7-production-deployment-guide.md to reflect the latest code changes and add it as a new series of tasks into .kiro\specs\gap-analysis-initial-poc\tasks.md

- [x] 8. Production Deployment Preparation
  - [x] 8.1 Archive intermediate documentation
    - Create `gap_analysis_scoping/docs/archive/` directory
    - Move task-specific completion reports to archive (2.1, 2.2, 3.2, 4, 5.1, 6.5, 6.7, 6.8)
    - Move bug fix documentation to archive (fix-*.md)
    - Move development docs to archive (structure-refactoring-summary.md, in-editor-validation-design.md, template-structure.md, 2.2-summary.md)
    - Keep essential docs: README.md, user-guide.md, validation-readme.md, 5.4-e2e-testing-runbook.md, 7-consolidated-view-complete.md, 7.1-dual-view-validation-complete.md, 7-tiptap-evaluation.md, 7-production-deployment-guide.md
    - _Requirements: Production readiness_
  
  - [x] 8.2 Archive unit tests and utility scripts
    - Create `gap_analysis_scoping/tests/archive/` directory
    - Move component unit tests to archive (acknowledgment-manager.test.ts, alert-generator.test.ts, alert-manager.test.ts, indicator-grouping.test.ts, outline-view.test.ts, rule-engine.test.ts, rule-engine-integration.test.ts, template-parser.test.ts, in-editor-validation-pbt.test.ts)
    - Move utility scripts to archive (convert-template-to-json.ts, template-analysis.ts, test-api-validation.ts, test-document-analyzer.ts, test-excel-parsing.ts, test-rule-engine-integration.ts)
    - Keep essential tests: api-validation-integration.test.ts, frontend-backend-integration.test.ts, html-editor-api-integration.test.ts, dual-view-validation.test.ts, load-test-files-api.test.ts, manual/ directory
    - _Requirements: Production readiness_
  
  - [x] 8.3 Archive legacy HTML files
    - Create `public/archive/` directory
    - Move legacy files to archive: gap-analysis-poc.html, gap-analysis-editor.html
    - Create `gap_analysis_scoping/features/archive/` directory
    - Move legacy feature file to archive: gap-analysis-poc.html
    - Keep current file: gap-analysis.html (consolidated dual-view interface)
    - _Requirements: Production readiness_
  
  - [x] 8.4 Reorganize validation code into proper app structure
    - Move `gap_analysis_scoping/features/validation-api-route.ts` to `app/api/gap-analysis/validation/route.ts`
    - Update import paths in the API route to use `@/lib/gap-analysis/validation/*`
    - Verify API route follows Next.js App Router conventions
    - Test API endpoint responds correctly after move
    - _Requirements: Production readiness_
  
  - [x] 8.5 Create React component wrapper for gap analysis
    - Create `components/gap-analysis/gap-analysis-view.tsx` component
    - Implement iframe wrapper for gap-analysis.html
    - Add proper TypeScript types and props
    - Test component renders correctly
    - _Requirements: Production readiness_
  
  - [x] 8.6 run existing tests to ensure the refactor doesn't introduce break change


- [ ] 9. Remove authentication backdoor for gap-analysis routes
  - [ ] 9.1 Remove public routes from middleware
    - Remove `/gap-analysis-poc` from publicRoutes in `lib/supabase/middleware.ts`
    - Remove `/gap-analysis-html` from publicRoutes in `lib/supabase/middleware.ts`
    - Verify middleware properly protects gap analysis routes
    - _Requirements: Security_
  
  - [ ] 9.2 Remove public routes from auth guard
    - Remove `/gap-analysis-poc` from public pages in `components/auth/auth-guard.tsx`
    - Remove `/gap-analysis-html` from public pages in `components/auth/auth-guard.tsx`
    - Verify auth guard properly protects gap analysis routes
    - _Requirements: Security_
  
  - [ ] 9.3 Test authentication protection
    - Test unauthenticated access redirects to login
    - Test authenticated access works correctly
    - Test session expiration handling
    - Verify no backdoor routes remain accessible
    - _Requirements: Security_
  
  - [x] 8.6 Create authenticated gap analysis page route
    - Create `app/gap-analysis/page.tsx` with server-side authentication
    - Import and use GapAnalysisView component
    - Add authentication check using Supabase
    - Redirect unauthenticated users to login
    - Test authentication flow works correctly
    - _Requirements: Production readiness_


- [ ] 10. Production deployment testing and validation
  - [ ] 10.1 Run all integration tests
    - Run api-validation-integration.test.ts
    - Run frontend-backend-integration.test.ts
    - Run html-editor-api-integration.test.ts
    - Run dual-view-validation.test.ts
    - Run load-test-files-api.test.ts
    - Verify all tests pass
    - _Requirements: Quality assurance_
  
  - [ ] 10.2 Execute manual testing checklist
    - Test file upload (Excel and JSON templates)
    - Test document upload (JSON format)
    - Test load test files button
    - Test validation execution (< 5 seconds)
    - Test Report View display and functionality
    - Test Editor View display and inline indicators
    - Test view switching (instant, no re-validation)
    - Test alert actions (acknowledge, resolve, dismiss)
    - Test authentication and authorization
    - Test error handling scenarios
    - _Requirements: Quality assurance_
  
  - [ ] 10.3 Performance and browser compatibility testing
    - Test page load time (< 2 seconds)
    - Test validation execution time (< 5 seconds)
    - Test view switching time (< 100ms)
    - Test memory usage (no leaks over 30 minutes)
    - Test on Chrome, Firefox, Safari, Edge
    - Test on mobile browsers (iOS Safari, Android Chrome)
    - _Requirements: Quality assurance_
  
  - [ ] 10.4 Update navigation and documentation
    - Add gap analysis link to main navigation/sidebar
    - Update main README with gap analysis feature description
    - Update user-guide.md with latest features
    - Create deployment runbook if needed
    - _Requirements: Documentation_

- [ ] 11. Build and deploy to production
  - [ ] 11.1 Verify environment variables
    - Check NEXT_PUBLIC_SUPABASE_URL is set
    - Check NEXT_PUBLIC_SUPABASE_ANON_KEY is set
    - Verify all required environment variables are configured
    - _Requirements: Deployment_
  
  - [ ] 11.2 Build and test production build
    - Run `npm run build`
    - Fix any build errors or warnings
    - Run `npm run start` to test production build locally
    - Verify gap analysis works in production mode
    - _Requirements: Deployment_
  
  - [ ] 11.3 Deploy to production
    - Deploy to Vercel (or hosting platform)
    - Verify deployment succeeds
    - Test production URL
    - Monitor for errors in production logs
    - _Requirements: Deployment_
  
  - [ ] 11.4 Post-deployment verification
    - Access `/gap-analysis` route in production
    - Verify authentication works
    - Test validation with sample files
    - Check API endpoints respond correctly
    - Verify error handling
    - Test on multiple browsers and devices
    - _Requirements: Deployment_


## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Implementation uses TypeScript with existing Next.js infrastructure
- No database or file upload complexity - focuses on core validation logic
- Leverages existing document processing libraries (pdf-lib, mammoth, etc.)
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases