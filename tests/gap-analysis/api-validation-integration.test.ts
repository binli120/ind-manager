/**
 * Integration test for API validation endpoint
 * Tests the connection between HTML editor and validation API
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('API Validation Integration', () => {
  const API_URL = 'http://localhost:3000/api/gap-analysis/validation';
  let templateData: any;
  let documentData: any;

  beforeAll(() => {
    // Load test files
    const templatePath = join(process.cwd(), 'gap_analysis_scoping/resources/template_2.6.2_poc.json');
    const documentPath = join(process.cwd(), 'gap_analysis_scoping/resources/2.6.2-summary.json');
    
    templateData = JSON.parse(readFileSync(templatePath, 'utf-8'));
    documentData = JSON.parse(readFileSync(documentPath, 'utf-8'));
  });

  it('should successfully validate a document via API', async () => {
    // Convert data to base64
    const templateBase64 = Buffer.from(JSON.stringify(templateData)).toString('base64');
    const documentBase64 = Buffer.from(JSON.stringify(documentData)).toString('base64');

    // Send validation request
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateFile: templateBase64,
        templateName: 'template_2.6.2_poc.json',
        documentFile: documentBase64,
        documentName: '2.6.2-summary.json',
        templateType: 'json'
      })
    });

    expect(response.ok).toBe(true);
    
    const result = await response.json();
    
    // Verify response structure
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('data');
    expect(result.data).toHaveProperty('validation');
    expect(result.data).toHaveProperty('gaps');
    expect(result.data).toHaveProperty('alerts');
    
    // Verify validation results
    expect(result.data.validation).toHaveProperty('completenessPercentage');
    expect(result.data.validation).toHaveProperty('totalRules');
    expect(result.data.validation).toHaveProperty('passedRules');
    expect(result.data.validation).toHaveProperty('failedRules');
    
    console.log('Validation Results:');
    console.log(`- Completeness: ${result.data.validation.completenessPercentage}%`);
    console.log(`- Total Rules: ${result.data.validation.totalRules}`);
    console.log(`- Passed: ${result.data.validation.passedRules}`);
    console.log(`- Failed: ${result.data.validation.failedRules}`);
    console.log(`- Gaps Found: ${result.data.gaps.length}`);
    console.log(`- Alerts Generated: ${result.data.alerts.length}`);
  }, 30000); // 30 second timeout

  it('should handle validation errors gracefully', async () => {
    // Send invalid request (missing required fields)
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateFile: 'invalid',
        templateName: 'test.json'
        // Missing documentFile and other required fields
      })
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    
    const result = await response.json();
    expect(result).toHaveProperty('error');
    expect(result).toHaveProperty('details');
  });

  it('should handle invalid template type', async () => {
    const templateBase64 = Buffer.from(JSON.stringify(templateData)).toString('base64');
    const documentBase64 = Buffer.from(JSON.stringify(documentData)).toString('base64');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateFile: templateBase64,
        templateName: 'template.json',
        documentFile: documentBase64,
        documentName: 'document.json',
        templateType: 'invalid' // Invalid type
      })
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    
    const result = await response.json();
    expect(result.error).toContain('Invalid template type');
  });

  it('should support debounced validation updates', async () => {
    // Simulate multiple rapid validation requests (as would happen with debouncing)
    const templateBase64 = Buffer.from(JSON.stringify(templateData)).toString('base64');
    
    const requests = [];
    for (let i = 0; i < 3; i++) {
      const content = `<p>Document content version ${i}</p>`;
      const documentBase64 = Buffer.from(content).toString('base64');
      
      requests.push(
        fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            templateFile: templateBase64,
            templateName: 'template.json',
            documentFile: documentBase64,
            documentName: 'document.html',
            templateType: 'json'
          })
        })
      );
    }

    // All requests should succeed
    const responses = await Promise.all(requests);
    responses.forEach(response => {
      expect(response.ok).toBe(true);
    });
  }, 30000);

  it('should return validation results with gaps for empty document', async () => {
    const templateBase64 = Buffer.from(JSON.stringify(templateData)).toString('base64');
    const emptyDocument = '<p>Empty document</p>';
    const documentBase64 = Buffer.from(emptyDocument).toString('base64');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateFile: templateBase64,
        templateName: 'template.json',
        documentFile: documentBase64,
        documentName: 'empty.html',
        templateType: 'json'
      })
    });

    expect(response.ok).toBe(true);
    
    const result = await response.json();
    
    // Empty document should have many gaps
    expect(result.data.gaps.length).toBeGreaterThan(0);
    expect(result.data.validation.completenessPercentage).toBeLessThan(100);
    
    console.log('Empty Document Validation:');
    console.log(`- Gaps: ${result.data.gaps.length}`);
    console.log(`- Completeness: ${result.data.validation.completenessPercentage}%`);
  }, 30000);
});
