/**
 * Alert Generator for Gap Analysis Completeness Check
 * 
 * Creates interactive alerts and remediation suggestions for validation gaps.
 * Provides user-friendly alert messages and actionable guidance for document improvements.
 */

import { PrioritizedIssue } from './rule-engine';
import { ValidationRule } from './template-parser';

export interface ValidationGap {
  ruleId: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'missing_content' | 'format_error';
  description: string;
  remediationSteps: string[];
  required: boolean;
}

export interface InteractiveAlert {
  id: string;
  gapId: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  remediationSteps: string[];
  status: 'open' | 'acknowledged' | 'resolved';
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  priority: number;
  required: boolean;
}

export interface AlertMessage {
  html: string;
  text: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface RemediationStep {
  step: number;
  action: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * AlertGenerator class for creating interactive alerts and remediation guidance
 * Client-side display and user interaction management
 */
export class AlertGenerator {
  private alertIdCounter: number = 0;

  /**
   * Generate interactive alerts from validation gaps
   * 
   * @param gaps - Array of ValidationGap objects from validation
   * @returns Array of InteractiveAlert objects for display
   */
  generateAlerts(gaps: ValidationGap[]): InteractiveAlert[] {
    const alerts: InteractiveAlert[] = [];

    for (const gap of gaps) {
      const alert: InteractiveAlert = {
        id: this.generateAlertId(),
        gapId: gap.ruleId,
        title: this.createAlertTitle(gap),
        message: this.createAlertMessage(gap),
        severity: gap.severity,
        remediationSteps: gap.remediationSteps,
        status: 'open',
        priority: this.calculateAlertPriority(gap),
        required: gap.required
      };

      alerts.push(alert);
    }

    // Sort alerts by priority (highest first)
    alerts.sort((a, b) => b.priority - a.priority);

    return alerts;
  }

  /**
   * Generate alerts from prioritized issues (from RuleEngine)
   * 
   * @param issues - Array of PrioritizedIssue from RuleEngine
   * @returns Array of InteractiveAlert objects
   */
  generateAlertsFromIssues(issues: PrioritizedIssue[]): InteractiveAlert[] {
    const gaps: ValidationGap[] = issues.map(issue => ({
      ruleId: issue.rule.field,
      severity: issue.severity,
      category: issue.rule.type === 'content_presence' ? 'missing_content' : 'format_error',
      description: issue.rule.description,
      remediationSteps: this.createRemediationSteps(issue).map(step => step.action),
      required: issue.required
    }));

    return this.generateAlerts(gaps);
  }

  /**
   * Create remediation steps for a validation gap
   * 
   * @param gap - ValidationGap or PrioritizedIssue to create steps for
   * @returns Array of RemediationStep objects with actionable guidance
   */
  createRemediationSteps(gap: ValidationGap | PrioritizedIssue): RemediationStep[] {
    const steps: RemediationStep[] = [];
    
    // Determine if this is a PrioritizedIssue or ValidationGap
    const isPrioritizedIssue = 'rule' in gap;
    const rule = isPrioritizedIssue ? (gap as PrioritizedIssue).rule : null;
    const severity = isPrioritizedIssue ? (gap as PrioritizedIssue).severity : (gap as ValidationGap).severity;
    const category = isPrioritizedIssue 
      ? (rule!.type === 'content_presence' ? 'missing_content' : 'format_error')
      : (gap as ValidationGap).category;
    const remediationHint = isPrioritizedIssue ? rule!.remediationHint : '';

    // Step 1: Identify the issue
    steps.push({
      step: 1,
      action: 'Review the validation gap',
      description: isPrioritizedIssue 
        ? `Review section ${rule!.field}: ${rule!.description.substring(0, 100)}...`
        : `Review the identified gap: ${(gap as ValidationGap).description.substring(0, 100)}...`,
      priority: severity === 'critical' ? 'high' : severity === 'warning' ? 'medium' : 'low'
    });

    // Step 2: Locate the section in document
    if (category === 'missing_content') {
      steps.push({
        step: 2,
        action: 'Locate or create the missing section',
        description: isPrioritizedIssue
          ? `Find section ${rule!.field} in your document or create it if it doesn't exist`
          : 'Locate the section in your document or create it if missing',
        priority: 'high'
      });
    } else {
      steps.push({
        step: 2,
        action: 'Locate the section requiring format updates',
        description: isPrioritizedIssue
          ? `Navigate to section ${rule!.field} in your document`
          : 'Find the section that needs format improvements',
        priority: 'medium'
      });
    }

    // Step 3: Apply remediation
    if (remediationHint) {
      steps.push({
        step: 3,
        action: 'Apply the recommended fix',
        description: remediationHint,
        priority: severity === 'critical' ? 'high' : 'medium'
      });
    } else if (category === 'missing_content') {
      steps.push({
        step: 3,
        action: 'Add the required content',
        description: 'Add the missing content according to template requirements',
        priority: 'high'
      });
    } else {
      steps.push({
        step: 3,
        action: 'Update the format',
        description: 'Update the section format to meet template requirements',
        priority: 'medium'
      });
    }

    // Step 4: Verify the fix
    steps.push({
      step: 4,
      action: 'Re-run validation',
      description: 'Run the validation again to confirm the issue is resolved',
      priority: 'medium'
    });

    return steps;
  }

  /**
   * Format alert message for HTML display
   * 
   * @param alert - InteractiveAlert to format
   * @returns AlertMessage with HTML and text versions
   */
  formatAlertMessage(alert: InteractiveAlert): AlertMessage {
    const severityClass = this.getSeverityClass(alert.severity);
    const severityIcon = this.getSeverityIcon(alert.severity);
    const statusBadge = this.getStatusBadge(alert.status);

    const html = `
      <div class="alert alert-${severityClass}" data-alert-id="${alert.id}" data-gap-id="${alert.gapId}">
        <div class="alert-header">
          <span class="alert-icon">${severityIcon}</span>
          <h3 class="alert-title">${this.escapeHtml(alert.title)}</h3>
          <span class="alert-status">${statusBadge}</span>
        </div>
        <div class="alert-body">
          <p class="alert-message">${this.escapeHtml(alert.message)}</p>
          ${alert.remediationSteps.length > 0 ? `
            <div class="alert-remediation">
              <h4>Remediation Steps:</h4>
              <ol>
                ${alert.remediationSteps.map(step => `<li>${this.escapeHtml(step)}</li>`).join('')}
              </ol>
            </div>
          ` : ''}
        </div>
        <div class="alert-actions">
          <button class="btn btn-acknowledge" data-action="acknowledge" data-alert-id="${alert.id}">
            Acknowledge
          </button>
          <button class="btn btn-resolve" data-action="resolve" data-alert-id="${alert.id}">
            Mark as Resolved
          </button>
          <button class="btn btn-dismiss" data-action="dismiss" data-alert-id="${alert.id}">
            Dismiss
          </button>
        </div>
      </div>
    `;

    const text = `
[${alert.severity.toUpperCase()}] ${alert.title}
Status: ${alert.status}
${alert.message}

Remediation Steps:
${alert.remediationSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}
    `.trim();

    return {
      html,
      text,
      severity: alert.severity
    };
  }

  /**
   * Create interactive DOM elements for alerts
   * 
   * @param alerts - Array of InteractiveAlert objects
   * @returns Array of HTMLElement objects ready for insertion
   */
  createInteractiveElements(alerts: InteractiveAlert[]): HTMLElement[] {
    // Check if document is available (browser environment)
    if (typeof document === 'undefined') {
      console.warn('createInteractiveElements requires browser environment');
      return [];
    }

    const elements: HTMLElement[] = [];

    for (const alert of alerts) {
      const alertMessage = this.formatAlertMessage(alert);
      
      // Create a temporary container to parse HTML
      const container = document.createElement('div');
      container.innerHTML = alertMessage.html;
      
      const alertElement = container.firstElementChild as HTMLElement;
      
      if (alertElement) {
        // Attach event listeners to buttons
        this.attachEventListeners(alertElement, alert);
        elements.push(alertElement);
      }
    }

    return elements;
  }

  /**
   * Attach event listeners to alert buttons
   * 
   * @param element - HTMLElement containing the alert
   * @param alert - InteractiveAlert data
   */
  private attachEventListeners(element: HTMLElement, alert: InteractiveAlert): void {
    // Acknowledge button
    const acknowledgeBtn = element.querySelector('[data-action="acknowledge"]');
    if (acknowledgeBtn) {
      acknowledgeBtn.addEventListener('click', () => {
        this.handleAcknowledge(alert, element);
      });
    }

    // Resolve button
    const resolveBtn = element.querySelector('[data-action="resolve"]');
    if (resolveBtn) {
      resolveBtn.addEventListener('click', () => {
        this.handleResolve(alert, element);
      });
    }

    // Dismiss button
    const dismissBtn = element.querySelector('[data-action="dismiss"]');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        this.handleDismiss(alert, element);
      });
    }
  }

  /**
   * Handle alert acknowledgment
   * 
   * @param alert - InteractiveAlert being acknowledged
   * @param element - HTMLElement to update
   */
  private handleAcknowledge(alert: InteractiveAlert, element: HTMLElement): void {
    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    
    // Update status badge
    const statusBadge = element.querySelector('.alert-status');
    if (statusBadge) {
      statusBadge.innerHTML = this.getStatusBadge('acknowledged');
    }

    // Dispatch custom event
    element.dispatchEvent(new CustomEvent('alert-acknowledged', {
      detail: { alert },
      bubbles: true
    }));
  }

  /**
   * Handle alert resolution
   * 
   * @param alert - InteractiveAlert being resolved
   * @param element - HTMLElement to update
   */
  private handleResolve(alert: InteractiveAlert, element: HTMLElement): void {
    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    
    // Update status badge
    const statusBadge = element.querySelector('.alert-status');
    if (statusBadge) {
      statusBadge.innerHTML = this.getStatusBadge('resolved');
    }

    // Add resolved class for styling
    element.classList.add('alert-resolved');

    // Dispatch custom event
    element.dispatchEvent(new CustomEvent('alert-resolved', {
      detail: { alert },
      bubbles: true
    }));
  }

  /**
   * Handle alert dismissal
   * 
   * @param alert - InteractiveAlert being dismissed
   * @param element - HTMLElement to remove
   */
  private handleDismiss(alert: InteractiveAlert, element: HTMLElement): void {
    // Dispatch custom event before removal
    element.dispatchEvent(new CustomEvent('alert-dismissed', {
      detail: { alert },
      bubbles: true
    }));

    // Fade out and remove
    element.style.opacity = '0';
    element.style.transition = 'opacity 0.3s ease-out';
    
    setTimeout(() => {
      element.remove();
    }, 300);
  }

  /**
   * Generate unique alert ID
   * 
   * @returns Unique alert identifier
   */
  private generateAlertId(): string {
    this.alertIdCounter++;
    return `alert-${Date.now()}-${this.alertIdCounter}`;
  }

  /**
   * Create alert title from validation gap
   * 
   * @param gap - ValidationGap to create title for
   * @returns Alert title string
   */
  private createAlertTitle(gap: ValidationGap): string {
    const prefix = gap.severity === 'critical' ? '🔴 Critical' : 
                   gap.severity === 'warning' ? '⚠️ Warning' : 
                   'ℹ️ Info';
    
    const category = gap.category === 'missing_content' ? 'Missing Content' : 'Format Issue';
    
    return `${prefix}: ${category} - ${gap.ruleId}`;
  }

  /**
   * Create alert message from validation gap
   * 
   * @param gap - ValidationGap to create message for
   * @returns Alert message string
   */
  private createAlertMessage(gap: ValidationGap): string {
    let message = gap.description;
    
    if (gap.required) {
      message += ' (Required)';
    }
    
    return message;
  }

  /**
   * Calculate alert priority from validation gap
   * 
   * @param gap - ValidationGap to calculate priority for
   * @returns Priority number (1-10, higher = more urgent)
   */
  private calculateAlertPriority(gap: ValidationGap): number {
    let priority = 5; // Base priority
    
    // Adjust by severity
    if (gap.severity === 'critical') {
      priority += 4; // Critical: 9-10
    } else if (gap.severity === 'warning') {
      priority += 2; // Warning: 7-8
    }
    
    // Adjust by required status
    if (gap.required) {
      priority += 1;
    }
    
    // Cap at 10
    return Math.min(10, priority);
  }

  /**
   * Get CSS class for severity level
   * 
   * @param severity - Severity level
   * @returns CSS class name
   */
  private getSeverityClass(severity: 'critical' | 'warning' | 'info'): string {
    return severity;
  }

  /**
   * Get icon for severity level
   * 
   * @param severity - Severity level
   * @returns Icon HTML or emoji
   */
  private getSeverityIcon(severity: 'critical' | 'warning' | 'info'): string {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '•';
    }
  }

  /**
   * Get status badge HTML
   * 
   * @param status - Alert status
   * @returns Status badge HTML
   */
  private getStatusBadge(status: 'open' | 'acknowledged' | 'resolved'): string {
    const badges = {
      open: '<span class="badge badge-open">Open</span>',
      acknowledged: '<span class="badge badge-acknowledged">Acknowledged</span>',
      resolved: '<span class="badge badge-resolved">Resolved</span>'
    };
    
    return badges[status];
  }

  /**
   * Escape HTML special characters
   * 
   * @param text - Text to escape
   * @returns Escaped text
   */
  private escapeHtml(text: string): string {
    // Use simple string replacement for Node.js compatibility
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
