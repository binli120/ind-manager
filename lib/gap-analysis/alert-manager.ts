/**
 * Alert Manager for Gap Analysis Completeness Check
 * 
 * Manages alert lifecycle, interaction tracking, and resolution status.
 * Provides centralized alert state management and persistence.
 */

import { InteractiveAlert, AlertGenerator } from './alert-generator';

export interface AlertInteraction {
  alertId: string;
  action: 'view' | 'acknowledge' | 'resolve' | 'dismiss' | 'reopen';
  timestamp: Date;
  userId?: string;
  notes?: string;
}

export interface AlertState {
  alerts: Map<string, InteractiveAlert>;
  interactions: AlertInteraction[];
  lastUpdated: Date;
}

/**
 * AlertManager class for managing alert lifecycle and interactions
 * Handles acknowledgment tracking, resolution status, and alert persistence
 */
export class AlertManager {
  private alerts: Map<string, InteractiveAlert>;
  private interactions: AlertInteraction[];
  private alertGenerator: AlertGenerator;
  private containerElement: HTMLElement | null;

  constructor(containerElementId?: string) {
    this.alerts = new Map();
    this.interactions = [];
    this.alertGenerator = new AlertGenerator();
    this.containerElement = containerElementId 
      ? document.getElementById(containerElementId) 
      : null;
  }

  /**
   * Add new alerts to the manager
   * 
   * @param alerts - Array of InteractiveAlert objects to add
   */
  addAlerts(alerts: InteractiveAlert[]): void {
    for (const alert of alerts) {
      this.alerts.set(alert.id, alert);
      
      // Record view interaction
      this.recordInteraction({
        alertId: alert.id,
        action: 'view',
        timestamp: new Date()
      });
    }
  }

  /**
   * Get alert by ID
   * 
   * @param alertId - Alert identifier
   * @returns InteractiveAlert or undefined if not found
   */
  getAlert(alertId: string): InteractiveAlert | undefined {
    return this.alerts.get(alertId);
  }

  /**
   * Get all alerts
   * 
   * @returns Array of all InteractiveAlert objects
   */
  getAllAlerts(): InteractiveAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get alerts by status
   * 
   * @param status - Alert status to filter by
   * @returns Array of InteractiveAlert objects with matching status
   */
  getAlertsByStatus(status: 'open' | 'acknowledged' | 'resolved'): InteractiveAlert[] {
    return this.getAllAlerts().filter(alert => alert.status === status);
  }

  /**
   * Get alerts by severity
   * 
   * @param severity - Severity level to filter by
   * @returns Array of InteractiveAlert objects with matching severity
   */
  getAlertsBySeverity(severity: 'critical' | 'warning' | 'info'): InteractiveAlert[] {
    return this.getAllAlerts().filter(alert => alert.severity === severity);
  }

  /**
   * Acknowledge an alert
   * 
   * @param alertId - Alert identifier
   * @param userId - Optional user identifier
   * @param notes - Optional acknowledgment notes
   * @returns True if successful, false if alert not found
   */
  acknowledgeAlert(alertId: string, userId?: string, notes?: string): boolean {
    const alert = this.alerts.get(alertId);
    
    if (!alert) {
      return false;
    }

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();

    this.recordInteraction({
      alertId,
      action: 'acknowledge',
      timestamp: new Date(),
      userId,
      notes
    });

    this.updateAlertDisplay(alert);
    return true;
  }

  /**
   * Resolve an alert
   * 
   * @param alertId - Alert identifier
   * @param userId - Optional user identifier
   * @param notes - Optional resolution notes
   * @returns True if successful, false if alert not found
   */
  resolveAlert(alertId: string, userId?: string, notes?: string): boolean {
    const alert = this.alerts.get(alertId);
    
    if (!alert) {
      return false;
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();

    this.recordInteraction({
      alertId,
      action: 'resolve',
      timestamp: new Date(),
      userId,
      notes
    });

    this.updateAlertDisplay(alert);
    return true;
  }

  /**
   * Reopen a resolved alert
   * 
   * @param alertId - Alert identifier
   * @param userId - Optional user identifier
   * @param notes - Optional reopen notes
   * @returns True if successful, false if alert not found
   */
  reopenAlert(alertId: string, userId?: string, notes?: string): boolean {
    const alert = this.alerts.get(alertId);
    
    if (!alert) {
      return false;
    }

    alert.status = 'open';
    alert.acknowledgedAt = undefined;
    alert.resolvedAt = undefined;

    this.recordInteraction({
      alertId,
      action: 'reopen',
      timestamp: new Date(),
      userId,
      notes
    });

    this.updateAlertDisplay(alert);
    return true;
  }

  /**
   * Dismiss an alert (remove from display)
   * 
   * @param alertId - Alert identifier
   * @param userId - Optional user identifier
   * @param notes - Optional dismissal notes
   * @returns True if successful, false if alert not found
   */
  dismissAlert(alertId: string, userId?: string, notes?: string): boolean {
    const alert = this.alerts.get(alertId);
    
    if (!alert) {
      return false;
    }

    this.recordInteraction({
      alertId,
      action: 'dismiss',
      timestamp: new Date(),
      userId,
      notes
    });

    // Remove from display
    this.removeAlertFromDisplay(alertId);
    
    // Keep in memory for history but mark as dismissed
    this.alerts.delete(alertId);
    
    return true;
  }

  /**
   * Record an alert interaction
   * 
   * @param interaction - AlertInteraction to record
   */
  private recordInteraction(interaction: AlertInteraction): void {
    this.interactions.push(interaction);
  }

  /**
   * Get interaction history for an alert
   * 
   * @param alertId - Alert identifier
   * @returns Array of AlertInteraction objects for the alert
   */
  getAlertInteractions(alertId: string): AlertInteraction[] {
    return this.interactions.filter(i => i.alertId === alertId);
  }

  /**
   * Get all interactions
   * 
   * @returns Array of all AlertInteraction objects
   */
  getAllInteractions(): AlertInteraction[] {
    return [...this.interactions];
  }

  /**
   * Clear all alerts
   */
  clearAllAlerts(): void {
    this.alerts.clear();
    
    if (this.containerElement) {
      this.containerElement.innerHTML = '';
    }
  }

  /**
   * Render alerts to the container element
   * 
   * @param alerts - Optional array of alerts to render (defaults to all alerts)
   */
  renderAlerts(alerts?: InteractiveAlert[]): void {
    if (!this.containerElement) {
      console.warn('No container element set for AlertManager');
      return;
    }

    const alertsToRender = alerts || this.getAllAlerts();
    
    // Clear container
    this.containerElement.innerHTML = '';

    // Create and append alert elements
    const elements = this.alertGenerator.createInteractiveElements(alertsToRender);
    
    for (const element of elements) {
      // Add event listeners for alert actions
      this.attachManagerEventListeners(element);
      this.containerElement.appendChild(element);
    }
  }

  /**
   * Attach event listeners to alert elements for manager integration
   * 
   * @param element - HTMLElement containing the alert
   */
  private attachManagerEventListeners(element: HTMLElement): void {
    // Listen for custom events from AlertGenerator
    element.addEventListener('alert-acknowledged', (event: Event) => {
      const customEvent = event as CustomEvent;
      const alert = customEvent.detail.alert as InteractiveAlert;
      
      // Update manager state
      this.alerts.set(alert.id, alert);
      
      // Record interaction
      this.recordInteraction({
        alertId: alert.id,
        action: 'acknowledge',
        timestamp: new Date()
      });
    });

    element.addEventListener('alert-resolved', (event: Event) => {
      const customEvent = event as CustomEvent;
      const alert = customEvent.detail.alert as InteractiveAlert;
      
      // Update manager state
      this.alerts.set(alert.id, alert);
      
      // Record interaction
      this.recordInteraction({
        alertId: alert.id,
        action: 'resolve',
        timestamp: new Date()
      });
    });

    element.addEventListener('alert-dismissed', (event: Event) => {
      const customEvent = event as CustomEvent;
      const alert = customEvent.detail.alert as InteractiveAlert;
      
      // Record interaction
      this.recordInteraction({
        alertId: alert.id,
        action: 'dismiss',
        timestamp: new Date()
      });
      
      // Remove from manager
      this.alerts.delete(alert.id);
    });
  }

  /**
   * Update alert display in the DOM
   * 
   * @param alert - InteractiveAlert to update
   */
  private updateAlertDisplay(alert: InteractiveAlert): void {
    if (!this.containerElement) {
      return;
    }

    const alertElement = this.containerElement.querySelector(`[data-alert-id="${alert.id}"]`);
    
    if (alertElement) {
      // Update status badge
      const statusBadge = alertElement.querySelector('.alert-status');
      if (statusBadge) {
        statusBadge.innerHTML = this.getStatusBadgeHtml(alert.status);
      }

      // Add/remove resolved class
      if (alert.status === 'resolved') {
        alertElement.classList.add('alert-resolved');
      } else {
        alertElement.classList.remove('alert-resolved');
      }
    }
  }

  /**
   * Remove alert from display
   * 
   * @param alertId - Alert identifier
   */
  private removeAlertFromDisplay(alertId: string): void {
    if (!this.containerElement) {
      return;
    }

    const alertElement = this.containerElement.querySelector(`[data-alert-id="${alertId}"]`);
    
    if (alertElement) {
      // Fade out animation
      (alertElement as HTMLElement).style.opacity = '0';
      (alertElement as HTMLElement).style.transition = 'opacity 0.3s ease-out';
      
      setTimeout(() => {
        alertElement.remove();
      }, 300);
    }
  }

  /**
   * Get status badge HTML
   * 
   * @param status - Alert status
   * @returns Status badge HTML
   */
  private getStatusBadgeHtml(status: 'open' | 'acknowledged' | 'resolved'): string {
    const badges = {
      open: '<span class="badge badge-open">Open</span>',
      acknowledged: '<span class="badge badge-acknowledged">Acknowledged</span>',
      resolved: '<span class="badge badge-resolved">Resolved</span>'
    };
    
    return badges[status];
  }

  /**
   * Get alert statistics
   * 
   * @returns Object with alert counts by status and severity
   */
  getStatistics(): {
    total: number;
    byStatus: { open: number; acknowledged: number; resolved: number };
    bySeverity: { critical: number; warning: number; info: number };
    byRequired: { required: number; optional: number };
  } {
    const alerts = this.getAllAlerts();
    
    return {
      total: alerts.length,
      byStatus: {
        open: alerts.filter(a => a.status === 'open').length,
        acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
        resolved: alerts.filter(a => a.status === 'resolved').length
      },
      bySeverity: {
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length
      },
      byRequired: {
        required: alerts.filter(a => a.required).length,
        optional: alerts.filter(a => !a.required).length
      }
    };
  }

  /**
   * Export alert state for persistence
   * 
   * @returns AlertState object with all alerts and interactions
   */
  exportState(): AlertState {
    return {
      alerts: new Map(this.alerts),
      interactions: [...this.interactions],
      lastUpdated: new Date()
    };
  }

  /**
   * Import alert state from persistence
   * 
   * @param state - AlertState object to import
   */
  importState(state: AlertState): void {
    this.alerts = new Map(state.alerts);
    this.interactions = [...state.interactions];
  }

  /**
   * Set container element for rendering alerts
   * 
   * @param elementId - ID of the container element
   */
  setContainerElement(elementId: string): void {
    this.containerElement = document.getElementById(elementId);
  }
}
