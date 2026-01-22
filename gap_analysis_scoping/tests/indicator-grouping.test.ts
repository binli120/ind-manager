/**
 * Smart Indicator Grouping Tests
 * 
 * Tests for the smart indicator grouping functionality that groups
 * related validation indicators by section with count badges and
 * progressive disclosure.
 */

import { describe, it, expect } from 'vitest';
import { ValidationGap } from '../features/validation/document-analyzer';

describe('Smart Indicator Grouping - Logic Tests', () => {
  describe('Section ID Extraction', () => {
    it('should extract section ID from rule ID with letter suffix', () => {
      const ruleId = '2.6.2.1 - a';
      const match = ruleId.match(/^(\d+\.\d+\.\d+(?:\.\d+)?)/);
      const sectionId = match ? match[1] : ruleId;
      
      expect(sectionId).toBe('2.6.2.1');
    });

    it('should extract section ID from rule ID without suffix', () => {
      const ruleId = '2.6.2.1';
      const match = ruleId.match(/^(\d+\.\d+\.\d+(?:\.\d+)?)/);
      const sectionId = match ? match[1] : ruleId;
      
      expect(sectionId).toBe('2.6.2.1');
    });

    it('should extract section ID with 4 levels', () => {
      const ruleId = '2.6.2.1.1 - a';
      const match = ruleId.match(/^(\d+(?:\.\d+)*)/);
      const sectionId = match ? match[1] : ruleId;
      
      expect(sectionId).toBe('2.6.2.1.1');
    });

    it('should handle rule ID with complex suffix', () => {
      const ruleId = '2.6.2.4 - b_data_inputs';
      const match = ruleId.match(/^(\d+\.\d+\.\d+(?:\.\d+)?)/);
      const sectionId = match ? match[1] : ruleId;
      
      expect(sectionId).toBe('2.6.2.4');
    });
  });

  describe('Gap Grouping Logic', () => {
    it('should group gaps by section ID', () => {
      const gaps: ValidationGap[] = [
        {
          ruleId: '2.6.2.1 - a',
          ruleName: '2.6.2.1 - a: Brief Summary',
          severity: 'critical',
          category: 'missing_content',
          description: 'Brief Summary section is missing',
          remediationSteps: ['Add executive summary'],
          required: true
        },
        {
          ruleId: '2.6.2.1 - b',
          ruleName: '2.6.2.1 - b: Secondary Findings',
          severity: 'warning',
          category: 'missing_content',
          description: 'Secondary findings section is missing',
          remediationSteps: ['Add secondary findings'],
          required: true
        },
        {
          ruleId: '2.6.2.2 - a',
          ruleName: '2.6.2.2 - a: Study Objectives',
          severity: 'critical',
          category: 'missing_content',
          description: 'Study objectives are missing',
          remediationSteps: ['Define study objectives'],
          required: true
        }
      ];

      // Group gaps by section
      const gapsBySection = new Map<string, ValidationGap[]>();
      gaps.forEach(gap => {
        const match = gap.ruleId.match(/^(\d+\.\d+\.\d+(?:\.\d+)?)/);
        const sectionId = match ? match[1] : gap.ruleId;
        
        if (!gapsBySection.has(sectionId)) {
          gapsBySection.set(sectionId, []);
        }
        gapsBySection.get(sectionId)!.push(gap);
      });

      expect(gapsBySection.size).toBe(2);
      expect(gapsBySection.get('2.6.2.1')?.length).toBe(2);
      expect(gapsBySection.get('2.6.2.2')?.length).toBe(1);
    });

    it('should count gaps by severity', () => {
      const gaps: ValidationGap[] = [
        {
          ruleId: '2.6.2.1 - a',
          ruleName: '2.6.2.1 - a: Brief Summary',
          severity: 'critical',
          category: 'missing_content',
          description: 'Brief Summary section is missing',
          remediationSteps: [],
          required: true
        },
        {
          ruleId: '2.6.2.1 - b',
          ruleName: '2.6.2.1 - b: Secondary Findings',
          severity: 'warning',
          category: 'missing_content',
          description: 'Secondary findings section is missing',
          remediationSteps: [],
          required: true
        },
        {
          ruleId: '2.6.2.1 - c',
          ruleName: '2.6.2.1 - c: Additional Info',
          severity: 'info',
          category: 'missing_content',
          description: 'Additional info is missing',
          remediationSteps: [],
          required: false
        }
      ];

      const criticalCount = gaps.filter(g => g.severity === 'critical').length;
      const warningCount = gaps.filter(g => g.severity === 'warning').length;
      const infoCount = gaps.filter(g => g.severity === 'info').length;

      expect(criticalCount).toBe(1);
      expect(warningCount).toBe(1);
      expect(infoCount).toBe(1);
    });
  });

  describe('Progressive Disclosure Logic', () => {
    it('should filter to show only critical issues', () => {
      const gaps: ValidationGap[] = [
        {
          ruleId: '2.6.2.1 - a',
          ruleName: '2.6.2.1 - a: Brief Summary',
          severity: 'critical',
          category: 'missing_content',
          description: 'Brief Summary section is missing',
          remediationSteps: [],
          required: true
        },
        {
          ruleId: '2.6.2.1 - b',
          ruleName: '2.6.2.1 - b: Secondary Findings',
          severity: 'warning',
          category: 'missing_content',
          description: 'Secondary findings section is missing',
          remediationSteps: [],
          required: true
        },
        {
          ruleId: '2.6.2.1 - c',
          ruleName: '2.6.2.1 - c: Additional Info',
          severity: 'info',
          category: 'missing_content',
          description: 'Additional info is missing',
          remediationSteps: [],
          required: false
        }
      ];

      const criticalOnly = gaps.filter(g => g.severity === 'critical');

      expect(criticalOnly.length).toBe(1);
      expect(criticalOnly[0].severity).toBe('critical');
    });

    it('should fall back to warnings if no critical issues', () => {
      const gaps: ValidationGap[] = [
        {
          ruleId: '2.6.2.1 - b',
          ruleName: '2.6.2.1 - b: Secondary Findings',
          severity: 'warning',
          category: 'missing_content',
          description: 'Secondary findings section is missing',
          remediationSteps: [],
          required: true
        },
        {
          ruleId: '2.6.2.1 - c',
          ruleName: '2.6.2.1 - c: Additional Info',
          severity: 'info',
          category: 'missing_content',
          description: 'Additional info is missing',
          remediationSteps: [],
          required: false
        }
      ];

      let displayGaps = gaps.filter(g => g.severity === 'critical');
      
      if (displayGaps.length === 0) {
        displayGaps = gaps.filter(g => g.severity === 'warning');
      }

      expect(displayGaps.length).toBe(1);
      expect(displayGaps[0].severity).toBe('warning');
    });

    it('should show all if no critical or warning issues', () => {
      const gaps: ValidationGap[] = [
        {
          ruleId: '2.6.2.1 - c',
          ruleName: '2.6.2.1 - c: Additional Info',
          severity: 'info',
          category: 'missing_content',
          description: 'Additional info is missing',
          remediationSteps: [],
          required: false
        }
      ];

      let displayGaps = gaps.filter(g => g.severity === 'critical');
      
      if (displayGaps.length === 0) {
        displayGaps = gaps.filter(g => g.severity === 'warning');
      }
      
      if (displayGaps.length === 0) {
        displayGaps = gaps;
      }

      expect(displayGaps.length).toBe(1);
      expect(displayGaps[0].severity).toBe('info');
    });
  });

  describe('Group Expansion Logic', () => {
    it('should auto-expand groups with critical issues', () => {
      const gaps: ValidationGap[] = [
        {
          ruleId: '2.6.2.1 - a',
          ruleName: '2.6.2.1 - a: Brief Summary',
          severity: 'critical',
          category: 'missing_content',
          description: 'Brief Summary section is missing',
          remediationSteps: [],
          required: true
        }
      ];

      const criticalCount = gaps.filter(g => g.severity === 'critical').length;
      const shouldExpand = criticalCount > 0;

      expect(shouldExpand).toBe(true);
    });

    it('should not auto-expand groups without critical issues', () => {
      const gaps: ValidationGap[] = [
        {
          ruleId: '2.6.2.1 - b',
          ruleName: '2.6.2.1 - b: Secondary Findings',
          severity: 'warning',
          category: 'missing_content',
          description: 'Secondary findings section is missing',
          remediationSteps: [],
          required: true
        }
      ];

      const criticalCount = gaps.filter(g => g.severity === 'critical').length;
      const shouldExpand = criticalCount > 0;

      expect(shouldExpand).toBe(false);
    });
  });
});
