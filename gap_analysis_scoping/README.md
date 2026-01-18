# Gap Analysis Scoping - Project Structure

This directory contains the Gap Analysis Completeness Check proof-of-concept implementation.

## Directory Structure

```
gap_analysis_scoping/
├── features/              # Implementation code
│   ├── validation/        # Core validation logic
│   │   ├── template-parser.ts       # Template parsing (Excel/JSON)
│   │   └── document-analyzer.ts     # Document analysis engine
│   ├── gap-analysis-poc.html        # Frontend HTML interface
│   └── validation-api-route.ts      # Next.js API route
│
├── tests/                 # Test files
│   ├── test-document-analyzer.ts    # Document analyzer tests
│   ├── test-excel-parsing.ts        # Excel parsing tests
│   └── template-parser.test.ts      # Unit tests for template parser
│
├── docs/                  # Documentation and reports
│   ├── README.md                    # Main documentation
│   ├── 2.1-document-analyzer-complete.md    # Task 2.1 completion report
│   ├── 2.1-excel-parsing-complete.md        # Excel parsing completion report
│   ├── 2.2-multi-dimensional-validation-complete.md  # Task 2.2 completion report
│   ├── 2.2-summary.md               # Task 2.2 summary
│   ├── template-structure.md        # Template structure documentation
│   ├── validation-readme.md         # Validation feature documentation
│   ├── gap-analysis-design-proposal.md  # Design proposal
│   ├── 2.6.2-summary.json           # Section summary example
│   ├── document-analyzer-example.ts # Example usage code
│   ├── example-usage.ts             # Additional examples
│   ├── inspect-excel.ts             # Excel inspection utility
│   └── template-analysis.ts         # Template analysis utility
│
├── resources/             # Reference materials and templates
│   ├── template_2.6.2_poc.xlsx          # Excel template for validation
│   ├── template_v0.xlsx                 # Template version 0
│   ├── IND Master Checklist 2.4 & 2.6.xlsx  # Master checklist
│   ├── Completeness Check Requirement v1.docx  # Requirements document
│   ├── FilynAI_Presentation_UI.pptx     # UI presentation
│   └── gap-analysis-design-proposal.md  # Design proposal
│
└── README.md              # This file

```

## File Organization Rules

### Features Directory (`features/`)
Contains all implementation code:
- Core validation logic (template parsing, document analysis)
- Frontend interfaces (HTML)
- API routes (Next.js endpoints)

### Tests Directory (`tests/`)
Contains all test files:
- Unit tests (`.test.ts`)
- Integration tests (`test-*.ts`)
- Manual test scripts

### Docs Directory (`docs/`)
Contains all documentation and reports:
- Task completion reports: `{task-id}-{purpose}.md`
- Technical documentation
- Example code and utilities
- Design proposals and specifications

## Key Files

### Implementation
- `features/validation/template-parser.ts` - Parses Excel/JSON templates into validation rules
- `features/validation/document-analyzer.ts` - Analyzes documents against template rules
- `features/gap-analysis-poc.html` - Simple HTML frontend for POC
- `features/validation-api-route.ts` - Next.js API endpoint

### Tests
- `tests/test-document-analyzer.ts` - Comprehensive document analyzer tests
- `tests/test-excel-parsing.ts` - Excel template parsing tests
- `tests/template-parser.test.ts` - Unit tests for template parser

### Documentation
- `docs/README.md` - Main validation feature documentation
- `docs/template-structure.md` - Template structure and format
- `docs/2.1-document-analyzer-complete.md` - Task 2.1 completion report
- `docs/2.2-multi-dimensional-validation-complete.md` - Multi-dimensional validation report

## Running Tests

```bash
# Run document analyzer tests
npx ts-node gap_analysis_scoping/tests/test-document-analyzer.ts

# Run Excel parsing tests
npx ts-node gap_analysis_scoping/tests/test-excel-parsing.ts

# Run unit tests (if using Jest/Vitest)
npm test gap_analysis_scoping/tests/template-parser.test.ts
```

## Development Workflow

1. **Implementation**: Add code to `features/`
2. **Testing**: Add tests to `tests/`
3. **Documentation**: Add reports to `docs/` using naming convention `{task-id}-{purpose}.md`

## Related Documentation

- Spec: `.kiro/specs/gap-analysis-initial-poc/`
- Steering: `.kiro/steering/RULE-EXTRACTION-LOGIC.md`
