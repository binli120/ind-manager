# Multi-Dimensional Validation Rule Extraction Logic

## Overview

The Gap Analysis template validation uses a **multi-dimensional approach** to extract validation rules from Excel templates. This ensures comprehensive document validation across both content presence and content quality.

## The Two Dimensions

### Dimension 1: ROWS (Content Presence)
**Each row represents a required content element that must exist in the document.**

Example from template:
- Row 1: "2.6.2.1 - a: Brief Summary" → Must have executive summary
- Row 2: "2.6.2.1 - b: Brief Summary" → Must have secondary/safety findings
- Row 3: "2.6.2.2 - a: Primary Pharmacodynamics" → Must have study objectives
- ...and so on for all 16 rows

**Rule Generated**: Content Presence rule for each section
```typescript
{
  name: "2.6.2.1 - a: Brief Summary - Content Presence",
  type: "content_presence",
  field: "2.6.2.1 - a",
  required: true,
  severity: "critical" | "warning" | "info"
}
```

### Dimension 2: COLUMNS (Content Requirements)
**Each column represents additional requirements about the content in that row.**

For each row, we extract rules from these columns:

#### Column 1: Data Inputs
**What it validates**: Required data elements that must be present in the section

Example:
```
Data Inputs: "REQUIRED INPUTS:
- cv_safety_pharm: [study_id, species, doses, endpoints_assessed (BP, HR, ECG)]
- findings: [bp_effect, hr_effect, ecg_effects (QT, QTc, PR, QRS)]
- noael_cv: [mg/kg]"
```

**Rule Generated**:
```typescript
{
  name: "2.6.2.4 - b: Required Data Inputs",
  type: "format_requirement",
  field: "2.6.2.4 - b_data_inputs",
  description: "Section must include specified data inputs: study_id, species, doses..."
}
```

#### Column 2: Module 4 Source Traceability
**What it validates**: Content must reference source documents

Example:
```
Module 4 source: "PRIMARY (Module 4):
- 4.2.1.3 Safety pharmacology (CV): dedicated studies
- 4.2.3.2 Repeat-dose tox: telemetry/ECG if collected"
```

**Rule Generated**:
```typescript
{
  name: "2.6.2.4 - b: Source Traceability",
  type: "format_requirement",
  field: "2.6.2.4 - b_sources",
  description: "Content must reference Module 4 sources: 4.2.1.3, 4.2.3.2..."
}
```

#### Column 3: Critical Claim Elements
**What it validates**: Key data points that need tracing

Example:
```
Critical claim elements: "CLAIMS TO TRACE:
• CV results: hERG-IC50 (Required), in-vivo-QT (Required), BP, HR, doses (Required)
• Exposure margins: hERG-margin (Required), in-vivo-margin vs clinical"
```

**Rule Generated**:
```typescript
{
  name: "2.6.2.4 - b: Critical Claim Elements",
  type: "format_requirement",
  field: "2.6.2.4 - b_claims",
  severity: "critical",
  description: "Section must include traceable critical claims: hERG-IC50, QT, doses..."
}
```

#### Columns 4-8: Modality-Specific Requirements
**What it validates**: Different requirements for different drug types

Modalities:
- **SM**: Small Molecule
- **BIO**: Biologics
- **ADC**: Antibody-Drug Conjugate
- **ONT**: Oligonucleotide-Based Therapeutics
- **Other**: Other modalities

Example for SM:
```
SM (Small Molecule): "Report hERG IC50, in vivo QT/QTc effects, and hemodynamic 
parameters; calculate safety margins relative to projected clinical Cmax."

FIH IND Required – SM: "Yes"
```

**Rule Generated**:
```typescript
{
  name: "2.6.2.4 - b: SM Modality Requirements",
  type: "format_requirement",
  field: "2.6.2.4 - b_sm",
  required: true,  // because "FIH IND Required – SM" = "Yes"
  severity: "warning",
  description: "For SM products: Report hERG IC50, in vivo QT/QTc effects..."
}
```

#### Column 9: Tables/Figures Hints
**What it validates**: Suggested visualizations

Example:
```
Tables/Figures Hint: "Hint: It might be advisable to add a Table 'Safety Pharmacology 
Results & Margins' here (single consolidated table across CV/CNS/respiratory)."
```

**Rule Generated**:
```typescript
{
  name: "2.6.2.4 - a: Tables/Figures",
  type: "format_requirement",
  field: "2.6.2.4 - a_tables_figures",
  required: false,
  severity: "info",
  description: "Consider adding tables/figures: Safety Pharmacology Results & Margins..."
}
```

## Rule Extraction Results

### From 16 Rows → 87 Rules

**Breakdown per row** (average ~5-6 rules per row):
1. **Content Presence** (1 rule): Section must exist
2. **Data Inputs** (0-1 rule): Required data elements
3. **Source Traceability** (0-1 rule): Module 4 references
4. **Critical Claims** (0-1 rule): Traceable data points
5. **Modality Requirements** (0-5 rules): SM, BIO, ADC, ONT, Other
6. **Tables/Figures** (0-1 rule): Visualization suggestions

### Rule Severity Distribution

From the test output:
- **Critical**: 1 rule (overall template completeness)
- **Warning**: 11 rules (required content presence)
- **Info**: 75 rules (optional/conditional requirements, modality-specific, traceability)

## Implementation Logic

### Step 1: Extract All Columns from Excel
```typescript
// Map each column to its header
headers.forEach((header, colIndex) => {
  if (header && row[colIndex] !== undefined) {
    sectionData[header] = row[colIndex];
  }
});
```

### Step 2: Generate Row-Level Rule (Content Presence)
```typescript
rules.push({
  name: `${elementId}: ${sectionHeader} - Content Presence`,
  description: content,
  type: 'content_presence',
  field: elementId,
  required: isRequired,
  severity: determineSeverity(content)
});
```

### Step 3: Generate Column-Level Rules

#### Data Inputs Rule
```typescript
if (section['Data Inputs']) {
  rules.push({
    name: `${elementId}: Required Data Inputs`,
    type: 'format_requirement',
    field: `${elementId}_data_inputs`,
    description: `Section must include: ${dataInputs}...`
  });
}
```

#### Source Traceability Rule
```typescript
if (section['Module 4 source (exact report + section/table)']) {
  rules.push({
    name: `${elementId}: Source Traceability`,
    type: 'format_requirement',
    field: `${elementId}_sources`,
    severity: 'info'
  });
}
```

#### Critical Claims Rule
```typescript
if (section['Critical claim elements to trace']) {
  rules.push({
    name: `${elementId}: Critical Claim Elements`,
    type: 'format_requirement',
    field: `${elementId}_claims`,
    severity: 'critical'
  });
}
```

#### Modality-Specific Rules
```typescript
modalityColumns.forEach(({ contentKey, requiredKey, modality }) => {
  if (section[contentKey]) {
    const isRequired = section[requiredKey] === 'Yes';
    rules.push({
      name: `${elementId}: ${modality} Modality Requirements`,
      type: 'format_requirement',
      field: `${elementId}_${modality.toLowerCase()}`,
      required: isRequired,
      severity: isRequired ? 'warning' : 'info'
    });
  }
});
```

## Severity Determination Logic

### Critical
- Content contains "critical" or "must"
- Critical claim elements
- Overall template completeness

### Warning
- Required sections (default for content presence)
- Required modality-specific requirements
- Required data inputs

### Info
- Conditional sections (contains "Condition:" or "if")
- Optional modality requirements
- Source traceability
- Tables/figures suggestions

## Example: Full Rule Set for One Row

**Row**: 2.6.2.4 - b (Cardiovascular Safety Pharmacology)

**Rules Generated** (7 total):

1. **Content Presence** (Warning)
   - Field: `2.6.2.4 - b`
   - Must have cardiovascular safety pharmacology section

2. **Data Inputs** (Warning)
   - Field: `2.6.2.4 - b_data_inputs`
   - Must include: study_id, species, doses, BP, HR, ECG, hERG IC50

3. **Source Traceability** (Info)
   - Field: `2.6.2.4 - b_sources`
   - Must reference: 4.2.1.3 Safety pharmacology (CV), 4.2.3.2 Repeat-dose tox

4. **SM Modality** (Warning, Required)
   - Field: `2.6.2.4 - b_sm`
   - For small molecules: Report hERG IC50, QT/QTc effects, safety margins

5. **BIO Modality** (Warning, Required)
   - Field: `2.6.2.4 - b_bio`
   - For biologics: Summarize CV parameters from repeat-dose studies

6. **ADC Modality** (Warning, Required)
   - Field: `2.6.2.4 - b_adc`
   - For ADCs: Report CV safety for intact ADC, address payload concerns

7. **ONT Modality** (Warning, Required)
   - Field: `2.6.2.4 - b_ont`
   - For oligonucleotides: Report CV effects, address complement activation

## Benefits of Multi-Dimensional Validation

### Comprehensive Coverage
- **Content**: Checks if section exists
- **Quality**: Checks if section has required elements
- **Traceability**: Checks if claims are sourced
- **Specificity**: Checks modality-specific requirements

### Granular Feedback
Users know exactly what's missing:
- ❌ "Section 2.6.2.4-b is missing" (content)
- ❌ "Section 2.6.2.4-b missing required data: hERG IC50" (data inputs)
- ❌ "Section 2.6.2.4-b missing Module 4 references" (traceability)
- ❌ "Section 2.6.2.4-b doesn't meet SM modality requirements" (modality)

### Flexible Validation
- Required vs optional rules
- Modality-specific rules only apply to relevant products
- Conditional rules for special cases

## Usage in Document Validation

When validating a document:

1. **Check Row Dimension**: Does section exist?
2. **Check Column Dimensions**: 
   - Does it have required data inputs?
   - Does it reference source documents?
   - Does it include critical claims?
   - Does it meet modality requirements?
   - Does it have suggested tables/figures?

3. **Generate Gap Report**: List all failed rules with remediation hints

## Future Enhancements

- **Parse data input structure**: Extract specific field names from "REQUIRED INPUTS"
- **Validate data types**: Check if fields are correct type (string, number, array)
- **Cross-reference validation**: Verify Module 4 references actually exist
- **Claim traceability**: Check if critical claims link to source data
- **Modality detection**: Auto-detect product modality and apply relevant rules only

---

**Implementation**: `gap_analysis_scoping/features/validation/template-parser.ts`
**Method**: `extractValidationRules()`
**Test**: `gap_analysis_scoping/tests/test-excel-parsing.ts`
