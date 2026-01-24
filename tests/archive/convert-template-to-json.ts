/**
 * Script to convert Excel template to JSON format for faster loading
 * Reads template_2.6.2_poc.xlsx and outputs template_2.6.2_poc.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { TemplateParser } from '../features/validation/template-parser';

async function convertTemplateToJson() {
  try {
    console.log('Converting Excel template to JSON...');
    
    // Read Excel file
    const excelPath = path.join(__dirname, '../resources/template_2.6.2_poc.xlsx');
    const excelBuffer = fs.readFileSync(excelPath);
    
    console.log(`Read Excel file: ${excelPath}`);
    
    // Parse Excel template
    const parser = new TemplateParser();
    const ruleSet = parser.parseExcelTemplate(excelBuffer);
    
    console.log(`Parsed ${ruleSet.rules.length} validation rules from template`);
    
    // Create JSON output
    const jsonOutput = {
      name: ruleSet.name,
      templateType: ruleSet.templateType,
      rules: ruleSet.rules,
      metadata: {
        convertedFrom: 'template_2.6.2_poc.xlsx',
        convertedAt: new Date().toISOString(),
        ruleCount: ruleSet.rules.length
      }
    };
    
    // Write JSON file
    const jsonPath = path.join(__dirname, '../resources/template_2.6.2_poc.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2));
    
    console.log(`✓ Successfully converted template to JSON: ${jsonPath}`);
    console.log(`  - Total rules: ${ruleSet.rules.length}`);
    console.log(`  - Template name: ${ruleSet.name}`);
    
    // Print rule breakdown
    const criticalRules = ruleSet.rules.filter(r => r.severity === 'critical').length;
    const warningRules = ruleSet.rules.filter(r => r.severity === 'warning').length;
    const infoRules = ruleSet.rules.filter(r => r.severity === 'info').length;
    
    console.log(`\nRule Breakdown:`);
    console.log(`  - Critical: ${criticalRules}`);
    console.log(`  - Warning: ${warningRules}`);
    console.log(`  - Info: ${infoRules}`);
    
  } catch (error) {
    console.error('Error converting template:', error);
    process.exit(1);
  }
}

// Run conversion
convertTemplateToJson();
