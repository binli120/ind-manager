/**
 * Template Analysis Utility
 * 
 * This utility demonstrates how to analyze templates and extract structured validation rules.
 * It provides examples of working with both JSON templates and the expected Excel structure.
 */

import { TemplateParser, ValidationRule, ValidationRuleSet } from './template-parser';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Analyze a JSON template file and display extracted rules
 */
export function analyzeJsonTemplate(templatePath: string): void {
  console.log('='.repeat(80));
  console.log('JSON TEMPLATE ANALYSIS');
  console.log('='.repeat(80));
  console.log(`\nAnalyzing template: ${templatePath}\n`);

  try {
    // Read template file
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const template = JSON.parse(templateContent);

    // Display template structure
    console.log('Template Structure:');
    console.log('-'.repeat(80));
    console.log(JSON.stringify(template, null, 2));
    console.log('\n');

    // Parse template and extract rules
    const parser = new TemplateParser();
    const ruleSet = parser.parseJsonTemplate(templateContent);

    // Display extracted rules
    console.log('Extracted Validation Rules:');
    console.log('-'.repeat(80));
    console.log(`Template Name: ${ruleSet.name}`);
    console.log(`Template Type: ${ruleSet.templateType}`);
    console.log(`Total Rules: ${ruleSet.rules.length}\n`);

    // Group rules by severity
    const criticalRules = ruleSet.rules.filter(r => r.severity === 'critical');
    const warningRules = ruleSet.rules.filter(r => r.severity === 'warning');
    const infoRules = ruleSet.rules.filter(r => r.severity === 'info');

    console.log(`Critical Rules: ${criticalRules.length}`);
    console.log(`Warning Rules: ${warningRules.length}`);
    console.log(`Info Rules: ${infoRules.length}\n`);

    // Display rules by severity
    displayRulesBySeverity('CRITICAL', criticalRules);
    displayRulesBySeverity('WARNING', warningRules);
    displayRulesBySeverity('INFO', infoRules);

    // Display rule statistics
    displayRuleStatistics(ruleSet.rules);

  } catch (error) {
    console.error('Error analyzing template:', error);
  }
}

/**
 * Display rules grouped by severity
 */
function displayRulesBySeverity(severity: string, rules: ValidationRule[]): void {
  if (rules.length === 0) return;

  console.log(`\n${severity} RULES:`);
  console.log('='.repeat(80));

  rules.forEach((rule, index) => {
    console.log(`\n${index + 1}. ${rule.name}`);
    console.log(`   Field: ${rule.field}`);
    console.log(`   Type: ${rule.type}`);
    console.log(`   Required: ${rule.required ? 'Yes' : 'No'}`);
    console.log(`   Description: ${rule.description}`);
    console.log(`   Remediation: ${rule.remediationHint}`);
  });
}

/**
 * Display rule statistics
 */
function displayRuleStatistics(rules: ValidationRule[]): void {
  console.log('\n');
  console.log('='.repeat(80));
  console.log('RULE STATISTICS');
  console.log('='.repeat(80));

  // Count by type
  const contentPresenceRules = rules.filter(r => r.type === 'content_presence').length;
  const formatRequirementRules = rules.filter(r => r.type === 'format_requirement').length;

  console.log(`\nRule Types:`);
  console.log(`  Content Presence: ${contentPresenceRules}`);
  console.log(`  Format Requirement: ${formatRequirementRules}`);

  // Count required vs optional
  const requiredRules = rules.filter(r => r.required).length;
  const optionalRules = rules.filter(r => !r.required).length;

  console.log(`\nRule Requirements:`);
  console.log(`  Required: ${requiredRules}`);
  console.log(`  Optional: ${optionalRules}`);

  // Count by field
  const fieldCounts = rules.reduce((acc, rule) => {
    acc[rule.field] = (acc[rule.field] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`\nRules by Field:`);
  Object.entries(fieldCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([field, count]) => {
      console.log(`  ${field}: ${count} rule(s)`);
    });
}

/**
 * Generate a validation rule summary report
 */
export function generateRuleSummaryReport(ruleSet: ValidationRuleSet): string {
  let report = '';

  report += '# Validation Rule Summary Report\n\n';
  report += `**Template**: ${ruleSet.name}\n`;
  report += `**Type**: ${ruleSet.templateType}\n`;
  report += `**Total Rules**: ${ruleSet.rules.length}\n\n`;

  // Critical rules section
  const criticalRules = ruleSet.rules.filter(r => r.severity === 'critical');
  if (criticalRules.length > 0) {
    report += '## Critical Rules (Must Fix)\n\n';
    criticalRules.forEach((rule, index) => {
      report += `### ${index + 1}. ${rule.name}\n\n`;
      report += `- **Field**: \`${rule.field}\`\n`;
      report += `- **Type**: ${rule.type}\n`;
      report += `- **Required**: ${rule.required ? 'Yes' : 'No'}\n`;
      report += `- **Description**: ${rule.description}\n`;
      report += `- **Remediation**: ${rule.remediationHint}\n\n`;
    });
  }

  // Warning rules section
  const warningRules = ruleSet.rules.filter(r => r.severity === 'warning');
  if (warningRules.length > 0) {
    report += '## Warning Rules (Should Fix)\n\n';
    warningRules.forEach((rule, index) => {
      report += `### ${index + 1}. ${rule.name}\n\n`;
      report += `- **Field**: \`${rule.field}\`\n`;
      report += `- **Type**: ${rule.type}\n`;
      report += `- **Required**: ${rule.required ? 'Yes' : 'No'}\n`;
      report += `- **Description**: ${rule.description}\n`;
      report += `- **Remediation**: ${rule.remediationHint}\n\n`;
    });
  }

  // Info rules section
  const infoRules = ruleSet.rules.filter(r => r.severity === 'info');
  if (infoRules.length > 0) {
    report += '## Info Rules (Optional)\n\n';
    infoRules.forEach((rule, index) => {
      report += `### ${index + 1}. ${rule.name}\n\n`;
      report += `- **Field**: \`${rule.field}\`\n`;
      report += `- **Type**: ${rule.type}\n`;
      report += `- **Required**: ${rule.required ? 'Yes' : 'No'}\n`;
      report += `- **Description**: ${rule.description}\n`;
      report += `- **Remediation**: ${rule.remediationHint}\n\n`;
    });
  }

  return report;
}

/**
 * Compare two templates and show differences
 */
export function compareTemplates(template1Path: string, template2Path: string): void {
  console.log('='.repeat(80));
  console.log('TEMPLATE COMPARISON');
  console.log('='.repeat(80));

  try {
    const parser = new TemplateParser();

    // Parse both templates
    const content1 = fs.readFileSync(template1Path, 'utf-8');
    const content2 = fs.readFileSync(template2Path, 'utf-8');

    const ruleSet1 = parser.parseJsonTemplate(content1);
    const ruleSet2 = parser.parseJsonTemplate(content2);

    console.log(`\nTemplate 1: ${ruleSet1.name} (${ruleSet1.rules.length} rules)`);
    console.log(`Template 2: ${ruleSet2.name} (${ruleSet2.rules.length} rules)\n`);

    // Find rules only in template 1
    const onlyIn1 = ruleSet1.rules.filter(r1 => 
      !ruleSet2.rules.some(r2 => r2.name === r1.name)
    );

    // Find rules only in template 2
    const onlyIn2 = ruleSet2.rules.filter(r2 => 
      !ruleSet1.rules.some(r1 => r1.name === r2.name)
    );

    // Find common rules
    const common = ruleSet1.rules.filter(r1 => 
      ruleSet2.rules.some(r2 => r2.name === r1.name)
    );

    console.log('Comparison Results:');
    console.log('-'.repeat(80));
    console.log(`Common Rules: ${common.length}`);
    console.log(`Only in Template 1: ${onlyIn1.length}`);
    console.log(`Only in Template 2: ${onlyIn2.length}\n`);

    if (onlyIn1.length > 0) {
      console.log('Rules only in Template 1:');
      onlyIn1.forEach(rule => console.log(`  - ${rule.name} (${rule.field})`));
      console.log('');
    }

    if (onlyIn2.length > 0) {
      console.log('Rules only in Template 2:');
      onlyIn2.forEach(rule => console.log(`  - ${rule.name} (${rule.field})`));
      console.log('');
    }

  } catch (error) {
    console.error('Error comparing templates:', error);
  }
}

/**
 * Validate a document against a template
 */
export function validateDocumentAgainstTemplate(
  documentPath: string,
  templatePath: string
): void {
  console.log('='.repeat(80));
  console.log('DOCUMENT VALIDATION');
  console.log('='.repeat(80));

  try {
    // Read document and template
    const documentContent = fs.readFileSync(documentPath, 'utf-8');
    const document = JSON.parse(documentContent);

    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const parser = new TemplateParser();
    const ruleSet = parser.parseJsonTemplate(templateContent);

    console.log(`\nDocument: ${documentPath}`);
    console.log(`Template: ${ruleSet.name}\n`);

    // Validate each rule
    let passedRules = 0;
    let failedRules = 0;
    const failures: Array<{ rule: ValidationRule; reason: string }> = [];

    ruleSet.rules.forEach(rule => {
      const fieldValue = document[rule.field];

      // Check content presence
      if (rule.type === 'content_presence') {
        if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
          if (rule.required) {
            failedRules++;
            failures.push({ rule, reason: 'Field is missing or empty' });
          } else {
            passedRules++;
          }
        } else {
          passedRules++;
        }
      }

      // Check format requirements
      if (rule.type === 'format_requirement') {
        if (fieldValue !== undefined && fieldValue !== null) {
          // Basic format checks
          if (rule.field === 'summary_text' && rule.name.includes('Length')) {
            if (typeof fieldValue === 'string' && fieldValue.length < 100) {
              failedRules++;
              failures.push({ rule, reason: `Text too short (${fieldValue.length} < 100 characters)` });
            } else {
              passedRules++;
            }
          } else if (rule.field === 'section' && rule.name.includes('Format')) {
            const sectionPattern = /^\d+\.\d+(\.\d+)?$/;
            if (typeof fieldValue === 'string' && !sectionPattern.test(fieldValue)) {
              failedRules++;
              failures.push({ rule, reason: `Invalid section format: "${fieldValue}"` });
            } else {
              passedRules++;
            }
          } else {
            passedRules++;
          }
        } else if (rule.required) {
          failedRules++;
          failures.push({ rule, reason: 'Field is missing' });
        } else {
          passedRules++;
        }
      }
    });

    // Display results
    console.log('Validation Results:');
    console.log('-'.repeat(80));
    console.log(`Total Rules: ${ruleSet.rules.length}`);
    console.log(`Passed: ${passedRules}`);
    console.log(`Failed: ${failedRules}`);
    console.log(`Completeness: ${Math.round((passedRules / ruleSet.rules.length) * 100)}%\n`);

    if (failures.length > 0) {
      console.log('Failed Rules:');
      console.log('-'.repeat(80));
      failures.forEach((failure, index) => {
        console.log(`\n${index + 1}. ${failure.rule.name} [${failure.rule.severity.toUpperCase()}]`);
        console.log(`   Field: ${failure.rule.field}`);
        console.log(`   Reason: ${failure.reason}`);
        console.log(`   Remediation: ${failure.rule.remediationHint}`);
      });
    } else {
      console.log('✓ All validation rules passed!');
    }

  } catch (error) {
    console.error('Error validating document:', error);
  }
}

// Example usage
if (require.main === module) {
  const templatePath = path.join(__dirname, '../../2.6.2-summary.json');
  
  console.log('\n');
  analyzeJsonTemplate(templatePath);
  console.log('\n');
}
