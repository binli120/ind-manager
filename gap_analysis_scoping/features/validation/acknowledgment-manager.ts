/**
 * Acknowledgment Manager
 * 
 * Manages acknowledgment and dismissal of validation indicators.
 * Tracks status changes and provides a review panel for dismissed items.
 */

import { ValidationGap } from './document-analyzer';

export interface AcknowledgmentRecord {
  gapId: string;
  status: 'acknowledged' | 'dismissed';
  reason: string;
  timestamp: Date;
  userId?: string;
}

export interface DismissedItem {
  gap: ValidationGap;
  record: AcknowledgmentRecord;
}

/**
 * AcknowledgmentManager class for managing validation indicator acknowledgments
 */
export class AcknowledgmentManager {
  private acknowledgments: Map<string, AcknowledgmentRecord>;
  private dismissedPanel: HTMLElement | null;
  private onStatusChange?: (gapId: string, status: 'acknowledged' | 'dismissed', reason: string) => void;

  constructor() {
    this.acknowledgments = new Map();
    this.dismissedPanel = null;
  }

  /**
   * Set status change callback
   * 
   * @param callback - Function to call when status changes
   */
  setStatusChangeCallback(callback: (gapId: string, status: 'acknowledged' | 'dismissed', reason: string) => void): void {
    this.onStatusChange = callback;
  }

  /**
   * Acknowledge an indicator with reason
   * 
   * @param gapId - Gap identifier
   * @param reason - Reason for acknowledgment
   * @param userId - Optional user identifier
   */
  acknowledgeIndicator(gapId: string, reason: string, userId?: string): void {
    const record: AcknowledgmentRecord = {
      gapId,
      status: 'acknowledged',
      reason,
      timestamp: new Date(),
      userId
    };

    this.acknowledgments.set(gapId, record);

    // Trigger callback
    if (this.onStatusChange) {
      this.onStatusChange(gapId, 'acknowledged', reason);
    }

    // Update dismissed panel if open
    this.updateDismissedPanel();
  }

  /**
   * Dismiss an indicator with optional reason
   * 
   * @param gapId - Gap identifier
   * @param reason - Optional reason for dismissal
   * @param userId - Optional user identifier
   */
  dismissIndicator(gapId: string, reason: string = 'User dismissed', userId?: string): void {
    const record: AcknowledgmentRecord = {
      gapId,
      status: 'dismissed',
      reason,
      timestamp: new Date(),
      userId
    };

    this.acknowledgments.set(gapId, record);

    // Trigger callback
    if (this.onStatusChange) {
      this.onStatusChange(gapId, 'dismissed', reason);
    }

    // Update dismissed panel if open
    this.updateDismissedPanel();
  }

  /**
   * Show acknowledgment dialog
   * 
   * @param gapId - Gap identifier
   * @param gap - Validation gap data
   * @returns Promise that resolves when dialog is closed
   */
  showAcknowledgmentDialog(gapId: string, gap: ValidationGap): Promise<{ acknowledged: boolean; reason: string }> {
    return new Promise((resolve) => {
      // Create dialog overlay
      const overlay = document.createElement('div');
      overlay.className = 'acknowledgment-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;

      // Create dialog
      const dialog = document.createElement('div');
      dialog.className = 'acknowledgment-dialog';
      dialog.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      `;

      // Dialog content
      dialog.innerHTML = `
        <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">
          Acknowledge Validation Issue
        </h3>
        <div style="margin-bottom: 16px;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">
            <strong>${gap.ruleName}</strong>
          </p>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            ${gap.description}
          </p>
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #374151;">
            Reason for acknowledgment:
          </label>
          <textarea 
            id="acknowledgment-reason" 
            rows="3" 
            placeholder="Explain why this issue is being acknowledged..."
            style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; font-family: inherit; resize: vertical;"
          ></textarea>
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button id="btn-cancel" style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 4px; background: white; color: #374151; font-size: 14px; font-weight: 500; cursor: pointer;">
            Cancel
          </button>
          <button id="btn-acknowledge" style="padding: 8px 16px; border: none; border-radius: 4px; background: #3b82f6; color: white; font-size: 14px; font-weight: 500; cursor: pointer;">
            Acknowledge
          </button>
        </div>
      `;

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      // Get elements
      const reasonTextarea = dialog.querySelector('#acknowledgment-reason') as HTMLTextAreaElement;
      const btnCancel = dialog.querySelector('#btn-cancel') as HTMLButtonElement;
      const btnAcknowledge = dialog.querySelector('#btn-acknowledge') as HTMLButtonElement;

      // Focus on textarea
      reasonTextarea.focus();

      // Handle cancel
      const handleCancel = () => {
        overlay.remove();
        resolve({ acknowledged: false, reason: '' });
      };

      // Handle acknowledge
      const handleAcknowledge = () => {
        const reason = reasonTextarea.value.trim();
        
        if (!reason) {
          reasonTextarea.style.borderColor = '#ef4444';
          reasonTextarea.placeholder = 'Please provide a reason';
          return;
        }

        this.acknowledgeIndicator(gapId, reason);
        overlay.remove();
        resolve({ acknowledged: true, reason });
      };

      // Event listeners
      btnCancel.addEventListener('click', handleCancel);
      btnAcknowledge.addEventListener('click', handleAcknowledge);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          handleCancel();
        }
      });

      // ESC key to cancel
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleCancel();
          document.removeEventListener('keydown', handleEsc);
        }
      };
      document.addEventListener('keydown', handleEsc);
    });
  }

  /**
   * Show dismissal confirmation
   * 
   * @param gapId - Gap identifier
   * @param gap - Validation gap data
   * @returns Promise that resolves when dialog is closed
   */
  showDismissalDialog(gapId: string, gap: ValidationGap): Promise<{ dismissed: boolean; reason: string }> {
    return new Promise((resolve) => {
      // Create dialog overlay
      const overlay = document.createElement('div');
      overlay.className = 'dismissal-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;

      // Create dialog
      const dialog = document.createElement('div');
      dialog.className = 'dismissal-dialog';
      dialog.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      `;

      // Dialog content
      dialog.innerHTML = `
        <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">
          Dismiss Validation Issue
        </h3>
        <div style="margin-bottom: 16px;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">
            <strong>${gap.ruleName}</strong>
          </p>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            ${gap.description}
          </p>
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #374151;">
            Reason for dismissal (optional):
          </label>
          <textarea 
            id="dismissal-reason" 
            rows="3" 
            placeholder="Optionally explain why this issue is not applicable..."
            style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; font-family: inherit; resize: vertical;"
          ></textarea>
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button id="btn-cancel" style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 4px; background: white; color: #374151; font-size: 14px; font-weight: 500; cursor: pointer;">
            Cancel
          </button>
          <button id="btn-dismiss" style="padding: 8px 16px; border: none; border-radius: 4px; background: #6b7280; color: white; font-size: 14px; font-weight: 500; cursor: pointer;">
            Dismiss
          </button>
        </div>
      `;

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      // Get elements
      const reasonTextarea = dialog.querySelector('#dismissal-reason') as HTMLTextAreaElement;
      const btnCancel = dialog.querySelector('#btn-cancel') as HTMLButtonElement;
      const btnDismiss = dialog.querySelector('#btn-dismiss') as HTMLButtonElement;

      // Handle cancel
      const handleCancel = () => {
        overlay.remove();
        resolve({ dismissed: false, reason: '' });
      };

      // Handle dismiss
      const handleDismiss = () => {
        const reason = reasonTextarea.value.trim() || 'User dismissed';
        
        this.dismissIndicator(gapId, reason);
        overlay.remove();
        resolve({ dismissed: true, reason });
      };

      // Event listeners
      btnCancel.addEventListener('click', handleCancel);
      btnDismiss.addEventListener('click', handleDismiss);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          handleCancel();
        }
      });

      // ESC key to cancel
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleCancel();
          document.removeEventListener('keydown', handleEsc);
        }
      };
      document.addEventListener('keydown', handleEsc);
    });
  }

  /**
   * Get acknowledgment record for a gap
   * 
   * @param gapId - Gap identifier
   * @returns Acknowledgment record or undefined
   */
  getAcknowledgment(gapId: string): AcknowledgmentRecord | undefined {
    return this.acknowledgments.get(gapId);
  }

  /**
   * Check if a gap is acknowledged
   * 
   * @param gapId - Gap identifier
   * @returns True if acknowledged
   */
  isAcknowledged(gapId: string): boolean {
    const record = this.acknowledgments.get(gapId);
    return record?.status === 'acknowledged';
  }

  /**
   * Check if a gap is dismissed
   * 
   * @param gapId - Gap identifier
   * @returns True if dismissed
   */
  isDismissed(gapId: string): boolean {
    const record = this.acknowledgments.get(gapId);
    return record?.status === 'dismissed';
  }

  /**
   * Get all dismissed items
   * 
   * @param gaps - All validation gaps
   * @returns Array of dismissed items
   */
  getDismissedItems(gaps: ValidationGap[]): DismissedItem[] {
    const dismissed: DismissedItem[] = [];

    gaps.forEach(gap => {
      const record = this.acknowledgments.get(gap.ruleId);
      if (record && record.status === 'dismissed') {
        dismissed.push({ gap, record });
      }
    });

    return dismissed;
  }

  /**
   * Get all acknowledged items
   * 
   * @param gaps - All validation gaps
   * @returns Array of acknowledged items
   */
  getAcknowledgedItems(gaps: ValidationGap[]): DismissedItem[] {
    const acknowledged: DismissedItem[] = [];

    gaps.forEach(gap => {
      const record = this.acknowledgments.get(gap.ruleId);
      if (record && record.status === 'acknowledged') {
        acknowledged.push({ gap, record });
      }
    });

    return acknowledged;
  }

  /**
   * Restore a dismissed or acknowledged item
   * 
   * @param gapId - Gap identifier
   */
  restoreItem(gapId: string): void {
    this.acknowledgments.delete(gapId);

    // Trigger callback with 'fixed' status to restore
    if (this.onStatusChange) {
      this.onStatusChange(gapId, 'dismissed', 'Restored');
    }

    // Update dismissed panel if open
    this.updateDismissedPanel();
  }

  /**
   * Create and show dismissed items panel
   * 
   * @param gaps - All validation gaps
   * @param container - Container element to append panel to
   */
  showDismissedPanel(gaps: ValidationGap[], container: HTMLElement): void {
    // Remove existing panel if any
    if (this.dismissedPanel) {
      this.dismissedPanel.remove();
    }

    // Create panel
    this.dismissedPanel = this.createDismissedPanel(gaps);
    container.appendChild(this.dismissedPanel);
  }

  /**
   * Create dismissed items panel element
   * 
   * @param gaps - All validation gaps
   * @returns HTMLElement panel
   */
  private createDismissedPanel(gaps: ValidationGap[]): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'dismissed-panel';
    panel.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: 400px;
      max-height: 70vh;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      z-index: 1000;
    `;

    // Panel header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;

    const title = document.createElement('h3');
    title.style.cssText = `
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    `;
    title.textContent = 'Dismissed & Acknowledged Items';
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `
      padding: 4px;
      border: none;
      background: transparent;
      color: #6b7280;
      font-size: 20px;
      cursor: pointer;
      line-height: 1;
    `;
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => {
      this.hideDismissedPanel();
    });
    header.appendChild(closeBtn);

    panel.appendChild(header);

    // Panel content
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 16px;
      max-height: calc(70vh - 60px);
      overflow-y: auto;
    `;

    // Get dismissed and acknowledged items
    const dismissedItems = this.getDismissedItems(gaps);
    const acknowledgedItems = this.getAcknowledgedItems(gaps);

    if (dismissedItems.length === 0 && acknowledgedItems.length === 0) {
      content.innerHTML = `
        <p style="margin: 0; text-align: center; color: #6b7280; font-size: 14px;">
          No dismissed or acknowledged items
        </p>
      `;
    } else {
      // Dismissed section
      if (dismissedItems.length > 0) {
        const dismissedSection = document.createElement('div');
        dismissedSection.style.marginBottom = '20px';

        const dismissedTitle = document.createElement('h4');
        dismissedTitle.style.cssText = `
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        `;
        dismissedTitle.textContent = `Dismissed (${dismissedItems.length})`;
        dismissedSection.appendChild(dismissedTitle);

        dismissedItems.forEach(item => {
          const itemElement = this.createDismissedItemElement(item);
          dismissedSection.appendChild(itemElement);
        });

        content.appendChild(dismissedSection);
      }

      // Acknowledged section
      if (acknowledgedItems.length > 0) {
        const acknowledgedSection = document.createElement('div');

        const acknowledgedTitle = document.createElement('h4');
        acknowledgedTitle.style.cssText = `
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        `;
        acknowledgedTitle.textContent = `Acknowledged (${acknowledgedItems.length})`;
        acknowledgedSection.appendChild(acknowledgedTitle);

        acknowledgedItems.forEach(item => {
          const itemElement = this.createDismissedItemElement(item);
          acknowledgedSection.appendChild(itemElement);
        });

        content.appendChild(acknowledgedSection);
      }
    }

    panel.appendChild(content);

    return panel;
  }

  /**
   * Create dismissed item element
   * 
   * @param item - Dismissed item
   * @returns HTMLElement
   */
  private createDismissedItemElement(item: DismissedItem): HTMLElement {
    const element = document.createElement('div');
    element.style.cssText = `
      margin-bottom: 12px;
      padding: 12px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
    `;

    // Title
    const title = document.createElement('div');
    title.style.cssText = `
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #111827;
    `;
    title.textContent = item.gap.ruleName;
    element.appendChild(title);

    // Reason
    const reason = document.createElement('div');
    reason.style.cssText = `
      margin-bottom: 8px;
      font-size: 12px;
      color: #6b7280;
      font-style: italic;
    `;
    reason.textContent = `"${item.record.reason}"`;
    element.appendChild(reason);

    // Timestamp
    const timestamp = document.createElement('div');
    timestamp.style.cssText = `
      margin-bottom: 8px;
      font-size: 11px;
      color: #9ca3af;
    `;
    timestamp.textContent = item.record.timestamp.toLocaleString();
    element.appendChild(timestamp);

    // Restore button
    const restoreBtn = document.createElement('button');
    restoreBtn.style.cssText = `
      padding: 4px 12px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: white;
      color: #374151;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
    `;
    restoreBtn.textContent = 'Restore';
    restoreBtn.addEventListener('click', () => {
      this.restoreItem(item.gap.ruleId);
    });
    element.appendChild(restoreBtn);

    return element;
  }

  /**
   * Update dismissed panel content
   */
  private updateDismissedPanel(): void {
    if (!this.dismissedPanel) return;

    // Find the content div
    const content = this.dismissedPanel.querySelector('div:nth-child(2)');
    if (!content) return;

    // This would need access to gaps - for now just close and reopen
    // In a real implementation, we'd store the gaps reference
  }

  /**
   * Hide dismissed items panel
   */
  hideDismissedPanel(): void {
    if (this.dismissedPanel) {
      this.dismissedPanel.remove();
      this.dismissedPanel = null;
    }
  }

  /**
   * Clear all acknowledgments
   */
  clearAll(): void {
    this.acknowledgments.clear();
    this.updateDismissedPanel();
  }

  /**
   * Export acknowledgments to JSON
   * 
   * @returns JSON string of acknowledgments
   */
  exportAcknowledgments(): string {
    const data = Array.from(this.acknowledgments.entries()).map(([gapId, record]) => ({
      gapId,
      ...record,
      timestamp: record.timestamp.toISOString()
    }));

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import acknowledgments from JSON
   * 
   * @param json - JSON string of acknowledgments
   */
  importAcknowledgments(json: string): void {
    try {
      const data = JSON.parse(json);
      
      data.forEach((item: any) => {
        const record: AcknowledgmentRecord = {
          gapId: item.gapId,
          status: item.status,
          reason: item.reason,
          timestamp: new Date(item.timestamp),
          userId: item.userId
        };
        
        this.acknowledgments.set(item.gapId, record);
      });

      this.updateDismissedPanel();
    } catch (error) {
      console.error('Failed to import acknowledgments:', error);
    }
  }
}
