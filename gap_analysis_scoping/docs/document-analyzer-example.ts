/**
 * Example usage of DocumentAnalyzer
 * Demonstrates how to analyze documents against templates
 */

import { DocumentAnalyzer } from './document-analyzer';
import { TemplateParser } from './template-parser';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Example 1: Analyze a document against an Excel template
 */
export async function analyzeDocumentWithExcelTemplate() {
  console.log('=== Example 1: Analyze Document with Excel Template ===\n');

  // Initialize analyzer and parser
  const analyzer = new DocumentAnalyzer();
  const parser = new TemplateParser();

  // Load Excel template
  const templatePath = path.join(process.cwd(), 'gap_analysis_scoping', 'template_2.6.2_poc.xlsx');
  const templateBuffer = fs.readFileSync(templatePath);
  const template = parser.parseExcelTemplate(templateBuffer);

  console.log(`Loaded template: ${template.name}`);
  console.log(`Template has ${template.rules.length} validation rules\n`);

  // Create a sample document
  const sampleDocument = `
    2.6.2 Nonclinical Written and Tabulated Summaries
    
    2.6.2.1 - a: Brief Summary
    This document provides a comprehensive summary of nonclinical studies.
    Study objectives included safety and efficacy evaluation.
    
    2.6.2.4 - b: Cardiovascular Safety Pharmacology
    CV safety was assessed in dedicated studies.
    hERG IC50: 10 μM
    QT effects: No prolongation observed
    Blood pressure: Stable
    Heart rate: Normal
  `;

  const documentBuffer = Buffer.from(sampleDocument, 'utf-8');

  // Analyze the document
  const result = await analyzer.analyzeLocalDocument(
    documentBuffer,
    template,
    'nonclinical-summary.txt'
  );

  // Display results
  console.log('Analysis Results:');
  console.log(`- Document: ${result.documentName}`);
  console.log(`- Completeness: ${result.completenessPercentage}%`);
  console.log(`- Total gaps: ${result.gaps.length}`);
  console.log(`- Processing time: ${result.processingTime}ms\n`);

  // Show gap breakdown
  const criticalGaps = result.gaps.filter(g => g.severity === 'critical');
  const warningGaps = result.gaps.filter(g => g.severity === 'warning');
  const infoGaps = result.gaps.filter(g => g.severity === 'info');

  console.log('Gap Breakdown:');
  console.log(`- Critical: ${criticalGaps.length}`);
  console.log(`- Warning: ${warningGaps.length}`);
  console.log(`- Info: ${infoGaps.length}\n`);

  // Show top 3 critical/warning gaps
  const importantGaps = result.gaps
    .filter(g => g.severity === 'critical' || g.severity === 'warning')
    .slice(0, 3);

  if (importantGaps.length > 0) {
    console.log('Top Priority Gaps:');
    importantGaps.forEach((gap, index) => {
      console.log(`\n${index + 1}. ${gap.ruleName}`);
      console.log(`   Severity: ${gap.severity.toUpperCase()}`);
      console.log(`   Category: ${gap.category}`);
      console.log(`   Remediation: ${gap.remediationSteps[0].substring(0, 100)}...`);
    });
  }

  return result;
}

/**
 * Example 2: Analyze a text document (simulating DOCX)
 */
export async function analyzeDocxDocument() {
  console.log('\n\n=== Example 2: Analyze Text Document ===\n');

  const analyzer = new DocumentAnalyzer();
  const parser = new TemplateParser();

  // Load template
  const templatePath = path.join(process.cwd(), 'gap_analysis_scoping', 'template_2.6.2_poc.xlsx');
  const templateBuffer = fs.readFileSync(templatePath);
  const template = parser.parseExcelTemplate(templateBuffer);

  // Note: For this example, we'll use a text file
  // In production, you would load an actual DOCX file
  const sampleDoc = `
    2.6.2 Nonclinical Summaries
    
    2.6.2.1 - a: Brief Summary
    Executive summary of nonclinical program.
    
    2.6.2.2 - a: Primary Pharmacodynamics
    Study objectives and results.
  `;

  const documentBuffer = Buffer.from(sampleDoc, 'utf-8');

  // Analyze as text file
  const result = await analyzer.analyzeLocalDocument(
    documentBuffer,
    template,
    'nonclinical-summary.txt'
  );

  console.log(`Completeness: ${result.completenessPercentage}%`);
  console.log(`Total gaps: ${result.gaps.length}`);

  return result;
}

/**
 * Example 3: Compare two documents
 */
export async function compareTwoDocuments() {
  console.log('\n\n=== Example 3: Compare Two Documents ===\n');

  const analyzer = new DocumentAnalyzer();
  const parser = new TemplateParser();

  // Load template
  const templatePath = path.join(process.cwd(), 'gap_analysis_scoping', 'template_2.6.2_poc.xlsx');
  const templateBuffer = fs.readFileSync(templatePath);
  const template = parser.parseExcelTemplate(templateBuffer);

  // Document 1: Draft version
  const draftDoc = `
    2.6.2.1 - a: Brief Summary
    Draft summary.
  `;

  // Document 2: More complete version
  const completeDoc = `
    2.6.2.1 - a: Brief Summary
    Comprehensive executive summary with study objectives.
    
    2.6.2.2 - a: Primary Pharmacodynamics
    Study objectives and endpoints.
    
    2.6.2.4 - b: Cardiovascular Safety
    CV safety data with hERG IC50 and QT effects.
  `;

  // Analyze both
  const draftResult = await analyzer.analyzeLocalDocument(
    Buffer.from(draftDoc, 'utf-8'),
    template,
    'draft.txt'
  );

  const completeResult = await analyzer.analyzeLocalDocument(
    Buffer.from(completeDoc, 'utf-8'),
    template,
    'complete.txt'
  );

  // Compare
  console.log('Comparison Results:');
  console.log(`\nDraft Document:`);
  console.log(`- Completeness: ${draftResult.completenessPercentage}%`);
  console.log(`- Gaps: ${draftResult.gaps.length}`);

  console.log(`\nComplete Document:`);
  console.log(`- Completeness: ${completeResult.completenessPercentage}%`);
  console.log(`- Gaps: ${completeResult.gaps.length}`);

  const improvement = completeResult.completenessPercentage - draftResult.completenessPercentage;
  console.log(`\nImprovement: +${improvement}%`);

  return { draftResult, completeResult };
}

/**
 * Example 4: Generate actionable gap report
 */
export async function generateActionableGapReport() {
  console.log('\n\n=== Example 4: Actionable Gap Report ===\n');

  const analyzer = new DocumentAnalyzer();
  const parser = new TemplateParser();

  // Load template
  const templatePath = path.join(process.cwd(), 'gap_analysis_scoping', 'template_2.6.2_poc.xlsx');
  const templateBuffer = fs.readFileSync(templatePath);
  const template = parser.parseExcelTemplate(templateBuffer);

  // Sample document
  const sampleDoc = `
    2.6.2.1 - a: Brief Summary
    Basic summary text.
  `;

  const result = await analyzer.analyzeLocalDocument(
    Buffer.from(sampleDoc, 'utf-8'),
    template,
    'document.txt'
  );

  // Generate actionable report
  console.log('DOCUMENT COMPLETENESS REPORT');
  console.log('=' .repeat(50));
  console.log(`Document: ${result.documentName}`);
  console.log(`Analysis Date: ${result.analysisDate.toISOString()}`);
  console.log(`Overall Completeness: ${result.completenessPercentage}%`);
  console.log('=' .repeat(50));

  // Group gaps by severity
  const gapsBySeverity = {
    critical: result.gaps.filter(g => g.severity === 'critical'),
    warning: result.gaps.filter(g => g.severity === 'warning'),
    info: result.gaps.filter(g => g.severity === 'info')
  };

  // Show critical gaps first
  if (gapsBySeverity.critical.length > 0) {
    console.log('\n🔴 CRITICAL GAPS (Must Fix):');
    gapsBySeverity.critical.forEach((gap, index) => {
      console.log(`\n${index + 1}. ${gap.ruleName}`);
      console.log(`   Action: ${gap.remediationSteps[0]}`);
    });
  }

  // Show warning gaps
  if (gapsBySeverity.warning.length > 0) {
    console.log('\n⚠️  WARNING GAPS (Should Fix):');
    gapsBySeverity.warning.slice(0, 5).forEach((gap, index) => {
      console.log(`\n${index + 1}. ${gap.ruleName}`);
      console.log(`   Action: ${gap.remediationSteps[0].substring(0, 80)}...`);
    });
    if (gapsBySeverity.warning.length > 5) {
      console.log(`\n   ... and ${gapsBySeverity.warning.length - 5} more warnings`);
    }
  }

  return result;
}

// Run examples if executed directly
if (require.main === module) {
  (async () => {
    try {
      await analyzeDocumentWithExcelTemplate();
      await analyzeDocxDocument();
      await compareTwoDocuments();
      await generateActionableGapReport();
    } catch (error) {
      console.error('Error running examples:', error);
      process.exit(1);
    }
  })();
}
