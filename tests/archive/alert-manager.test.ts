/**
 * Unit Tests for AlertManager
 * 
 * Tests alert lifecycle management, interaction tracking, and state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AlertManager } from '../features/validation/alert-manager';
import { InteractiveAlert } from '../features/validation/alert-generator';

describe('AlertManager', () => {
  let alertManager: AlertManager;

  beforeEach(() => {
    alertManager = new AlertManager();
  });

  describe('addAlerts', () => {
    it('should add alerts to the manager', () => {
      const alerts: InteractiveAlert[] = [
        {
          id: 'alert-1',
          gapId: 'gap-1',
          title: 'Test Alert 1',
          message: 'Message 1',
          severity: 'critical',
          remediationSteps: [],
          status: 'open',
          priority: 10,
          required: true
        }
      ];

      alertManager.addAlerts(alerts);

      expect(alertManager.getAllAlerts()).toHaveLength(1);
      expect(alertManager.getAlert('alert-1')).toBeDefined();
    });

    it('should record view interaction when adding alerts', () => {
      const alerts: InteractiveAlert[] = [
        {
          id: 'alert-1',
          gapId: 'gap-1',
          title: 'Test Alert',
          message: 'Message',
          severity: 'info',
          remediationSteps: [],
          status: 'open',
          priority: 5,
          required: false
        }
      ];

      alertManager.addAlerts(alerts);

      const interactions = alertManager.getAlertInteractions('alert-1');
      expect(interactions).toHaveLength(1);
      expect(interactions[0].action).toBe('view');
    });
  });

  describe('getAlert', () => {
    it('should retrieve alert by ID', () => {
      const alert: InteractiveAlert = {
        id: 'alert-1',
        gapId: 'gap-1',
        title: 'Test Alert',
        message: 'Message',
        severity: 'warning',
        remediationSteps: [],
        status: 'open',
        priority: 7,
        required: true
      };

      alertManager.addAlerts([alert]);

      const retrieved = alertManager.getAlert('alert-1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe('Test Alert');
    });

    it('should return undefined for non-existent alert', () => {
      const retrieved = alertManager.getAlert('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getAlertsByStatus', () => {
    it('should filter alerts by status', () => {
      const alerts: InteractiveAlert[] = [
        {
          id: 'alert-1',
          gapId: 'gap-1',
          title: 'Open Alert',
          message: 'Message',
          severity: 'info',
          remediationSteps: [],
          status: 'open',
          priority: 5,
          required: false
        },
        {
          id: 'alert-2',
          gapId: 'gap-2',
          title: 'Resolved Alert',
          message: 'Message',
          severity: 'info',
          remediationSteps: [],
          status: 'resolved',
          priority: 5,
          required: false
        }
      ];

      alertManager.addAlerts(alerts);

      const openAlerts = alertManager.getAlertsByStatus('open');
      const resolvedAlerts = alertManager.getAlertsByStatus('resolved');

      expect(openAlerts).toHaveLength(1);
      expect(resolvedAlerts).toHaveLength(1);
      expect(openAlerts[0].id).toBe('alert-1');
      expect(resolvedAlerts[0].id).toBe('alert-2');
    });
  });

  describe('getAlertsBySeverity', () => {
    it('should filter alerts by severity', () => {
      const alerts: InteractiveAlert[] = [
        {
          id: 'alert-1',
          gapId: 'gap-1',
          title: 'Critical Alert',
          message: 'Message',
          severity: 'critical',
          remediationSteps: [],
          status: 'open',
          priority: 10,
          required: true
        },
        {
          id: 'alert-2',
          gapId: 'gap-2',
          title: 'Warning Alert',
          message: 'Message',
          severity: 'warning',
          remediationSteps: [],
          status: 'open',
          priority: 7,
          required: false
        }
      ];

      alertManager.addAlerts(alerts);

      const criticalAlerts = alertManager.getAlertsBySeverity('critical');
      const warningAlerts = alertManager.getAlertsBySeverity('warning');

      expect(criticalAlerts).toHaveLength(1);
      expect(warningAlerts).toHaveLength(1);
      expect(criticalAlerts[0].id).toBe('alert-1');
      expect(warningAlerts[0].id).toBe('alert-2');
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge an alert', () => {
      const alert: InteractiveAlert = {
        id: 'alert-1',
        gapId: 'gap-1',
        title: 'Test Alert',
        message: 'Message',
        severity: 'warning',
        remediationSteps: [],
        status: 'open',
        priority: 7,
        required: true
      };

      alertManager.addAlerts([alert]);
      const result = alertManager.acknowledgeAlert('alert-1');

      expect(result).toBe(true);
      
      const updated = alertManager.getAlert('alert-1');
      expect(updated?.status).toBe('acknowledged');
      expect(updated?.acknowledgedAt).toBeDefined();
    });

    it('should record acknowledge interaction', () => {
      const alert: InteractiveAlert = {
        id: 'alert-1',
        gapId: 'gap-1',
        title: 'Test Alert',
        message: 'Message',
        severity: 'info',
        remediationSteps: [],
        status: 'open',
        priority: 5,
        required: false
      };

      alertManager.addAlerts([alert]);
      alertManager.acknowledgeAlert('alert-1', 'user-123', 'Acknowledged by user');

      const interactions = alertManager.getAlertInteractions('alert-1');
      const acknowledgeInteraction = interactions.find(i => i.action === 'acknowledge');

      expect(acknowledgeInteraction).toBeDefined();
      expect(acknowledgeInteraction?.userId).toBe('user-123');
      expect(acknowledgeInteraction?.notes).toBe('Acknowledged by user');
    });

    it('should return false for non-existent alert', () => {
      const result = alertManager.acknowledgeAlert('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('resolveAlert', () => {
    it('should resolve an alert', () => {
      const alert: InteractiveAlert = {
        id: 'alert-1',
        gapId: 'gap-1',
        title: 'Test Alert',
        message: 'Message',
        severity: 'critical',
        remediationSteps: [],
        status: 'open',
        priority: 10,
        required: true
      };

      alertManager.addAlerts([alert]);
      const result = alertManager.resolveAlert('alert-1');

      expect(result).toBe(true);
      
      const updated = alertManager.getAlert('alert-1');
      expect(updated?.status).toBe('resolved');
      expect(updated?.resolvedAt).toBeDefined();
    });

    it('should record resolve interaction', () => {
      const alert: InteractiveAlert = {
        id: 'alert-1',
        gapId: 'gap-1',
        title: 'Test Alert',
        message: 'Message',
        severity: 'warning',
        remediationSteps: [],
        status: 'open',
        priority: 7,
        required: false
      };

      alertManager.addAlerts([alert]);
      alertManager.resolveAlert('alert-1', 'user-456', 'Fixed the issue');

      const interactions = alertManager.getAlertInteractions('alert-1');
      const resolveInteraction = interactions.find(i => i.action === 'resolve');

      expect(resolveInteraction).toBeDefined();
      expect(resolveInteraction?.userId).toBe('user-456');
      expect(resolveInteraction?.notes).toBe('Fixed the issue');
    });
  });

  describe('reopenAlert', () => {
    it('should reopen a resolved alert', () => {
      const alert: InteractiveAlert = {
        id: 'alert-1',
        gapId: 'gap-1',
        title: 'Test Alert',
        message: 'Message',
        severity: 'warning',
        remediationSteps: [],
        status: 'resolved',
        priority: 7,
        required: true,
        resolvedAt: new Date()
      };

      alertManager.addAlerts([alert]);
      const result = alertManager.reopenAlert('alert-1');

      expect(result).toBe(true);
      
      const updated = alertManager.getAlert('alert-1');
      expect(updated?.status).toBe('open');
      expect(updated?.resolvedAt).toBeUndefined();
      expect(updated?.acknowledgedAt).toBeUndefined();
    });

    it('should record reopen interaction', () => {
      const alert: InteractiveAlert = {
        id: 'alert-1',
        gapId: 'gap-1',
        title: 'Test Alert',
        message: 'Message',
        severity: 'info',
        remediationSteps: [],
        status: 'resolved',
        priority: 5,
        required: false
      };

      alertManager.addAlerts([alert]);
      alertManager.reopenAlert('alert-1', 'user-789', 'Issue not fully resolved');

      const interactions = alertManager.getAlertInteractions('alert-1');
      const reopenInteraction = interactions.find(i => i.action === 'reopen');

      expect(reopenInteraction).toBeDefined();
      expect(reopenInteraction?.notes).toBe('Issue not fully resolved');
    });
  });

  describe('dismissAlert', () => {
    it('should dismiss an alert', () => {
      const alert: InteractiveAlert = {
        id: 'alert-1',
        gapId: 'gap-1',
        title: 'Test Alert',
        message: 'Message',
        severity: 'info',
        remediationSteps: [],
        status: 'open',
        priority: 5,
        required: false
      };

      alertManager.addAlerts([alert]);
      const result = alertManager.dismissAlert('alert-1');

      expect(result).toBe(true);
      expect(alertManager.getAlert('alert-1')).toBeUndefined();
    });

    it('should record dismiss interaction', () => {
      const alert: InteractiveAlert = {
        id: 'alert-1',
        gapId: 'gap-1',
        title: 'Test Alert',
        message: 'Message',
        severity: 'info',
        remediationSteps: [],
        status: 'open',
        priority: 5,
        required: false
      };

      alertManager.addAlerts([alert]);
      alertManager.dismissAlert('alert-1', 'user-999', 'Not relevant');

      const interactions = alertManager.getAlertInteractions('alert-1');
      const dismissInteraction = interactions.find(i => i.action === 'dismiss');

      expect(dismissInteraction).toBeDefined();
      expect(dismissInteraction?.notes).toBe('Not relevant');
    });
  });

  describe('getStatistics', () => {
    it('should calculate alert statistics', () => {
      const alerts: InteractiveAlert[] = [
        {
          id: 'alert-1',
          gapId: 'gap-1',
          title: 'Critical Open',
          message: 'Message',
          severity: 'critical',
          remediationSteps: [],
          status: 'open',
          priority: 10,
          required: true
        },
        {
          id: 'alert-2',
          gapId: 'gap-2',
          title: 'Warning Acknowledged',
          message: 'Message',
          severity: 'warning',
          remediationSteps: [],
          status: 'acknowledged',
          priority: 7,
          required: true
        },
        {
          id: 'alert-3',
          gapId: 'gap-3',
          title: 'Info Resolved',
          message: 'Message',
          severity: 'info',
          remediationSteps: [],
          status: 'resolved',
          priority: 5,
          required: false
        }
      ];

      alertManager.addAlerts(alerts);
      const stats = alertManager.getStatistics();

      expect(stats.total).toBe(3);
      expect(stats.byStatus.open).toBe(1);
      expect(stats.byStatus.acknowledged).toBe(1);
      expect(stats.byStatus.resolved).toBe(1);
      expect(stats.bySeverity.critical).toBe(1);
      expect(stats.bySeverity.warning).toBe(1);
      expect(stats.bySeverity.info).toBe(1);
      expect(stats.byRequired.required).toBe(2);
      expect(stats.byRequired.optional).toBe(1);
    });
  });

  describe('exportState and importState', () => {
    it('should export and import alert state', () => {
      const alerts: InteractiveAlert[] = [
        {
          id: 'alert-1',
          gapId: 'gap-1',
          title: 'Test Alert',
          message: 'Message',
          severity: 'warning',
          remediationSteps: [],
          status: 'open',
          priority: 7,
          required: true
        }
      ];

      alertManager.addAlerts(alerts);
      alertManager.acknowledgeAlert('alert-1');

      const state = alertManager.exportState();

      // Create new manager and import state
      const newManager = new AlertManager();
      newManager.importState(state);

      expect(newManager.getAllAlerts()).toHaveLength(1);
      expect(newManager.getAlert('alert-1')?.status).toBe('acknowledged');
      expect(newManager.getAllInteractions().length).toBeGreaterThan(0);
    });
  });

  describe('clearAllAlerts', () => {
    it('should clear all alerts', () => {
      const alerts: InteractiveAlert[] = [
        {
          id: 'alert-1',
          gapId: 'gap-1',
          title: 'Test Alert 1',
          message: 'Message',
          severity: 'info',
          remediationSteps: [],
          status: 'open',
          priority: 5,
          required: false
        },
        {
          id: 'alert-2',
          gapId: 'gap-2',
          title: 'Test Alert 2',
          message: 'Message',
          severity: 'warning',
          remediationSteps: [],
          status: 'open',
          priority: 7,
          required: true
        }
      ];

      alertManager.addAlerts(alerts);
      expect(alertManager.getAllAlerts()).toHaveLength(2);

      alertManager.clearAllAlerts();
      expect(alertManager.getAllAlerts()).toHaveLength(0);
    });
  });
});
