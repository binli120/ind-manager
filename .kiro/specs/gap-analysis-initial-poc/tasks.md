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



- [ ] 6. Final checkpoint - Ensure complete system works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Remove authentication backdoor for gap-analysis-poc routes
  - Remove `/gap-analysis-poc` and `/gap-analysis-html` from public routes in `lib/supabase/middleware.ts`
  - Remove `/gap-analysis-poc` and `/gap-analysis-html` from public pages in `components/auth/auth-guard.tsx`
  - Add proper authentication to the gap analysis POC pages
  - Or move the POC to a proper authenticated section of the application

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Implementation uses TypeScript with existing Next.js infrastructure
- No database or file upload complexity - focuses on core validation logic
- Leverages existing document processing libraries (pdf-lib, mammoth, etc.)
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases