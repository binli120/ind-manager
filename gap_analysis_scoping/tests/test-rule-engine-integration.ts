/**
 * Integration test for RuleEngine with TemplateParser and DocumentAnalyzer
 * Validates that RuleEngine works correctly with real validation workflows
 */

import { RuleEngine } from '../features/validation/rule-engine';
import { TemplateParser } from '../features/validation/template-parser';
import { DocumentAnalyzer } from '../features/validation/document-analyzer';
import * as fs from 'fs';
import * as path from 'path';

async function testRuleEngineIntegration() {
  console.log('=== RuleEngine Integration Test ===\n');

  // Initialize components
  const templateParser = new TemplateParser();
  const documentAnalyzer = new DocumentAnalyzer();
  const ruleEngine = new RuleEngine();

  // Load template
  const templatePath = path.join(__dirname, '../../gap_analysis_scoping/resources/template_2.6.2_poc.xlsx');
  
  if (!fs.existsSync(templatePath)) {
    console.log('❌ Template file not found:', templatePath);
    return;
  }

  console.log('📄 Loading template:', templatePath);
  const templateBuffer = fs.readFileSync(templatePath);
  const template = templateParser.parseExcelTemplate(templateBuffer);
  
  console.log(`✅ Template loaded: ${template.name}`);
  console.log(`   Rules extracted: ${template.rules.length}\n`);

  // Load real document data from 2.6.2-summary.json
  const documentPath = path.join(__dirname, '../docs/2.6.2-summary.json');
  
  if (!fs.existsSync(documentPath)) {
    console.log('❌ Document file not found:', documentPath);
    return;
  }

  console.log('📄 Loading real document:', documentPath);
  const documentContent = fs.readFileSync(documentPath, 'utf-8');
  const documentData = JSON.parse(documentContent);
  
  console.log(`✅ Document loaded: Section ${documentData.section}`);
  console.log(`   Status: ${documentData.status}`);
  console.log(`   Summary text length: ${documentData.summary_text?.length || 0} characters\n`);

  // Execute rules using RuleEngine
  console.log('🔍 Executing validation rules...\n');
  
  const ruleResults = template.rules.map(rule => {
    return ruleEngine.executeRule(rule, documentData);
  });

  // Calculate completeness
  const completeness = ruleEngine.calculateCompleteness(ruleResults);
  
  console.log('📊 Completeness Score:');
  console.log(`   Overall Score: ${completeness.overallScore}%`);
  console.log(`   Weighted Score: ${completeness.weightedScore}%`);
  console.log(`   Total Rules: ${completeness.totalRules}`);
  console.log(`   Passed: ${completeness.passedRules}`);
  console.log(`   Failed: ${completeness.failedRules}\n`);

  console.log('📈 Breakdown by Severity:');
  console.log(`   Critical: ${completeness.criticalPassed} passed, ${completeness.criticalFailed} failed`);
  console.log(`   Warning: ${completeness.warningPassed} passed, ${completeness.warningFailed} failed`);
  console.log(`   Info: ${completeness.infoPassed} passed, ${completeness.infoFailed} failed\n`);

  // Prioritize issues
  const prioritizedIssues = ruleEngine.prioritizeIssues(ruleResults);
  
  console.log(`🚨 Prioritized Issues (${prioritizedIssues.length} total):\n`);
  
  // Show top 5 issues
  const topIssues = prioritizedIssues.slice(0, 5);
  topIssues.forEach((issue, index) => {
    console.log(`${index + 1}. [Priority ${issue.priority}] ${issue.severity.toUpperCase()} - ${issue.impact.toUpperCase()} impact`);
    console.log(`   Rule: ${issue.rule.name}`);
    console.log(`   Required: ${issue.required ? 'Yes' : 'No'}`);
    console.log(`   Hint: ${issue.remediationHint.substring(0, 80)}...`);
    console.log('');
  });

  if (prioritizedIssues.length > 5) {
    console.log(`   ... and ${prioritizedIssues.length - 5} more issues\n`);
  }

  // Test with DocumentAnalyzer for comparison
  console.log('🔄 Comparing with DocumentAnalyzer results...\n');
  
  const documentBuffer = Buffer.from(documentContent, 'utf-8');
  const analysisResult = await documentAnalyzer.analyzeLocalDocument(
    documentBuffer,
    template,
    '2.6.2-summary.json'
  );

  console.log('📊 DocumentAnalyzer Results:');
  console.log(`   Completeness: ${analysisResult.completenessPercentage}%`);
  console.log(`   Gaps Found: ${analysisResult.gaps.length}`);
  console.log(`   Processing Time: ${analysisResult.processingTime}ms\n`);

  // Verify consistency
  const ruleEngineFailedCount = ruleResults.filter(r => !r.passed).length;
  const analyzerGapCount = analysisResult.gaps.length;
  
  console.log('✅ Consistency Check:');
  console.log(`   RuleEngine failed rules: ${ruleEngineFailedCount}`);
  console.log(`   DocumentAnalyzer gaps: ${analyzerGapCount}`);
  
  if (Math.abs(ruleEngineFailedCount - analyzerGapCount) <= 2) {
    console.log('   ✅ Results are consistent (within tolerance)\n');
  } else {
    console.log('   ⚠️  Results differ significantly\n');
  }

  console.log('=== Integration Test Complete ===');
}

// Run the test
testRuleEngineIntegration().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
