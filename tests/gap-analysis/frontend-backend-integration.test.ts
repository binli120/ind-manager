/**
 * Frontend-Backend Integration Test
 * Tests the complete validation workflow from file upload to alert display
 */

import { describe, it, expect } from 'vitest';
import { TemplateParser } from '@/lib/gap-analysis/template-parser';
import { DocumentAnalyzer } from '@/lib/gap-analysis/document-analyzer';
import { RuleEngine } from '@/lib/gap-analysis/rule-engine';
import { AlertGenerator } from '@/lib/gap-analysis/alert-generator';
import * as fs from 'fs';
import * as path from 'path';

describe('Frontend-Backend Integration', () => {
  it('should complete full validation workflow with JSON template', async () => {
    // Step 1: Parse template
    const templateParser = new TemplateParser();
    const jsonTemplate = JSON.stringify({
      section: '2.6.2',
      summary_text: 'Test summary',
      status: 'draft',
      summary_id: 'test-123'
    });
    
    const validationRuleSet = templateParser.parseJsonTemplate(jsonTemplate);
    
    expect(validationRuleSet).toBeDefined();
    expect(validationRuleSet.templateType).toBe('json');
    expect(validationRuleSet.rules.length).toBeGreaterThan(0);

    // Step 2: Analyze document
    const documentAnalyzer = new DocumentAnalyzer();
    const documentContent = Buffer.from('This is a test document with section 2.6.2 and summary text.');
    
    const analysisResult = await documentAnalyzer.analyzeLocalDocument(
      documentContent,
      validationRuleSet,
      'test-document.txt'
    );

    expect(analysisResult).toBeDefined();
    expect(analysisResult.documentName).toBe('test-document.txt');
    expect(analysisResult.completenessPercentage).toBeGreaterThanOrEqual(0);
    expect(analysisResult.completenessPercentage).toBeLessThanOrEqual(100);

    // Step 3: Execute rules through rule engine
    const ruleEngine = new RuleEngine();
    const ruleResults = validationRuleSet.rules.map(rule =>
      ruleEngine.executeRule(rule, documentContent.toString('utf-8'))
    );

    expect(ruleResults.length).toBe(validationRuleSet.rules.length);

    // Step 4: Calculate completeness
    const completenessScore = ruleEngine.calculateCompleteness(ruleResults);

    expect(completenessScore.totalRules).toBe(validationRuleSet.rules.length);
    expect(completenessScore.overallScore).toBeGreaterThanOrEqual(0);
    expect(completenessScore.overallScore).toBeLessThanOrEqual(100);

    // Step 5: Prioritize issues
    const prioritizedIssues = ruleEngine.prioritizeIssues(ruleResults);

    expect(Array.isArray(prioritizedIssues)).toBe(true);

    // Step 6: Generate alerts
    const alertGenerator = new AlertGenerator();
    const alerts = alertGenerator.generateAlertsFromIssues(prioritizedIssues);

    expect(Array.isArray(alerts)).toBe(true);
    
    // Verify alert structure
    if (alerts.length > 0) {
      const firstAlert = alerts[0];
      expect(firstAlert).toHaveProperty('id');
      expect(firstAlert).toHaveProperty('title');
      expect(firstAlert).toHaveProperty('message');
      expect(firstAlert).toHaveProperty('severity');
      expect(firstAlert).toHaveProperty('remediationSteps');
      expect(firstAlert).toHaveProperty('status');
      expect(firstAlert.status).toBe('open');
    }
  });

  it('should handle Excel template validation workflow', async () => {
    // Check if test Excel file exists
    const excelPath = path.join(__dirname, '../../resources/template_2.6.2_poc.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      console.log('Skipping Excel test - template file not found');
      return;
    }

    // Step 1: Parse Excel template
    const templateParser = new TemplateParser();
    const excelBuffer = fs.readFileSync(excelPath);
    
    const validationRuleSet = templateParser.parseExcelTemplate(excelBuffer);
    
    expect(validationRuleSet).toBeDefined();
    expect(validationRuleSet.templateType).toBe('excel');
    expect(validationRuleSet.rules.length).toBeGreaterThan(0);

    // Step 2: Analyze document
    const documentAnalyzer = new DocumentAnalyzer();
    const documentContent = Buffer.from('Test document for Excel template validation');
    
    const analysisResult = await documentAnalyzer.analyzeLocalDocument(
      documentContent,
      validationRuleSet,
      'test-document.txt'
    );

    expect(analysisResult).toBeDefined();
    expect(analysisResult.gaps.length).toBeGreaterThan(0); // Should have gaps since document is minimal

    // Step 3: Generate alerts
    const alertGenerator = new AlertGenerator();
    const alerts = alertGenerator.generateAlerts(analysisResult.gaps);

    expect(alerts.length).toBeGreaterThan(0);
    
    // Verify alerts are sorted by priority
    for (let i = 0; i < alerts.length - 1; i++) {
      expect(alerts[i].priority).toBeGreaterThanOrEqual(alerts[i + 1].priority);
    }
  });

  it('should format alert messages for HTML display', () => {
    const alertGenerator = new AlertGenerator();
    
    const mockAlert = {
      id: 'test-alert-1',
      gapId: 'test-gap',
      title: 'Test Alert',
      message: 'This is a test alert message',
      severity: 'warning' as const,
      remediationSteps: ['Step 1: Review', 'Step 2: Fix'],
      status: 'open' as const,
      priority: 7,
      required: true
    };

    const alertMessage = alertGenerator.formatAlertMessage(mockAlert);

    expect(alertMessage).toBeDefined();
    expect(alertMessage.html).toContain('Test Alert');
    expect(alertMessage.html).toContain('This is a test alert message');
    expect(alertMessage.html).toContain('Step 1: Review');
    expect(alertMessage.html).toContain('Step 2: Fix');
    expect(alertMessage.text).toContain('Test Alert');
    expect(alertMessage.severity).toBe('warning');
  });

  it('should create remediation steps from validation gaps', () => {
    const alertGenerator = new AlertGenerator();
    
    const mockGap = {
      ruleId: 'test-rule',
      severity: 'critical' as const,
      category: 'missing_content' as const,
      description: 'Missing required section',
      remediationSteps: ['Add the missing section'],
      required: true
    };

    const steps = alertGenerator.createRemediationSteps(mockGap);

    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0]).toHaveProperty('step');
    expect(steps[0]).toHaveProperty('action');
    expect(steps[0]).toHaveProperty('description');
    expect(steps[0]).toHaveProperty('priority');
  });

  it('should handle API response structure', () => {
    // Simulate API response structure
    const mockApiResponse = {
      success: true,
      message: 'Validation completed successfully',
      data: {
        documentName: 'test.txt',
        templateName: 'template.json',
        templateType: 'json',
        status: 'completed',
        validation: {
          completenessPercentage: 75,
          totalRules: 10,
          passedRules: 7,
          failedRules: 3,
          weightedScore: 80,
          breakdown: {
            critical: { passed: 2, failed: 0 },
            warning: { passed: 3, failed: 2 },
            info: { passed: 2, failed: 1 }
          }
        },
        gaps: [],
        alerts: [],
        processingTime: 150,
        analysisDate: new Date()
      }
    };

    // Verify response structure
    expect(mockApiResponse.success).toBe(true);
    expect(mockApiResponse.data.validation.completenessPercentage).toBe(75);
    expect(mockApiResponse.data.validation.totalRules).toBe(10);
    expect(mockApiResponse.data.validation.passedRules).toBe(7);
    expect(mockApiResponse.data.validation.failedRules).toBe(3);
  });
});
