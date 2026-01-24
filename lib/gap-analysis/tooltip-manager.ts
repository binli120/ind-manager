/**
 * Tooltip Manager for Validation Indicators
 * 
 * Manages tooltip display and positioning for validation indicators.
 * Provides hover tooltips with gap details and remediation steps.
 */

import { ValidationGap } from './document-analyzer';

export interface TooltipConfig {
  showDelay: number;
  hideDelay: number;
  offsetX: number;
  offsetY: number;
}

/**
 * TooltipManager class for managing validation indicator tooltips
 * Handles tooltip creation, positioning, and lifecycle
 */
export class TooltipManager {
  private tooltip: HTMLElement | null;
  private currentTarget: HTMLElement | null;
  private showTimeout: number | null;
  private hideTimeout: number | null;
  private config: TooltipConfig;
  private isVisible: boolean;

  constructor(config?: Partial<TooltipConfig>) {
    this.tooltip = null;
    this.currentTarget = null;
    this.showTimeout = null;
    this.hideTimeout = null;
    this.isVisible = false;

    // Default configuration
    this.config = {
      showDelay: 500,
      hideDelay: 200,
      offsetX: 10,
      offsetY: 10,
      ...config
    };

    // Create tooltip element
    this.createTooltipElement();
  }

  /**
   * Create the tooltip element
   */
  private createTooltipElement(): void {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'validation-tooltip';
    this.tooltip.setAttribute('role', 'tooltip');
    document.body.appendChild(this.tooltip);

    // Prevent tooltip from closing when hovering over it
    this.tooltip.addEventListener('mouseenter', () => {
      this.cancelHide();
    });

    this.tooltip.addEventListener('mouseleave', () => {
      this.scheduleHide();
    });
  }

  /**
   * Show tooltip for a validation indicator
   * 
   * @param target - Target element to show tooltip for
   * @param gap - Validation gap data
   */
  showTooltip(target: HTMLElement, gap: ValidationGap): void {
    this.cancelHide();
    this.currentTarget = target;

    // Schedule tooltip display
    this.showTimeout = window.setTimeout(() => {
      this.displayTooltip(target, gap);
    }, this.config.showDelay);
  }

  /**
   * Display the tooltip
   * 
   * @param target - Target element
   * @param gap - Validation gap data
   */
  private displayTooltip(target: HTMLElement, gap: ValidationGap): void {
    if (!this.tooltip) return;

    // Build tooltip content
    this.tooltip.innerHTML = this.buildTooltipContent(gap);

    // Add severity class
    this.tooltip.className = `validation-tooltip tooltip-${gap.severity}`;

    // Position tooltip
    this.positionTooltip(target);

    // Show tooltip
    this.tooltip.classList.add('visible');
    this.isVisible = true;

    // Attach action handlers
    this.attachTooltipActions(gap);
  }

  /**
   * Build tooltip HTML content
   * 
   * @param gap - Validation gap data
   * @returns HTML string
   */
  private buildTooltipContent(gap: ValidationGap): string {
    const icon = this.getSeverityIcon(gap.severity);
    const title = gap.ruleName.split(':')[1]?.trim() || gap.ruleName;

    let html = `
      <div class="tooltip-header">
        <span class="tooltip-icon">${icon}</span>
        <span class="tooltip-title">${title}</span>
        <button class="tooltip-close" aria-label="Close tooltip">×</button>
      </div>
      <div class="tooltip-body">
        <p><strong>${gap.category === 'missing_content' ? 'Missing Content' : 'Format Issue'}</strong></p>
        <p>${gap.description}</p>
    `;

    // Add remediation steps
    if (gap.remediationSteps.length > 0) {
      html += `
        <p><strong>What to include:</strong></p>
        <ul>
          ${gap.remediationSteps.map(step => `<li>${step}</li>`).join('')}
        </ul>
      `;
    }

    html += `</div>`;

    // Add action buttons
    if (gap.category === 'missing_content') {
      html += `
        <div class="tooltip-actions">
          <button class="tooltip-btn btn-primary" data-action="insert">Insert Template</button>
          <button class="tooltip-btn" data-action="dismiss">Dismiss</button>
        </div>
      `;
    } else {
      html += `
        <div class="tooltip-actions">
          <button class="tooltip-btn btn-primary" data-action="fix">Fix Issue</button>
          <button class="tooltip-btn" data-action="dismiss">Dismiss</button>
          <button class="tooltip-btn" data-action="details">View Details</button>
        </div>
      `;
    }

    return html;
  }

  /**
   * Get severity icon
   * 
   * @param severity - Severity level
   * @returns Icon string
   */
  private getSeverityIcon(severity: 'critical' | 'warning' | 'info'): string {
    const icons = {
      critical: '🔴',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[severity];
  }

  /**
   * Position tooltip relative to target element
   * 
   * @param target - Target element
   */
  private positionTooltip(target: HTMLElement): void {
    if (!this.tooltip) return;

    const targetRect = target.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = targetRect.left + this.config.offsetX;
    let top = targetRect.bottom + this.config.offsetY;

    // Adjust horizontal position if tooltip would overflow viewport
    if (left + tooltipRect.width > viewportWidth) {
      left = viewportWidth - tooltipRect.width - this.config.offsetX;
    }

    // Adjust vertical position if tooltip would overflow viewport
    if (top + tooltipRect.height > viewportHeight) {
      // Show above target instead
      top = targetRect.top - tooltipRect.height - this.config.offsetY;
    }

    // Ensure tooltip doesn't go off-screen
    left = Math.max(this.config.offsetX, left);
    top = Math.max(this.config.offsetY, top);

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  }

  /**
   * Attach action handlers to tooltip buttons
   * 
   * @param gap - Validation gap data
   */
  private attachTooltipActions(gap: ValidationGap): void {
    if (!this.tooltip) return;

    // Close button
    const closeBtn = this.tooltip.querySelector('.tooltip-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hideTooltip();
      });
    }

    // Action buttons
    const actionButtons = this.tooltip.querySelectorAll('[data-action]');
    actionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const action = (e.target as HTMLElement).getAttribute('data-action');
        this.handleAction(action, gap);
      });
    });
  }

  /**
   * Handle tooltip action
   * 
   * @param action - Action type
   * @param gap - Validation gap data
   */
  private handleAction(action: string | null, gap: ValidationGap): void {
    if (!action) return;

    // Dispatch custom event for action handling
    const event = new CustomEvent('tooltip-action', {
      detail: { action, gap }
    });
    document.dispatchEvent(event);

    // Hide tooltip after action
    this.hideTooltip();
  }

  /**
   * Hide tooltip
   */
  hideTooltip(): void {
    if (!this.tooltip) return;

    this.cancelShow();
    this.tooltip.classList.remove('visible');
    this.isVisible = false;
    this.currentTarget = null;
  }

  /**
   * Schedule tooltip hide
   */
  scheduleHide(): void {
    this.hideTimeout = window.setTimeout(() => {
      this.hideTooltip();
    }, this.config.hideDelay);
  }

  /**
   * Cancel scheduled show
   */
  private cancelShow(): void {
    if (this.showTimeout !== null) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
  }

  /**
   * Cancel scheduled hide
   */
  private cancelHide(): void {
    if (this.hideTimeout !== null) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  /**
   * Attach tooltip to validation indicators
   * 
   * @param container - Container element with validation indicators
   */
  attachToContainer(container: HTMLElement): void {
    // Find all validation indicators
    const indicators = container.querySelectorAll('.validation-placeholder, .validation-error, .validation-highlight');

    indicators.forEach(indicator => {
      const element = indicator as HTMLElement;
      const gapId = element.getAttribute('data-gap-id');
      const severity = element.getAttribute('data-severity') as 'critical' | 'warning' | 'info';
      const type = element.getAttribute('data-type') as 'missing_content' | 'format_error';

      if (!gapId || !severity || !type) return;

      // Create gap object from attributes
      const gap: ValidationGap = {
        ruleId: gapId,
        ruleName: element.querySelector('.placeholder-title, .error-message')?.textContent || gapId,
        severity,
        category: type,
        description: element.querySelector('.placeholder-hint, .error-message')?.textContent || '',
        remediationSteps: Array.from(element.querySelectorAll('.placeholder-requirements li, .error-remediation li'))
          .map(li => li.textContent || ''),
        required: true
      };

      // Attach hover listeners
      element.addEventListener('mouseenter', () => {
        this.showTooltip(element, gap);
      });

      element.addEventListener('mouseleave', () => {
        this.scheduleHide();
      });
    });
  }

  /**
   * Check if tooltip is visible
   */
  isTooltipVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TooltipConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Destroy tooltip manager
   */
  destroy(): void {
    this.hideTooltip();
    this.cancelShow();
    this.cancelHide();

    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }
}
