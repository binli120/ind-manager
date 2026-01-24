/**
 * Unit tests for RuleEngine
 * Tests rule execution, completeness calculation, and issue prioritization
 */

import { RuleEngine, RuleCondition, RuleResult } from '../features/validation/rule-engine';
import { ValidationRule } from '../features/validation/template-parser';

describe('RuleEngine', () => {
  let ruleEngine: RuleEngine;

  beforeEach(() => {
    ruleEngine = new RuleEngine();
  });

  describe('executeRule', () => {
    it('should pass content_presence rule when field exists in document', () => {
      const rule: ValidationRule = {
        name: 'Test Content Presence',
        description: 'Test description',
        type: 'content_presence',
        field: '2.6.2.1',
        required: true,
        severity: 'critical',
        remediationHint: 'Add section 2.6.2.1'
      };

      const document = 'This document contains section 2.6.2.1 with some content';
      const result = ruleEngine.executeRule(rule, document);

      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
      expect(result.details).toContain('found');
    });

    it('should fail content_presence rule when field is missing', () => {
      const rule: ValidationRule = {
        name: 'Test Content Presence',
        description: 'Test description',
        type: 'content_presence',
        field: '2.6.2.1',
        required: true,
        severity: 'critical',
        remediationHint: 'Add section 2.6.2.1'
      };

      const document = 'This document does not contain the required section';
      const result = ruleEngine.executeRule(rule, document);

      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
      expect(result.errorMessage).toContain('not found');
    });

    it('should pass format_requirement rule when key terms are present', () => {
      const rule: ValidationRule = {
        name: 'Test Format Requirement',
        description: 'Document must include study objectives and methodology',
        type: 'format_requirement',
        field: 'study_details',
        required: true,
        severity: 'warning',
        remediationHint: 'Add study objectives and methodology'
      };

      const document = 'The study objectives were to evaluate safety. The methodology included randomized trials.';
      const result = ruleEngine.executeRule(rule, document);

      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    });

    it('should fail format_requirement rule when key terms are missing', () => {
      const rule: ValidationRule = {
        name: 'Test Format Requirement',
        description: 'Document must include study objectives and methodology',
        type: 'format_requirement',
        field: 'study_details',
        required: true,
        severity: 'warning',
        remediationHint: 'Add study objectives and methodology'
      };

      const document = 'This is a generic document without the required elements.';
      const result = ruleEngine.executeRule(rule, document);

      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
    });
  });

  describe('evaluateConditions', () => {
    it('should return true when all conditions are met', () => {
      const conditions: RuleCondition[] = [
        { field: 'status', operator: 'equals', value: 'active' },
        { field: 'content', operator: 'contains', value: 'test' }
      ];

      const content = { status: 'active', content: 'This is a test document' };
      const result = ruleEngine.evaluateConditions(conditions, content);

      expect(result).toBe(true);
    });

    it('should return false when any condition fails', () => {
      const conditions: RuleCondition[] = [
        { field: 'status', operator: 'equals', value: 'active' },
        { field: 'content', operator: 'contains', value: 'missing' }
      ];

      const content = { status: 'active', content: 'This is a test document' };
      const result = ruleEngine.evaluateConditions(conditions, content);

      expect(result).toBe(false);
    });

    it('should handle exists operator', () => {
      const conditions: RuleCondition[] = [
        { field: 'title', operator: 'exists' }
      ];

      const content = { title: 'Document Title', content: 'Content' };
      const result = ruleEngine.evaluateConditions(conditions, content);

      expect(result).toBe(true);
    });

    it('should handle length_gte operator', () => {
      const conditions: RuleCondition[] = [
        { field: 'content', operator: 'length_gte', value: 10 }
      ];

      const content = { content: 'This is a long enough content' };
      const result = ruleEngine.evaluateConditions(conditions, content);

      expect(result).toBe(true);
    });
  });

  describe('calculateCompleteness', () => {
    it('should calculate correct overall score', () => {
      const results: RuleResult[] = [
        {
          rule: createMockRule('critical', true),
          passed: true,
          score: 100
        },
        {
          rule: createMockRule('warning', true),
          passed: true,
          score: 100
        },
        {
          rule: createMockRule('info', false),
          passed: false,
          score: 0
        }
      ];

      const completeness = ruleEngine.calculateCompleteness(results);

      expect(completeness.totalRules).toBe(3);
      expect(completeness.passedRules).toBe(2);
      expect(completeness.failedRules).toBe(1);
      expect(completeness.overallScore).toBe(67); // 2/3 = 66.67% rounded to 67
    });

    it('should calculate weighted score correctly', () => {
      const results: RuleResult[] = [
        {
          rule: createMockRule('critical', true),
          passed: true,
          score: 100
        },
        {
          rule: createMockRule('critical', true),
          passed: false,
          score: 0
        },
        {
          rule: createMockRule('info', false),
          passed: true,
          score: 100
        }
      ];

      const completeness = ruleEngine.calculateCompleteness(results);

      // Critical weight = 3, Info weight = 1
      // Total weight = 3 + 3 + 1 = 7
      // Achieved weight = 3 + 0 + 1 = 4
      // Weighted score = 4/7 = 57.14% rounded to 57
      expect(completeness.weightedScore).toBe(57);
    });

    it('should count rules by severity correctly', () => {
      const results: RuleResult[] = [
        {
          rule: createMockRule('critical', true),
          passed: true,
          score: 100
        },
        {
          rule: createMockRule('critical', true),
          passed: false,
          score: 0
        },
        {
          rule: createMockRule('warning', true),
          passed: true,
          score: 100
        },
        {
          rule: createMockRule('info', false),
          passed: false,
          score: 0
        }
      ];

      const completeness = ruleEngine.calculateCompleteness(results);

      expect(completeness.criticalPassed).toBe(1);
      expect(completeness.criticalFailed).toBe(1);
      expect(completeness.warningPassed).toBe(1);
      expect(completeness.warningFailed).toBe(0);
      expect(completeness.infoPassed).toBe(0);
      expect(completeness.infoFailed).toBe(1);
    });

    it('should handle empty results', () => {
      const results: RuleResult[] = [];
      const completeness = ruleEngine.calculateCompleteness(results);

      expect(completeness.totalRules).toBe(0);
      expect(completeness.overallScore).toBe(0);
      expect(completeness.weightedScore).toBe(0);
    });
  });

  describe('prioritizeIssues', () => {
    it('should prioritize critical required issues highest', () => {
      const results: RuleResult[] = [
        {
          rule: createMockRule('info', false),
          passed: false,
          score: 0
        },
        {
          rule: createMockRule('critical', true),
          passed: false,
          score: 0
        },
        {
          rule: createMockRule('warning', true),
          passed: false,
          score: 0
        }
      ];

      const issues = ruleEngine.prioritizeIssues(results);

      expect(issues).toHaveLength(3);
      expect(issues[0].severity).toBe('critical');
      expect(issues[0].required).toBe(true);
      expect(issues[0].priority).toBe(10);
      expect(issues[0].impact).toBe('high');
    });

    it('should sort by priority correctly', () => {
      const results: RuleResult[] = [
        {
          rule: createMockRule('info', false),
          passed: false,
          score: 0
        },
        {
          rule: createMockRule('warning', false),
          passed: false,
          score: 0
        },
        {
          rule: createMockRule('critical', false),
          passed: false,
          score: 0
        }
      ];

      const issues = ruleEngine.prioritizeIssues(results);

      expect(issues[0].severity).toBe('critical');
      expect(issues[1].severity).toBe('warning');
      expect(issues[2].severity).toBe('info');
    });

    it('should only include failed rules', () => {
      const results: RuleResult[] = [
        {
          rule: createMockRule('critical', true),
          passed: true,
          score: 100
        },
        {
          rule: createMockRule('warning', true),
          passed: false,
          score: 0
        }
      ];

      const issues = ruleEngine.prioritizeIssues(results);

      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe('warning');
    });

    it('should assign correct impact levels', () => {
      const results: RuleResult[] = [
        {
          rule: createMockRule('critical', true),
          passed: false,
          score: 0
        },
        {
          rule: createMockRule('warning', true),
          passed: false,
          score: 0
        },
        {
          rule: createMockRule('info', false),
          passed: false,
          score: 0
        }
      ];

      const issues = ruleEngine.prioritizeIssues(results);

      expect(issues[0].impact).toBe('high'); // critical + required
      expect(issues[1].impact).toBe('medium'); // warning
      expect(issues[2].impact).toBe('low'); // info + not required
    });
  });
});

// Helper function to create mock rules
function createMockRule(severity: 'critical' | 'warning' | 'info', required: boolean): ValidationRule {
  return {
    name: `Test ${severity} Rule`,
    description: `Test ${severity} rule description`,
    type: 'content_presence',
    field: `test_field_${severity}`,
    required,
    severity,
    remediationHint: `Fix ${severity} issue`
  };
}
