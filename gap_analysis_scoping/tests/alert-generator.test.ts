/**
 * Unit Tests for AlertGenerator
 * 
 * Tests alert generation, remediation steps, and message formatting
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AlertGenerator, ValidationGap, InteractiveAlert } from '../features/validation/alert-generator';
import { PrioritizedIssue } from '../features/validation/rule-engine';
import { ValidationRule } from '../features/validation/template-parser';

describe('AlertGenerator', () => {
  let alertGenerator: AlertGenerator;

  beforeEach(() => {
    alertGenerator = new AlertGenerator();
  });

  describe('generateAlerts', () => {
    it('should generate alerts from validation gaps', () => {
      const gaps: ValidationGap[] = [
        {
          ruleId: '2.6.2.1-a',
          severity: 'critical',
          category: 'missing_content',
          description: 'Missing executive summary section',
          remediationSteps: ['Add executive summary', 'Include key findings'],
          required: true
        },
        {
          ruleId: '2.6.2.2-b',
          severity: 'warning',
          category: 'format_error',
          description: 'Format requirements not met',
          remediationSteps: ['Update format'],
          required: false
        }
      ];

      const alerts = alertGenerator.generateAlerts(gaps);

      expect(alerts).toHaveLength(2);
      expect(alerts[0].severity).toBe('critical');
      expect(alerts[0].status).toBe('open');
      expect(alerts[0].gapId).toBe('2.6.2.1-a');
      expect(alerts[0].remediationSteps).toHaveLength(2);
    });

    it('should sort alerts by priority (highest first)', () => {
      const gaps: ValidationGap[] = [
        {
          ruleId: 'info-1',
          severity: 'info',
          category: 'missing_content',
          description: 'Info gap',
          remediationSteps: [],
          required: false
        },
        {
          ruleId: 'critical-1',
          severity: 'critical',
          category: 'missing_content',
          description: 'Critical gap',
          remediationSteps: [],
          required: true
        },
        {
          ruleId: 'warning-1',
          severity: 'warning',
          category: 'format_error',
          description: 'Warning gap',
          remediationSteps: [],
          required: false
        }
      ];

      const alerts = alertGenerator.generateAlerts(gaps);

      expect(alerts[0].severity).toBe('critical');
      expect(alerts[1].severity).toBe('warning');
      expect(alerts[2].severity).toBe('info');
    });

    it('should generate unique alert IDs', () => {
      const gaps: ValidationGap[] = [
        {
          ruleId: 'test-1',
          severity: 'info',
          category: 'missing_content',
          description: 'Test gap 1',
          remediationSteps: [],
          required: false
        },
        {
          ruleId: 'test-2',
          severity: 'info',
          category: 'missing_content',
          description: 'Test gap 2',
          remediationSteps: [],
          required: false
        }
      ];

      const alerts = alertGenerator.generateAlerts(gaps);

      expect(alerts[0].id).not.toBe(alerts[1].id);
    });
  });

  describe('generateAlertsFromIssues', () => {
    it('should generate alerts from prioritized issues', () => {
      const rule: ValidationRule = {
        name: 'Test Rule',
        description: 'Test description',
        type: 'content_presence',
        field: 'test-field',
        required: true,
        severity: 'critical',
        remediationHint: 'Fix the issue'
      };

      const issues: PrioritizedIssue[] = [
        {
          rule,
          priority: 10,
          severity: 'critical',
          required: true,
          impact: 'high',
          remediationHint: 'Fix the issue'
        }
      ];

      const alerts = alertGenerator.generateAlertsFromIssues(issues);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe('critical');
      expect(alerts[0].gapId).toBe('test-field');
    });
  });

  describe('createRemediationSteps', () => {
    it('should create remediation steps for validation gap', () => {
      const gap: ValidationGap = {
        ruleId: '2.6.2.1-a',
        severity: 'critical',
        category: 'missing_content',
        description: 'Missing section',
        remediationSteps: [],
        required: true
      };

      const steps = alertGenerator.createRemediationSteps(gap);

      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0].step).toBe(1);
      expect(steps[0].action).toContain('Review');
    });

    it('should create remediation steps for prioritized issue', () => {
      const rule: ValidationRule = {
        name: 'Test Rule',
        description: 'Test description',
        type: 'content_presence',
        field: 'test-field',
        required: true,
        severity: 'critical',
        remediationHint: 'Add the missing content'
      };

      const issue: PrioritizedIssue = {
        rule,
        priority: 10,
        severity: 'critical',
        required: true,
        impact: 'high',
        remediationHint: 'Add the missing content'
      };

      const steps = alertGenerator.createRemediationSteps(issue);

      expect(steps.length).toBeGreaterThan(0);
      expect(steps.some(s => s.description.includes('Add the missing content'))).toBe(true);
    });

    it('should include re-run validation step', () => {
      const gap: ValidationGap = {
        ruleId: 'test',
        severity: 'warning',
        category: 'format_error',
        description: 'Format issue',
        remediationSteps: [],
        required: false
      };

      const steps = alertGenerator.createRemediationSteps(gap);

      expect(steps.some(s => s.action.toLowerCase().includes('validation'))).toBe(true);
    });
  });

  describe('formatAlertMessage', () => {
    it('should format alert message with HTML', () => {
      const alert: InteractiveAlert = {
        id: 'alert-1',
        gapId: 'gap-1',
        title: 'Test Alert',
        message: 'Test message',
        severity: 'warning',
        remediationSteps: ['Step 1', 'Step 2'],
        status: 'open',
        priority: 7,
        required: true
      };

      const formatted = alertGenerator.formatAlertMessage(alert);

      expect(formatted.html).toContain('alert-warning');
      expect(formatted.html).toContain('Test Alert');
      expect(formatted.html).toContain('Test message');
      expect(formatted.html).toContain('Step 1');
      expect(formatted.html).toContain('Step 2');
      expect(formatted.severity).toBe('warning');
    });

    it('should format alert message with text version', () => {
      const alert: InteractiveAlert = {
        id: 'alert-1',
        gapId: 'gap-1',
        title: 'Test Alert',
        message: 'Test message',
        severity: 'critical',
        remediationSteps: ['Step 1'],
        status: 'open',
        priority: 10,
        required: true
      };

      const formatted = alertGenerator.formatAlertMessage(alert);

      expect(formatted.text).toContain('CRITICAL');
      expect(formatted.text).toContain('Test Alert');
      expect(formatted.text).toContain('Test message');
      expect(formatted.text).toContain('1. Step 1');
    });

    it('should include action buttons in HTML', () => {
      const alert: InteractiveAlert = {
        id: 'alert-1',
        gapId: 'gap-1',
        title: 'Test Alert',
        message: 'Test message',
        severity: 'info',
        remediationSteps: [],
        status: 'open',
        priority: 5,
        required: false
      };

      const formatted = alertGenerator.formatAlertMessage(alert);

      expect(formatted.html).toContain('btn-acknowledge');
      expect(formatted.html).toContain('btn-resolve');
      expect(formatted.html).toContain('btn-dismiss');
    });

    it('should escape HTML in alert content', () => {
      const alert: InteractiveAlert = {
        id: 'alert-1',
        gapId: 'gap-1',
        title: '<script>alert("xss")</script>',
        message: '<b>Bold</b> text',
        severity: 'info',
        remediationSteps: ['<a href="#">Link</a>'],
        status: 'open',
        priority: 5,
        required: false
      };

      const formatted = alertGenerator.formatAlertMessage(alert);

      expect(formatted.html).not.toContain('<script>');
      expect(formatted.html).toContain('&lt;script&gt;');
    });
  });

  describe('alert priority calculation', () => {
    it('should assign higher priority to critical alerts', () => {
      const criticalGap: ValidationGap = {
        ruleId: 'critical',
        severity: 'critical',
        category: 'missing_content',
        description: 'Critical issue',
        remediationSteps: [],
        required: true
      };

      const warningGap: ValidationGap = {
        ruleId: 'warning',
        severity: 'warning',
        category: 'missing_content',
        description: 'Warning issue',
        remediationSteps: [],
        required: false
      };

      const criticalAlerts = alertGenerator.generateAlerts([criticalGap]);
      const warningAlerts = alertGenerator.generateAlerts([warningGap]);

      expect(criticalAlerts[0].priority).toBeGreaterThan(warningAlerts[0].priority);
    });

    it('should assign higher priority to required alerts', () => {
      const requiredGap: ValidationGap = {
        ruleId: 'required',
        severity: 'warning',
        category: 'missing_content',
        description: 'Required issue',
        remediationSteps: [],
        required: true
      };

      const optionalGap: ValidationGap = {
        ruleId: 'optional',
        severity: 'warning',
        category: 'missing_content',
        description: 'Optional issue',
        remediationSteps: [],
        required: false
      };

      const requiredAlerts = alertGenerator.generateAlerts([requiredGap]);
      const optionalAlerts = alertGenerator.generateAlerts([optionalGap]);

      expect(requiredAlerts[0].priority).toBeGreaterThan(optionalAlerts[0].priority);
    });
  });
});
