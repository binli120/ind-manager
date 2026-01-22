/**
 * Unit Tests for AcknowledgmentManager
 * 
 * Tests acknowledgment and dismissal functionality for validation indicators.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AcknowledgmentManager } from '../features/validation/acknowledgment-manager';
import { ValidationGap } from '../features/validation/document-analyzer';

describe('AcknowledgmentManager', () => {
  let manager: AcknowledgmentManager;
  let mockGap: ValidationGap;

  beforeEach(() => {
    manager = new AcknowledgmentManager();
    
    mockGap = {
      ruleId: '2.6.2.1-a',
      ruleName: '2.6.2.1 - a: Brief Summary',
      severity: 'critical',
      category: 'missing_content',
      description: 'Brief Summary section is required',
      remediationSteps: [
        'Add executive summary',
        'Include key findings',
        'Summarize safety conclusions'
      ],
      required: true
    };
  });

  describe('acknowledgeIndicator', () => {
    it('should record acknowledgment with reason', () => {
      const reason = 'Content will be added in next revision';
      
      manager.acknowledgeIndicator(mockGap.ruleId, reason);
      
      const record = manager.getAcknowledgment(mockGap.ruleId);
      expect(record).toBeDefined();
      expect(record?.status).toBe('acknowledged');
      expect(record?.reason).toBe(reason);
      expect(record?.gapId).toBe(mockGap.ruleId);
      expect(record?.timestamp).toBeInstanceOf(Date);
    });

    it('should trigger status change callback', () => {
      const callback = vi.fn();
      manager.setStatusChangeCallback(callback);
      
      const reason = 'Test reason';
      manager.acknowledgeIndicator(mockGap.ruleId, reason);
      
      expect(callback).toHaveBeenCalledWith(mockGap.ruleId, 'acknowledged', reason);
    });

    it('should store user ID if provided', () => {
      const userId = 'user123';
      const reason = 'Test reason';
      
      manager.acknowledgeIndicator(mockGap.ruleId, reason, userId);
      
      const record = manager.getAcknowledgment(mockGap.ruleId);
      expect(record?.userId).toBe(userId);
    });
  });

  describe('dismissIndicator', () => {
    it('should record dismissal with reason', () => {
      const reason = 'Not applicable for this submission';
      
      manager.dismissIndicator(mockGap.ruleId, reason);
      
      const record = manager.getAcknowledgment(mockGap.ruleId);
      expect(record).toBeDefined();
      expect(record?.status).toBe('dismissed');
      expect(record?.reason).toBe(reason);
    });

    it('should use default reason if not provided', () => {
      manager.dismissIndicator(mockGap.ruleId);
      
      const record = manager.getAcknowledgment(mockGap.ruleId);
      expect(record?.reason).toBe('User dismissed');
    });

    it('should trigger status change callback', () => {
      const callback = vi.fn();
      manager.setStatusChangeCallback(callback);
      
      const reason = 'Test dismissal';
      manager.dismissIndicator(mockGap.ruleId, reason);
      
      expect(callback).toHaveBeenCalledWith(mockGap.ruleId, 'dismissed', reason);
    });
  });

  describe('isAcknowledged', () => {
    it('should return true for acknowledged items', () => {
      manager.acknowledgeIndicator(mockGap.ruleId, 'Test');
      
      expect(manager.isAcknowledged(mockGap.ruleId)).toBe(true);
    });

    it('should return false for non-acknowledged items', () => {
      expect(manager.isAcknowledged(mockGap.ruleId)).toBe(false);
    });

    it('should return false for dismissed items', () => {
      manager.dismissIndicator(mockGap.ruleId, 'Test');
      
      expect(manager.isAcknowledged(mockGap.ruleId)).toBe(false);
    });
  });

  describe('isDismissed', () => {
    it('should return true for dismissed items', () => {
      manager.dismissIndicator(mockGap.ruleId, 'Test');
      
      expect(manager.isDismissed(mockGap.ruleId)).toBe(true);
    });

    it('should return false for non-dismissed items', () => {
      expect(manager.isDismissed(mockGap.ruleId)).toBe(false);
    });

    it('should return false for acknowledged items', () => {
      manager.acknowledgeIndicator(mockGap.ruleId, 'Test');
      
      expect(manager.isDismissed(mockGap.ruleId)).toBe(false);
    });
  });

  describe('getDismissedItems', () => {
    it('should return only dismissed items', () => {
      const gaps: ValidationGap[] = [
        mockGap,
        { ...mockGap, ruleId: '2.6.2.1-b' },
        { ...mockGap, ruleId: '2.6.2.2-a' }
      ];

      manager.dismissIndicator('2.6.2.1-a', 'Test 1');
      manager.acknowledgeIndicator('2.6.2.1-b', 'Test 2');
      manager.dismissIndicator('2.6.2.2-a', 'Test 3');

      const dismissed = manager.getDismissedItems(gaps);
      
      expect(dismissed).toHaveLength(2);
      expect(dismissed[0].gap.ruleId).toBe('2.6.2.1-a');
      expect(dismissed[1].gap.ruleId).toBe('2.6.2.2-a');
    });

    it('should return empty array if no dismissed items', () => {
      const gaps: ValidationGap[] = [mockGap];
      
      const dismissed = manager.getDismissedItems(gaps);
      
      expect(dismissed).toHaveLength(0);
    });
  });

  describe('getAcknowledgedItems', () => {
    it('should return only acknowledged items', () => {
      const gaps: ValidationGap[] = [
        mockGap,
        { ...mockGap, ruleId: '2.6.2.1-b' },
        { ...mockGap, ruleId: '2.6.2.2-a' }
      ];

      manager.acknowledgeIndicator('2.6.2.1-a', 'Test 1');
      manager.dismissIndicator('2.6.2.1-b', 'Test 2');
      manager.acknowledgeIndicator('2.6.2.2-a', 'Test 3');

      const acknowledged = manager.getAcknowledgedItems(gaps);
      
      expect(acknowledged).toHaveLength(2);
      expect(acknowledged[0].gap.ruleId).toBe('2.6.2.1-a');
      expect(acknowledged[1].gap.ruleId).toBe('2.6.2.2-a');
    });

    it('should return empty array if no acknowledged items', () => {
      const gaps: ValidationGap[] = [mockGap];
      
      const acknowledged = manager.getAcknowledgedItems(gaps);
      
      expect(acknowledged).toHaveLength(0);
    });
  });

  describe('restoreItem', () => {
    it('should remove acknowledgment record', () => {
      manager.acknowledgeIndicator(mockGap.ruleId, 'Test');
      
      expect(manager.isAcknowledged(mockGap.ruleId)).toBe(true);
      
      manager.restoreItem(mockGap.ruleId);
      
      expect(manager.isAcknowledged(mockGap.ruleId)).toBe(false);
      expect(manager.getAcknowledgment(mockGap.ruleId)).toBeUndefined();
    });

    it('should trigger status change callback', () => {
      const callback = vi.fn();
      manager.setStatusChangeCallback(callback);
      
      manager.acknowledgeIndicator(mockGap.ruleId, 'Test');
      callback.mockClear();
      
      manager.restoreItem(mockGap.ruleId);
      
      expect(callback).toHaveBeenCalledWith(mockGap.ruleId, 'dismissed', 'Restored');
    });
  });

  describe('clearAll', () => {
    it('should remove all acknowledgments', () => {
      manager.acknowledgeIndicator('2.6.2.1-a', 'Test 1');
      manager.dismissIndicator('2.6.2.1-b', 'Test 2');
      manager.acknowledgeIndicator('2.6.2.2-a', 'Test 3');
      
      expect(manager.getAcknowledgment('2.6.2.1-a')).toBeDefined();
      expect(manager.getAcknowledgment('2.6.2.1-b')).toBeDefined();
      expect(manager.getAcknowledgment('2.6.2.2-a')).toBeDefined();
      
      manager.clearAll();
      
      expect(manager.getAcknowledgment('2.6.2.1-a')).toBeUndefined();
      expect(manager.getAcknowledgment('2.6.2.1-b')).toBeUndefined();
      expect(manager.getAcknowledgment('2.6.2.2-a')).toBeUndefined();
    });
  });

  describe('exportAcknowledgments', () => {
    it('should export acknowledgments as JSON', () => {
      manager.acknowledgeIndicator('2.6.2.1-a', 'Test 1', 'user1');
      manager.dismissIndicator('2.6.2.1-b', 'Test 2', 'user2');
      
      const json = manager.exportAcknowledgments();
      const data = JSON.parse(json);
      
      expect(data).toHaveLength(2);
      expect(data[0].gapId).toBe('2.6.2.1-a');
      expect(data[0].status).toBe('acknowledged');
      expect(data[0].reason).toBe('Test 1');
      expect(data[0].userId).toBe('user1');
      expect(data[1].gapId).toBe('2.6.2.1-b');
      expect(data[1].status).toBe('dismissed');
    });

    it('should include ISO timestamp', () => {
      manager.acknowledgeIndicator(mockGap.ruleId, 'Test');
      
      const json = manager.exportAcknowledgments();
      const data = JSON.parse(json);
      
      expect(data[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('importAcknowledgments', () => {
    it('should import acknowledgments from JSON', () => {
      const json = JSON.stringify([
        {
          gapId: '2.6.2.1-a',
          status: 'acknowledged',
          reason: 'Test 1',
          timestamp: new Date().toISOString(),
          userId: 'user1'
        },
        {
          gapId: '2.6.2.1-b',
          status: 'dismissed',
          reason: 'Test 2',
          timestamp: new Date().toISOString(),
          userId: 'user2'
        }
      ]);
      
      manager.importAcknowledgments(json);
      
      expect(manager.isAcknowledged('2.6.2.1-a')).toBe(true);
      expect(manager.isDismissed('2.6.2.1-b')).toBe(true);
      
      const record1 = manager.getAcknowledgment('2.6.2.1-a');
      expect(record1?.reason).toBe('Test 1');
      expect(record1?.userId).toBe('user1');
    });

    it('should handle invalid JSON gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      manager.importAcknowledgments('invalid json');
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('status tracking', () => {
    it('should track multiple status changes for same gap', () => {
      // First acknowledge
      manager.acknowledgeIndicator(mockGap.ruleId, 'First reason');
      expect(manager.isAcknowledged(mockGap.ruleId)).toBe(true);
      
      // Then dismiss
      manager.dismissIndicator(mockGap.ruleId, 'Second reason');
      expect(manager.isAcknowledged(mockGap.ruleId)).toBe(false);
      expect(manager.isDismissed(mockGap.ruleId)).toBe(true);
      
      // Check latest reason
      const record = manager.getAcknowledgment(mockGap.ruleId);
      expect(record?.reason).toBe('Second reason');
    });

    it('should maintain separate records for different gaps', () => {
      manager.acknowledgeIndicator('2.6.2.1-a', 'Reason A');
      manager.dismissIndicator('2.6.2.1-b', 'Reason B');
      
      expect(manager.isAcknowledged('2.6.2.1-a')).toBe(true);
      expect(manager.isDismissed('2.6.2.1-a')).toBe(false);
      
      expect(manager.isAcknowledged('2.6.2.1-b')).toBe(false);
      expect(manager.isDismissed('2.6.2.1-b')).toBe(true);
    });
  });
});
