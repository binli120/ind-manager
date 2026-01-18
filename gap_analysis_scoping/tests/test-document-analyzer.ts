/**
 * Test script for DocumentAnalyzer
 * Validates document analysis functionality against template rules
 */

import { DocumentAnalyzer } from '../features/validation/document-analyzer';
import { TemplateParser } from '../features/validation/template-parser';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test 1: Analyze a sample text document against Excel template
 */
async function testTextDocumentAnalysis() {
  console.log('\n=== Test 1: Text Document Analysis ===\n');

  const analyzer = new DocumentAnalyzer();
  const parser = new TemplateParser();

  // Load the Excel template
  const templatePath = path.join(process.cwd(), 'gap_analysis_scoping', 'resources', 'template_2.6.2_poc.xlsx');
  const templateBuffer = fs.readFileSync(templatePath);
  const template = parser.parseExcelTemplate(templateBuffer);

  console.log(`Template loaded: ${template.name}`);
  console.log(`Total rules: ${template.rules.length}\n`);

  // Create a sample document with some sections present
  const sampleDocument = `
    2.6.2 Nonclinical Written and Tabulated Summaries
    
    2.6.2.1 - a: Brief Summary
    This section provides an executive summary of the nonclinical program.
    The study objectives were to evaluate safety and efficacy.
    
    2.6.2.2 - a: Primary Pharmacodynamics
    Study objectives included assessment of primary pharmacodynamic effects.
    The compound demonstrated dose-dependent activity.
    
    2.6.2.4 - b: Cardiovascular Safety Pharmacology
    CV safety was evaluated in dedicated studies.
    hERG IC50 was measured at 10 μM.
    In vivo QT effects were assessed in dogs.
    Blood pressure and heart rate were monitored.
    
    Module 4 References:
    - 4.2.1.3 Safety pharmacology (CV): dedicated studies
    - 4.2.3.2 Repeat-dose toxicology studies
  `;

  const documentBuffer = Buffer.from(sampleDocument, 'utf-8');

  // Analyze the document
  const result = await analyzer.analyzeLocalDocument(documentBuffer, template, 'sample-document.txt');

  console.log('Analysis Results:');
  console.log(`Document: ${result.documentName}`);
  console.log(`Template: ${result.templateName}`);
  console.log(`Completeness: ${result.completenessPercentage}%`);
  console.log(`Processing time: ${result.processingTime}ms`);
  console.log(`Total gaps: ${result.gaps.length}\n`);

  // Show gap breakdown by severity
  const criticalGaps = result.gaps.filter(g => g.severity === 'critical');
  const warningGaps = result.gaps.filter(g => g.severity === 'warning');
  const infoGaps = result.gaps.filter(g => g.severity === 'info');

  console.log(`Critical gaps: ${criticalGaps.length}`);
  console.log(`Warning gaps: ${warningGaps.length}`);
  console.log(`Info gaps: ${infoGaps.length}\n`);

  // Show first 5 gaps
  console.log('Sample gaps:');
  result.gaps.slice(0, 5).forEach((gap, index) => {
    console.log(`\n${index + 1}. ${gap.ruleName}`);
    console.log(`   Severity: ${gap.severity}`);
    console.log(`   Category: ${gap.category}`);
    console.log(`   Required: ${gap.required}`);
    console.log(`   Description: ${gap.description.substring(0, 100)}...`);
    console.log(`   Remediation: ${gap.remediationSteps[0].substring(0, 100)}...`);
  });

  return result;
}

/**
 * Test 2: Analyze an empty document (should have many gaps)
 */
async function testEmptyDocumentAnalysis() {
  console.log('\n\n=== Test 2: Empty Document Analysis ===\n');

  const analyzer = new DocumentAnalyzer();
  const parser = new TemplateParser();

  // Load the Excel template
  const templatePath = path.join(process.cwd(), 'gap_analysis_scoping', 'resources', 'template_2.6.2_poc.xlsx');
  const templateBuffer = fs.readFileSync(templatePath);
  const template = parser.parseExcelTemplate(templateBuffer);

  // Create an empty document
  const emptyDocument = '';
  const documentBuffer = Buffer.from(emptyDocument, 'utf-8');

  // Analyze the document
  const result = await analyzer.analyzeLocalDocument(documentBuffer, template, 'empty-document.txt');

  console.log('Analysis Results:');
  console.log(`Completeness: ${result.completenessPercentage}%`);
  console.log(`Total gaps: ${result.gaps.length}`);
  console.log(`Expected: Should have many gaps (low completeness)\n`);

  return result;
}

/**
 * Test 3: Analyze a complete document (should have few/no gaps)
 */
async function testCompleteDocumentAnalysis() {
  console.log('\n\n=== Test 3: Complete Document Analysis ===\n');

  const analyzer = new DocumentAnalyzer();
  const parser = new TemplateParser();

  // Load the Excel template
  const templatePath = path.join(process.cwd(), 'gap_analysis_scoping', 'resources', 'template_2.6.2_poc.xlsx');
  const templateBuffer = fs.readFileSync(templatePath);
  const template = parser.parseExcelTemplate(templateBuffer);

  // Create a comprehensive document with many sections
  const completeDocument = `
    2.6.2 Nonclinical Written and Tabulated Summaries
    
    2.6.2.1 - a: Brief Summary - Executive Summary
    Comprehensive executive summary with all required elements.
    Study objectives, species, doses, endpoints assessed.
    
    2.6.2.1 - b: Brief Summary - Secondary Findings
    Secondary pharmacology and safety findings included.
    
    2.6.2.2 - a: Primary Pharmacodynamics - Study Objectives
    Study objectives clearly defined with endpoints.
    
    2.6.2.2 - b: Primary Pharmacodynamics - Study Results
    Results presented with statistical analysis.
    
    2.6.2.3 - a: Secondary Pharmacodynamics
    Secondary pharmacology effects documented.
    
    2.6.2.4 - a: Safety Pharmacology - Overview
    Safety pharmacology overview with all systems.
    
    2.6.2.4 - b: Cardiovascular Safety Pharmacology
    CV safety data including hERG IC50, QT effects, BP, HR, ECG.
    Study ID: CV-001, Species: Dog, Doses: 1, 10, 100 mg/kg.
    hERG IC50: 10 μM, QT prolongation: None observed.
    Blood pressure: No significant changes.
    Heart rate: Stable across all doses.
    NOAEL CV: 100 mg/kg.
    
    2.6.2.4 - c: CNS Safety Pharmacology
    CNS effects evaluated in functional observational battery.
    
    2.6.2.4 - d: Respiratory Safety Pharmacology
    Respiratory parameters monitored and normal.
    
    2.6.2.5 - a: Pharmacokinetics - Absorption
    Absorption data with Cmax and Tmax values.
    
    2.6.2.5 - b: Pharmacokinetics - Distribution
    Distribution volume and tissue binding data.
    
    2.6.2.5 - c: Pharmacokinetics - Metabolism
    Metabolic pathways and enzyme identification.
    
    2.6.2.5 - d: Pharmacokinetics - Excretion
    Excretion routes and elimination half-life.
    
    2.6.2.6 - a: Toxicokinetics
    TK parameters from toxicology studies.
    
    2.6.2.7 - a: Single-Dose Toxicity
    Acute toxicity findings across species.
    
    2.6.2.8 - a: Repeat-Dose Toxicity
    Chronic toxicity with NOAEL determination.
    
    Module 4 References:
    - 4.2.1.1 Pharmacology: Primary pharmacodynamics
    - 4.2.1.2 Pharmacology: Secondary pharmacodynamics
    - 4.2.1.3 Safety pharmacology (CV): dedicated studies
    - 4.2.2.2 Pharmacokinetics: ADME studies
    - 4.2.3.1 Single-dose toxicity
    - 4.2.3.2 Repeat-dose toxicity
    
    Critical Claims:
    - hERG IC50: 10 μM (Required)
    - In vivo QT: No prolongation (Required)
    - CV doses: 1, 10, 100 mg/kg (Required)
    - NOAEL: 100 mg/kg
    
    Small Molecule Requirements:
    Report hERG IC50, in vivo QT/QTc effects, hemodynamic parameters.
    Calculate safety margins relative to projected clinical Cmax.
    Safety margin hERG: 50x clinical Cmax.
  `;

  const documentBuffer = Buffer.from(completeDocument, 'utf-8');

  // Analyze the document
  const result = await analyzer.analyzeLocalDocument(documentBuffer, template, 'complete-document.txt');

  console.log('Analysis Results:');
  console.log(`Completeness: ${result.completenessPercentage}%`);
  console.log(`Total gaps: ${result.gaps.length}`);
  console.log(`Expected: Should have higher completeness than empty document\n`);

  if (result.gaps.length > 0) {
    console.log('Remaining gaps (first 3):');
    result.gaps.slice(0, 3).forEach((gap, index) => {
      console.log(`\n${index + 1}. ${gap.ruleName} (${gap.severity})`);
    });
  }

  return result;
}

/**
 * Test 4: Test content presence checking
 */
async function testContentPresenceChecking() {
  console.log('\n\n=== Test 4: Content Presence Checking ===\n');

  const analyzer = new DocumentAnalyzer();
  const parser = new TemplateParser();

  // Load template
  const templatePath = path.join(process.cwd(), 'gap_analysis_scoping', 'resources', 'template_2.6.2_poc.xlsx');
  const templateBuffer = fs.readFileSync(templatePath);
  const template = parser.parseExcelTemplate(templateBuffer);

  // Test document with specific sections
  const testDocument = `
    2.6.2.1 - a: Brief Summary
    This is the brief summary section.
    
    2.6.2.4 - b: Cardiovascular Safety
    CV safety data here.
  `;

  const documentBuffer = Buffer.from(testDocument, 'utf-8');
  const result = await analyzer.analyzeLocalDocument(documentBuffer, template, 'test-content.txt');

  // Check which content presence rules passed
  const contentGaps = result.gaps.filter(g => g.category === 'missing_content');
  const contentPassed = template.rules.filter(r => r.type === 'content_presence').length - contentGaps.length;

  console.log(`Content presence rules: ${template.rules.filter(r => r.type === 'content_presence').length}`);
  console.log(`Content rules passed: ${contentPassed}`);
  console.log(`Content rules failed: ${contentGaps.length}`);
  console.log(`\nExpected: Should find sections 2.6.2.1-a and 2.6.2.4-b\n`);

  return result;
}

/**
 * Test 5: Test format requirement validation
 */
async function testFormatRequirementValidation() {
  console.log('\n\n=== Test 5: Format Requirement Validation ===\n');

  const analyzer = new DocumentAnalyzer();
  const parser = new TemplateParser();

  // Load template
  const templatePath = path.join(process.cwd(), 'gap_analysis_scoping', 'resources', 'template_2.6.2_poc.xlsx');
  const templateBuffer = fs.readFileSync(templatePath);
  const template = parser.parseExcelTemplate(templateBuffer);

  // Test document with format elements
  const testDocument = `
    2.6.2.4 - b: Cardiovascular Safety Pharmacology
    
    Study ID: CV-001
    Species: Dog
    Doses: 1, 10, 100 mg/kg
    Endpoints assessed: BP, HR, ECG
    
    Results:
    - hERG IC50: 10 μM
    - Blood pressure effect: No change
    - Heart rate effect: Stable
    - ECG effects: QT normal, QTc normal, PR normal, QRS normal
    - NOAEL CV: 100 mg/kg
    
    Module 4 References:
    - 4.2.1.3 Safety pharmacology (CV)
    - 4.2.3.2 Repeat-dose toxicity
  `;

  const documentBuffer = Buffer.from(testDocument, 'utf-8');
  const result = await analyzer.analyzeLocalDocument(documentBuffer, template, 'test-format.txt');

  // Check format requirement rules
  const formatGaps = result.gaps.filter(g => g.category === 'format_error');
  const formatPassed = template.rules.filter(r => r.type === 'format_requirement').length - formatGaps.length;

  console.log(`Format requirement rules: ${template.rules.filter(r => r.type === 'format_requirement').length}`);
  console.log(`Format rules passed: ${formatPassed}`);
  console.log(`Format rules failed: ${formatGaps.length}`);
  console.log(`\nExpected: Should find data inputs and source references\n`);

  return result;
}

// Run all tests
async function runAllTests() {
  console.log('========================================');
  console.log('Document Analyzer Test Suite');
  console.log('========================================');

  try {
    await testTextDocumentAnalysis();
    await testEmptyDocumentAnalysis();
    await testCompleteDocumentAnalysis();
    await testContentPresenceChecking();
    await testFormatRequirementValidation();

    console.log('\n\n========================================');
    console.log('All tests completed successfully!');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n\nTest failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Execute tests if run directly
if (require.main === module) {
  runAllTests();
}

export {
  testTextDocumentAnalysis,
  testEmptyDocumentAnalysis,
  testCompleteDocumentAnalysis,
  testContentPresenceChecking,
  testFormatRequirementValidation
};
