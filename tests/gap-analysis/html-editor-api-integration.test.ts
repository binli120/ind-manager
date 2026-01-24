/**
 * Integration test for HTML Editor with Validation API
 * Tests the complete integration including debouncing and error handling
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('HTML Editor API Integration', () => {
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

  describe('API Connection', () => {
    it('should connect to validation API endpoint', async () => {
      const response = await fetch(API_URL, {
        method: 'GET'
      });

      expect(response.ok).toBe(true);
      
      const result = await response.json();
      expect(result.status).toBe('ok');
      expect(result.message).toContain('Validation API');
    });

    it('should validate document via POST request', async () => {
      const templateBase64 = Buffer.from(JSON.stringify(templateData)).toString('base64');
      const documentBase64 = Buffer.from(JSON.stringify(documentData)).toString('base64');

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
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('validation');
      expect(result.data).toHaveProperty('gaps');
      expect(result.data).toHaveProperty('alerts');
    }, 30000);
  });

  describe('Debounced Validation Updates', () => {
    it('should handle rapid successive validation requests', async () => {
      const templateBase64 = Buffer.from(JSON.stringify(templateData)).toString('base64');
      
      // Simulate rapid content changes (as would happen with debouncing)
      const requests = [];
      for (let i = 0; i < 5; i++) {
        const content = `<h2>Section 2.6.2.1</h2><p>Content version ${i}</p>`;
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

      // Verify last response has validation results
      const lastResult = await responses[responses.length - 1].json();
      expect(lastResult.success).toBe(true);
      expect(lastResult.data.validation).toBeDefined();
    }, 30000);

    it('should update indicators based on content changes', async () => {
      const templateBase64 = Buffer.from(JSON.stringify(templateData)).toString('base64');
      
      // First validation: empty document
      const emptyContent = '<p>Empty document</p>';
      const emptyBase64 = Buffer.from(emptyContent).toString('base64');
      
      const emptyResponse = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateFile: templateBase64,
          templateName: 'template.json',
          documentFile: emptyBase64,
          documentName: 'document.html',
          templateType: 'json'
        })
      });

      const emptyResult = await emptyResponse.json();
      const emptyGapCount = emptyResult.data.gaps.length;

      // Second validation: document with some content
      const contentWithSections = `
        <h2>2.6.2.1 - a: Brief Summary</h2>
        <p>This is a brief summary of the nonclinical findings.</p>
        <h2>2.6.2.2 - a: Primary Pharmacodynamics</h2>
        <p>Study objectives and endpoints are described here.</p>
      `;
      const contentBase64 = Buffer.from(contentWithSections).toString('base64');
      
      const contentResponse = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateFile: templateBase64,
          templateName: 'template.json',
          documentFile: contentBase64,
          documentName: 'document.html',
          templateType: 'json'
        })
      });

      const contentResult = await contentResponse.json();
      const contentGapCount = contentResult.data.gaps.length;

      // Document with content should have fewer gaps
      expect(contentGapCount).toBeLessThan(emptyGapCount);
      
      console.log('Gap count comparison:');
      console.log(`- Empty document: ${emptyGapCount} gaps`);
      console.log(`- Document with content: ${contentGapCount} gaps`);
      console.log(`- Reduction: ${emptyGapCount - contentGapCount} gaps fixed`);
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle missing required fields gracefully', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateFile: 'test',
          // Missing other required fields
        })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      
      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Missing required fields');
    });

    it('should handle invalid template type gracefully', async () => {
      const templateBase64 = Buffer.from(JSON.stringify(templateData)).toString('base64');
      const documentBase64 = Buffer.from('test').toString('base64');

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateFile: templateBase64,
          templateName: 'template.json',
          documentFile: documentBase64,
          documentName: 'document.html',
          templateType: 'invalid'
        })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      
      const result = await response.json();
      expect(result.error).toContain('Invalid template type');
    });

    it('should handle malformed template data gracefully', async () => {
      const malformedTemplate = Buffer.from('not valid json {').toString('base64');
      const documentBase64 = Buffer.from('test').toString('base64');

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateFile: malformedTemplate,
          templateName: 'template.json',
          documentFile: documentBase64,
          documentName: 'document.html',
          templateType: 'json'
        })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      
      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Template parsing failed');
    });

    it('should handle network errors gracefully', async () => {
      // Test with invalid URL to simulate network error
      const invalidUrl = 'http://localhost:9999/api/gap-analysis/validation';
      
      try {
        await fetch(invalidUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            templateFile: 'test',
            templateName: 'test.json',
            documentFile: 'test',
            documentName: 'test.html',
            templateType: 'json'
          })
        });
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Network error should be caught
        expect(error).toBeDefined();
      }
    });
  });

  describe('Validation Results Format', () => {
    it('should return properly formatted validation results', async () => {
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
          templateType: 'json'
        })
      });

      const result = await response.json();
      
      // Verify response structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('data');
      
      // Verify data structure
      const data = result.data;
      expect(data).toHaveProperty('documentName');
      expect(data).toHaveProperty('templateName');
      expect(data).toHaveProperty('validation');
      expect(data).toHaveProperty('gaps');
      expect(data).toHaveProperty('alerts');
      expect(data).toHaveProperty('processingTime');
      expect(data).toHaveProperty('analysisDate');
      
      // Verify validation structure
      const validation = data.validation;
      expect(validation).toHaveProperty('completenessPercentage');
      expect(validation).toHaveProperty('totalRules');
      expect(validation).toHaveProperty('passedRules');
      expect(validation).toHaveProperty('failedRules');
      expect(validation).toHaveProperty('breakdown');
      
      // Verify breakdown structure
      const breakdown = validation.breakdown;
      expect(breakdown).toHaveProperty('critical');
      expect(breakdown).toHaveProperty('warning');
      expect(breakdown).toHaveProperty('info');
      
      // Verify gaps are arrays
      expect(Array.isArray(data.gaps)).toBe(true);
      expect(Array.isArray(data.alerts)).toBe(true);
      
      // Verify gap structure if gaps exist
      if (data.gaps.length > 0) {
        const gap = data.gaps[0];
        expect(gap).toHaveProperty('ruleId');
        expect(gap).toHaveProperty('severity');
        expect(gap).toHaveProperty('category');
        expect(gap).toHaveProperty('description');
        expect(gap).toHaveProperty('remediationSteps');
      }
    }, 30000);

    it('should include proper severity levels in gaps', async () => {
      const templateBase64 = Buffer.from(JSON.stringify(templateData)).toString('base64');
      const emptyContent = '<p>Empty</p>';
      const documentBase64 = Buffer.from(emptyContent).toString('base64');

      const response = await fetch(API_URL, {
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
      });

      const result = await response.json();
      const gaps = result.data.gaps;
      
      // Verify all gaps have valid severity levels
      const validSeverities = ['critical', 'warning', 'info'];
      gaps.forEach((gap: any) => {
        expect(validSeverities).toContain(gap.severity);
      });
      
      // Count by severity
      const criticalCount = gaps.filter((g: any) => g.severity === 'critical').length;
      const warningCount = gaps.filter((g: any) => g.severity === 'warning').length;
      const infoCount = gaps.filter((g: any) => g.severity === 'info').length;
      
      console.log('Severity distribution:');
      console.log(`- Critical: ${criticalCount}`);
      console.log(`- Warning: ${warningCount}`);
      console.log(`- Info: ${infoCount}`);
      console.log(`- Total: ${gaps.length}`);
    }, 30000);
  });
});
