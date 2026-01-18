/**
 * Test Excel Template Parsing
 * 
 * This script tests the Excel parsing functionality with the actual template file.
 */

import { TemplateParser } from '../features/validation/template-parser';
import * as fs from 'fs';
import * as path from 'path';

function testExcelParsing() {
  console.log('='.repeat(80));
  console.log('EXCEL TEMPLATE PARSING TEST');
  console.log('='.repeat(80));
  console.log('');

  const excelPath = path.join(__dirname, '../resources/template_2.6.2_poc.xlsx');
  
  console.log(`Reading Excel template: ${excelPath}\n`);

  try {
    // Check if file exists
    if (!fs.existsSync(excelPath)) {
      console.error(`❌ Error: Excel file not found at ${excelPath}`);
      console.log('\nAvailable files in gap_analysis_scoping:');
      const files = fs.readdirSync(path.join(__dirname, '../..'));
      files.forEach(file => console.log(`  - ${file}`));
      return;
    }

    // Read Excel file
    const fileContent = fs.readFileSync(excelPath);
    console.log(`✓ File read successfully (${fileContent.length} bytes)\n`);

    // Parse template
    const parser = new TemplateParser();
    console.log('Parsing Excel template...\n');
    
    const ruleSet = parser.parseExcelTemplate(fileContent);

    // Display results
    console.log('='.repeat(80));
    console.log('PARSING RESULTS');
    console.log('='.repeat(80));
    console.log(`\nTemplate Name: ${ruleSet.name}`);
    console.log(`Template Type: ${ruleSet.templateType}`);
    console.log(`Total Rules Extracted: ${ruleSet.rules.length}\n`);

    // Group by severity
    const criticalRules = ruleSet.rules.filter(r => r.severity === 'critical');
    const warningRules = ruleSet.rules.filter(r => r.severity === 'warning');
    const infoRules = ruleSet.rules.filter(r => r.severity === 'info');

    console.log('Rules by Severity:');
    console.log(`  Critical: ${criticalRules.length}`);
    console.log(`  Warning: ${warningRules.length}`);
    console.log(`  Info: ${infoRules.length}\n`);

    // Display all rules
    console.log('='.repeat(80));
    console.log('EXTRACTED RULES');
    console.log('='.repeat(80));

    if (criticalRules.length > 0) {
      console.log('\n🔴 CRITICAL RULES:');
      criticalRules.forEach((rule, i) => {
        console.log(`\n${i + 1}. ${rule.name}`);
        console.log(`   Field: ${rule.field}`);
        console.log(`   Type: ${rule.type}`);
        console.log(`   Required: ${rule.required}`);
        console.log(`   Description: ${rule.description}`);
      });
    }

    if (warningRules.length > 0) {
      console.log('\n\n🟡 WARNING RULES:');
      warningRules.forEach((rule, i) => {
        console.log(`\n${i + 1}. ${rule.name}`);
        console.log(`   Field: ${rule.field}`);
        console.log(`   Type: ${rule.type}`);
        console.log(`   Required: ${rule.required}`);
        console.log(`   Description: ${rule.description}`);
      });
    }

    if (infoRules.length > 0) {
      console.log('\n\n🔵 INFO RULES:');
      infoRules.forEach((rule, i) => {
        console.log(`\n${i + 1}. ${rule.name}`);
        console.log(`   Field: ${rule.field}`);
        console.log(`   Type: ${rule.type}`);
        console.log(`   Required: ${rule.required}`);
        console.log(`   Description: ${rule.description}`);
      });
    }

    console.log('\n\n✅ Excel parsing completed successfully!\n');

  } catch (error) {
    console.error('❌ Error parsing Excel template:');
    console.error(error);
  }
}

// Run test
testExcelParsing();
