/**
 * Unit tests for TemplateParser
 * Tests JSON template parsing and validation rule extraction
 */

import { TemplateParser, ValidationRule, ValidationRuleSet } from '../features/validation/template-parser';

describe('TemplateParser', () => {
  let parser: TemplateParser;

  beforeEach(() => {
    parser = new TemplateParser();
  });

  describe('parseJsonTemplate', () => {
    it('should parse a valid JSON template with all fields', () => {
      const jsonContent = JSON.stringify({
        summary_id: 'test-123',
        section: '2.6.2',
        status: 'draft',
        summary_text: 'This is a test summary with sufficient detail to meet minimum requirements for validation purposes.',
        element_numbers: [1, 2, 3],
        previous_summary_id: null
      });

      const result = parser.parseJsonTemplate(jsonContent);

      expect(result.name).toBe('2.6.2');
      expect(result.templateType).toBe('json');
      expect(result.rules).toBeInstanceOf(Array);
      expect(result.rules.length).toBeGreaterThan(0);
    });

    it('should extract validation rules for summary_text field', () => {
      const jsonContent = JSON.stringify({
        summary_text: 'Test summary',
        section: '2.6.2'
      });

      const result = parser.parseJsonTemplate(jsonContent);
      
      const summaryTextRule = result.rules.find(r => r.field === 'summary_text' && r.type === 'content_presence');
      expect(summaryTextRule).toBeDefined();
      expect(summaryTextRule?.required).toBe(true);
      expect(summaryTextRule?.severity).toBe('critical');
    });

    it('should extract validation rules for section field', () => {
      const jsonContent = JSON.stringify({
        section: '2.6.2',
        summary_text: 'Test'
      });

      const result = parser.parseJsonTemplate(jsonContent);
      
      const sectionRule = result.rules.find(r => r.field === 'section');
      expect(sectionRule).toBeDefined();
      expect(sectionRule?.name).toBe('Section Identifier');
      expect(sectionRule?.required).toBe(true);
      expect(sectionRule?.severity).toBe('critical');
    });

    it('should handle templates with optional fields', () => {
      const jsonContent = JSON.stringify({
        summary_id: 'test-456',
        status: 'review',
        element_numbers: []
      });

      const result = parser.parseJsonTemplate(jsonContent);
      
      const optionalRules = result.rules.filter(r => !r.required);
      expect(optionalRules.length).toBeGreaterThan(0);
    });

    it('should throw error for invalid JSON', () => {
      const invalidJson = '{ invalid json }';

      expect(() => parser.parseJsonTemplate(invalidJson)).toThrow('Failed to parse JSON template');
    });

    it('should use summary_id as name if section is not present', () => {
      const jsonContent = JSON.stringify({
        summary_id: 'fallback-name',
        summary_text: 'Test'
      });

      const result = parser.parseJsonTemplate(jsonContent);
      expect(result.name).toBe('fallback-name');
    });

    it('should use "Unknown Template" as fallback name', () => {
      const jsonContent = JSON.stringify({
        summary_text: 'Test'
      });

      const result = parser.parseJsonTemplate(jsonContent);
      expect(result.name).toBe('Unknown Template');
    });
  });

  describe('parseExcelTemplate', () => {
    it('should throw error indicating Excel parsing not implemented', () => {
      const buffer = Buffer.from('fake excel data');

      expect(() => parser.parseExcelTemplate(buffer)).toThrow('Excel template parsing not yet implemented');
    });
  });

  describe('extractValidationRules', () => {
    it('should extract multiple rules from a complete template', () => {
      const template = {
        summary_id: 'test-789',
        section: '2.6.2',
        status: 'draft',
        summary_text: 'Complete summary text',
        element_numbers: [1, 2, 3]
      };

      const rules = parser.extractValidationRules(template);

      expect(rules.length).toBeGreaterThan(4);
      
      // Check for critical rules
      const criticalRules = rules.filter(r => r.severity === 'critical');
      expect(criticalRules.length).toBeGreaterThan(0);
      
      // Check for warning rules
      const warningRules = rules.filter(r => r.severity === 'warning');
      expect(warningRules.length).toBeGreaterThan(0);
      
      // Check for info rules
      const infoRules = rules.filter(r => r.severity === 'info');
      expect(infoRules.length).toBeGreaterThan(0);
    });

    it('should create rules with proper structure', () => {
      const template = {
        summary_text: 'Test',
        section: '2.6.2'
      };

      const rules = parser.extractValidationRules(template);

      rules.forEach(rule => {
        expect(rule).toHaveProperty('name');
        expect(rule).toHaveProperty('description');
        expect(rule).toHaveProperty('type');
        expect(rule).toHaveProperty('field');
        expect(rule).toHaveProperty('required');
        expect(rule).toHaveProperty('severity');
        expect(rule).toHaveProperty('remediationHint');
        
        expect(['content_presence', 'format_requirement']).toContain(rule.type);
        expect(['critical', 'warning', 'info']).toContain(rule.severity);
        expect(typeof rule.required).toBe('boolean');
      });
    });

    it('should return empty array for empty template', () => {
      const template = {};

      const rules = parser.extractValidationRules(template);

      expect(rules).toEqual([]);
    });

    it('should include remediation hints for all rules', () => {
      const template = {
        summary_text: 'Test',
        section: '2.6.2',
        status: 'draft'
      };

      const rules = parser.extractValidationRules(template);

      rules.forEach(rule => {
        expect(rule.remediationHint).toBeTruthy();
        expect(rule.remediationHint.length).toBeGreaterThan(0);
      });
    });
  });
});
