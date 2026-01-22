/**
 * In-Editor Validation Manager
 * 
 * Manages validation indicators directly within the HTML editor.
 * Provides real-time validation feedback with inline indicators.
 */

import { ValidationGap, AnalysisResult } from './document-analyzer';
import { HTMLEditor } from './html-editor';
import { AcknowledgmentManager } from './acknowledgment-manager';

export interface EditorDecoration {
  id: string;
  gapId: string;
  type: 'missing_content' | 'format_error' | 'placeholder_hint';
  severity: 'critical' | 'warning' | 'info';
  position: number;
  element: HTMLElement;
  tooltip?: HTMLElement;
  status: 'active' | 'acknowledged' | 'dismissed' | 'fixed';
}

export interface ValidationIndicatorConfig {
  showPlaceholders: boolean;
  showFormatErrors: boolean;
  severityFilter: ('critical' | 'warning' | 'info')[];
  autoUpdate: boolean;
  debounceMs: number;
  groupIndicators: boolean;
  progressiveDisclosure: boolean;
}

export interface IndicatorGroup {
  sectionId: string;
  sectionTitle: string;
  indicators: EditorDecoration[];
  isExpanded: boolean;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
}

export class InEditorValidationManager {
  private editor: HTMLEditor;
  private editorElement: HTMLDivElement;
  private decorations: Map<string, EditorDecoration>;
  private indicatorGroups: Map<string, IndicatorGroup>;
  private validationResults: AnalysisResult | null;
  private config: ValidationIndicatorConfig;
  private updateTimeout: number | null;
  private acknowledgmentManager: AcknowledgmentManager;

  constructor(editor: HTMLEditor, config?: Partial<ValidationIndicatorConfig>) {
    this.editor = editor;
    this.editorElement = editor.getEditorElement();
    this.decorations = new Map();
    this.indicatorGroups = new Map();
    this.validationResults = null;
    this.updateTimeout = null;
    this.acknowledgmentManager = new AcknowledgmentManager();

    // Default configuration
    this.config = {
      showPlaceholders: true,
      showFormatErrors: true,
      severityFilter: ['critical', 'warning', 'info'],
      autoUpdate: true,
      debounceMs: 1000,
      groupIndicators: true,
      progressiveDisclosure: true,
      ...config
    };

    // Set up acknowledgment manager callback
    this.acknowledgmentManager.setStatusChangeCallback((gapId, status, reason) => {
      this.handleAcknowledgmentChange(gapId, status, reason);
    });
  }

  /**
   * Attach validation manager to editor with validation results
   * 
   * @param validationResults - Analysis results from document validation
   */
  attachToEditor(validationResults: AnalysisResult): void {
    this.validationResults = validationResults;
    
    // Clear existing decorations
    this.clearAllDecorations();

    // Create inline indicators for gaps
    this.createInlineIndicators(validationResults.gaps);

    // Set up auto-update if enabled
    if (this.config.autoUpdate) {
      this.setupAutoUpdate();
    }

    // Update issue count in toolbar
    this.editor.updateIssueCount();
  }

  /**
   * Create inline validation indicators for gaps
   * 
   * @param gaps - Array of validation gaps to display
   */
  createInlineIndicators(gaps: ValidationGap[]): void {
    // Filter gaps based on configuration
    const filteredGaps = gaps.filter(gap => 
      this.config.severityFilter.includes(gap.severity)
    );

    // Apply progressive disclosure if enabled
    let displayGaps = filteredGaps;
    if (this.config.progressiveDisclosure) {
      // Initially show only critical issues
      displayGaps = filteredGaps.filter(g => g.severity === 'critical');
      
      // If no critical issues, show warnings
      if (displayGaps.length === 0) {
        displayGaps = filteredGaps.filter(g => g.severity === 'warning');
      }
      
      // If no warnings, show all
      if (displayGaps.length === 0) {
        displayGaps = filteredGaps;
      }
    }

    // Group indicators if enabled
    if (this.config.groupIndicators) {
      this.createGroupedIndicators(displayGaps);
    } else {
      // Separate gaps by type
      const missingContentGaps = displayGaps.filter(g => g.category === 'missing_content');
      const formatErrorGaps = displayGaps.filter(g => g.category === 'format_error');

      // Show placeholder hints for missing content
      if (this.config.showPlaceholders) {
        this.showPlaceholderHints(missingContentGaps);
      }

      // Highlight problematic content for format errors
      if (this.config.showFormatErrors) {
        this.highlightProblematicContent(formatErrorGaps);
      }
    }
  }

  /**
   * Create grouped indicators by section
   * 
   * @param gaps - Array of validation gaps to group and display
   */
  private createGroupedIndicators(gaps: ValidationGap[]): void {
    // Clear existing groups
    this.indicatorGroups.clear();

    // Group gaps by section (extract section prefix like "2.6.2.1")
    const gapsBySection = new Map<string, ValidationGap[]>();
    
    gaps.forEach(gap => {
      const sectionId = this.extractSectionId(gap.ruleId);
      if (!gapsBySection.has(sectionId)) {
        gapsBySection.set(sectionId, []);
      }
      gapsBySection.get(sectionId)!.push(gap);
    });

    // Create indicator groups
    gapsBySection.forEach((sectionGaps, sectionId) => {
      const group: IndicatorGroup = {
        sectionId,
        sectionTitle: this.extractSectionTitle(sectionGaps[0]),
        indicators: [],
        isExpanded: false, // Start collapsed
        criticalCount: sectionGaps.filter(g => g.severity === 'critical').length,
        warningCount: sectionGaps.filter(g => g.severity === 'warning').length,
        infoCount: sectionGaps.filter(g => g.severity === 'info').length
      };

      // Auto-expand if has critical issues
      if (group.criticalCount > 0) {
        group.isExpanded = true;
      }

      this.indicatorGroups.set(sectionId, group);
    });

    // Render grouped indicators
    this.renderGroupedIndicators(gaps);
  }

  /**
   * Extract section ID from rule ID (e.g., "2.6.2.1 - a" -> "2.6.2.1")
   * 
   * @param ruleId - Full rule identifier
   * @returns Section identifier
   */
  private extractSectionId(ruleId: string): string {
    // Match pattern like "2.6.2.1" or "2.6.2.1.1" (any number of levels)
    const match = ruleId.match(/^(\d+(?:\.\d+)*)/);
    return match ? match[1] : ruleId;
  }

  /**
   * Extract section title from gap
   * 
   * @param gap - Validation gap
   * @returns Section title
   */
  private extractSectionTitle(gap: ValidationGap): string {
    // Extract title from rule name (e.g., "2.6.2.1 - a: Brief Summary" -> "Brief Summary")
    const parts = gap.ruleName.split(':');
    return parts.length > 1 ? parts[1].trim() : gap.ruleName;
  }

  /**
   * Render grouped indicators in the editor
   * 
   * @param gaps - Array of validation gaps
   */
  private renderGroupedIndicators(gaps: ValidationGap[]): void {
    const isEmpty = this.editorElement.textContent?.trim().length === 0;

    // Sort groups by section ID
    const sortedGroups = Array.from(this.indicatorGroups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));

    sortedGroups.forEach(([sectionId, group]) => {
      const sectionGaps = gaps.filter(g => this.extractSectionId(g.ruleId) === sectionId);
      
      // Create group container
      const groupContainer = this.createGroupContainer(group, sectionGaps);
      
      // Append to editor
      this.editorElement.appendChild(groupContainer);
      
      // Store decorations for each gap in the group
      sectionGaps.forEach((gap, index) => {
        const decoration: EditorDecoration = {
          id: `grouped-${sectionId}-${index}`,
          gapId: gap.ruleId,
          type: gap.category === 'missing_content' ? 'placeholder_hint' : 'format_error',
          severity: gap.severity,
          position: index,
          element: groupContainer,
          status: 'active'
        };
        
        this.decorations.set(decoration.id, decoration);
        group.indicators.push(decoration);
      });
    });

    // Update issue count in toolbar
    this.editor.updateIssueCount();
  }

  /**
   * Create a group container element
   * 
   * @param group - Indicator group
   * @param gaps - Gaps in this group
   * @returns HTMLElement group container
   */
  private createGroupContainer(group: IndicatorGroup, gaps: ValidationGap[]): HTMLElement {
    const container = document.createElement('div');
    container.className = 'validation-group';
    container.setAttribute('data-section-id', group.sectionId);
    container.setAttribute('contenteditable', 'false');

    // Group header
    const header = document.createElement('div');
    header.className = 'validation-group-header';
    
    // Expand/collapse button
    const expandBtn = document.createElement('button');
    expandBtn.className = 'group-expand-btn';
    expandBtn.textContent = group.isExpanded ? '▼' : '▶';
    expandBtn.addEventListener('click', () => {
      this.toggleGroupExpansion(group.sectionId);
    });
    header.appendChild(expandBtn);

    // Section title
    const title = document.createElement('span');
    title.className = 'group-title';
    title.textContent = `${group.sectionId}: ${group.sectionTitle}`;
    header.appendChild(title);

    // Count badges
    const badges = document.createElement('div');
    badges.className = 'group-badges';
    
    if (group.criticalCount > 0) {
      const criticalBadge = document.createElement('span');
      criticalBadge.className = 'group-badge badge-critical';
      criticalBadge.textContent = `🔴 ${group.criticalCount}`;
      badges.appendChild(criticalBadge);
    }
    
    if (group.warningCount > 0) {
      const warningBadge = document.createElement('span');
      warningBadge.className = 'group-badge badge-warning';
      warningBadge.textContent = `⚠️ ${group.warningCount}`;
      badges.appendChild(warningBadge);
    }
    
    if (group.infoCount > 0) {
      const infoBadge = document.createElement('span');
      infoBadge.className = 'group-badge badge-info';
      infoBadge.textContent = `ℹ️ ${group.infoCount}`;
      badges.appendChild(infoBadge);
    }
    
    header.appendChild(badges);
    container.appendChild(header);

    // Group content (collapsible)
    const content = document.createElement('div');
    content.className = 'validation-group-content';
    content.style.display = group.isExpanded ? 'block' : 'none';

    // Add individual indicators
    gaps.forEach(gap => {
      const indicator = gap.category === 'missing_content' 
        ? this.createPlaceholderElement(gap)
        : this.createFormatErrorIndicator(gap);
      
      content.appendChild(indicator);
    });

    container.appendChild(content);

    return container;
  }

  /**
   * Toggle group expansion state
   * 
   * @param sectionId - Section identifier
   */
  toggleGroupExpansion(sectionId: string): void {
    const group = this.indicatorGroups.get(sectionId);
    if (!group) return;

    group.isExpanded = !group.isExpanded;

    // Update UI
    const groupElement = this.editorElement.querySelector(`[data-section-id="${sectionId}"]`);
    if (groupElement) {
      const expandBtn = groupElement.querySelector('.group-expand-btn');
      const content = groupElement.querySelector('.validation-group-content') as HTMLElement;
      
      if (expandBtn) {
        expandBtn.textContent = group.isExpanded ? '▼' : '▶';
      }
      
      if (content) {
        content.style.display = group.isExpanded ? 'block' : 'none';
      }
    }
  }

  /**
   * Show all severity levels (disable progressive disclosure)
   */
  showAllSeverities(): void {
    if (!this.validationResults) return;

    this.config.progressiveDisclosure = false;
    this.attachToEditor(this.validationResults);
  }

  /**
   * Show only critical issues
   */
  showCriticalOnly(): void {
    if (!this.validationResults) return;

    this.config.progressiveDisclosure = true;
    this.config.severityFilter = ['critical'];
    this.attachToEditor(this.validationResults);
  }

  /**
   * Show critical and warning issues
   */
  showCriticalAndWarnings(): void {
    if (!this.validationResults) return;

    this.config.progressiveDisclosure = false;
    this.config.severityFilter = ['critical', 'warning'];
    this.attachToEditor(this.validationResults);
  }

  /**
   * Show placeholder hints for missing content
   * 
   * @param gaps - Array of missing content gaps
   */
  showPlaceholderHints(gaps: ValidationGap[]): void {
    const content = this.editorElement.innerHTML;
    
    // If editor is empty or has minimal content, show all placeholders at the end
    const isEmpty = this.editorElement.textContent?.trim().length === 0;
    
    if (isEmpty) {
      // Show all placeholders in a structured way
      gaps.forEach((gap, index) => {
        const placeholder = this.createPlaceholderElement(gap);
        this.editorElement.appendChild(placeholder);
        
        // Store decoration
        const decoration: EditorDecoration = {
          id: `placeholder-${gap.ruleId}`,
          gapId: gap.ruleId,
          type: 'placeholder_hint',
          severity: gap.severity,
          position: index,
          element: placeholder,
          status: 'active'
        };
        
        this.decorations.set(decoration.id, decoration);
      });
    } else {
      // Try to insert placeholders at appropriate positions
      gaps.forEach((gap, index) => {
        // Check if section already exists in content
        const sectionExists = this.checkSectionExists(gap.ruleId, content);
        
        if (!sectionExists) {
          const placeholder = this.createPlaceholderElement(gap);
          
          // Insert at end for now (more sophisticated positioning would require parsing)
          this.editorElement.appendChild(placeholder);
          
          // Store decoration
          const decoration: EditorDecoration = {
            id: `placeholder-${gap.ruleId}`,
            gapId: gap.ruleId,
            type: 'placeholder_hint',
            severity: gap.severity,
            position: this.editorElement.children.length - 1,
            element: placeholder,
            status: 'active'
          };
          
          this.decorations.set(decoration.id, decoration);
        }
      });
    }

    // Update issue count in toolbar
    this.editor.updateIssueCount();
  }

  /**
   * Create a placeholder element for missing content
   * 
   * @param gap - Validation gap for missing content
   * @returns HTMLElement placeholder
   */
  private createPlaceholderElement(gap: ValidationGap): HTMLElement {
    const placeholder = document.createElement('div');
    placeholder.className = `validation-placeholder validation-${gap.severity}`;
    placeholder.setAttribute('data-gap-id', gap.ruleId);
    placeholder.setAttribute('data-severity', gap.severity);
    placeholder.setAttribute('data-type', 'missing_content');
    placeholder.setAttribute('contenteditable', 'false');

    // Icon
    const icon = document.createElement('span');
    icon.className = 'placeholder-icon';
    icon.textContent = '➕';
    placeholder.appendChild(icon);

    // Title
    const title = document.createElement('span');
    title.className = 'placeholder-title';
    title.textContent = `${gap.ruleId}: ${gap.ruleName.split(':')[1]?.trim() || gap.ruleName}`;
    placeholder.appendChild(title);

    // Hint
    const hint = document.createElement('div');
    hint.className = 'placeholder-hint';
    hint.textContent = 'Click to add required content';
    placeholder.appendChild(hint);

    // Requirements list
    if (gap.remediationSteps.length > 0) {
      const requirements = document.createElement('ul');
      requirements.className = 'placeholder-requirements';
      gap.remediationSteps.forEach(step => {
        const li = document.createElement('li');
        li.textContent = step;
        requirements.appendChild(li);
      });
      placeholder.appendChild(requirements);
    }

    // Action buttons container
    const actions = document.createElement('div');
    actions.className = 'placeholder-actions';
    actions.style.cssText = 'display: flex; gap: 8px; margin-top: 8px;';

    // Insert button
    const insertBtn = document.createElement('button');
    insertBtn.className = 'placeholder-action-btn btn-insert';
    insertBtn.textContent = 'Insert Template';
    insertBtn.style.cssText = `
      padding: 4px 12px;
      border: 1px solid #3b82f6;
      border-radius: 4px;
      background: #3b82f6;
      color: white;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    insertBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handlePlaceholderClick(gap, placeholder);
    });
    actions.appendChild(insertBtn);

    // Acknowledge button
    const acknowledgeBtn = document.createElement('button');
    acknowledgeBtn.className = 'placeholder-action-btn btn-acknowledge';
    acknowledgeBtn.textContent = 'Acknowledge';
    acknowledgeBtn.style.cssText = `
      padding: 4px 12px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: white;
      color: #374151;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    acknowledgeBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.acknowledgeIndicator(gap.ruleId, gap);
    });
    actions.appendChild(acknowledgeBtn);

    // Dismiss button
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'placeholder-action-btn btn-dismiss';
    dismissBtn.textContent = 'Dismiss';
    dismissBtn.style.cssText = `
      padding: 4px 12px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: white;
      color: #6b7280;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    dismissBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.dismissIndicator(gap.ruleId, gap);
    });
    actions.appendChild(dismissBtn);

    placeholder.appendChild(actions);

    return placeholder;
  }

  /**
   * Handle placeholder click to insert template
   * 
   * @param gap - Validation gap
   * @param placeholder - Placeholder element
   */
  private handlePlaceholderClick(gap: ValidationGap, placeholder: HTMLElement): void {
    // Create a template section
    const section = document.createElement('div');
    section.className = 'editor-section';
    section.setAttribute('data-section-id', gap.ruleId);
    
    // Add section heading
    const heading = document.createElement('h3');
    heading.textContent = `${gap.ruleId}: ${gap.ruleName.split(':')[1]?.trim() || gap.ruleName}`;
    section.appendChild(heading);
    
    // Add placeholder content
    const content = document.createElement('p');
    content.textContent = '[Add content here]';
    section.appendChild(content);
    
    // Replace placeholder with section
    placeholder.replaceWith(section);
    
    // Remove decoration
    const decorationId = `placeholder-${gap.ruleId}`;
    this.decorations.delete(decorationId);
    
    // Focus on the new section
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(content);
    selection?.removeAllRanges();
    selection?.addRange(range);
    
    // Trigger validation update
    this.updateValidationStatus(gap.ruleId, 'fixed');
  }

  /**
   * Highlight problematic content for format errors
   * 
   * @param gaps - Array of format error gaps
   */
  highlightProblematicContent(gaps: ValidationGap[]): void {
    const content = this.editorElement.innerHTML;
    
    gaps.forEach(gap => {
      // Try to find the section in the content
      const sectionMatch = this.findSectionInContent(gap.ruleId, content);
      
      if (sectionMatch) {
        // Create format error indicator
        const indicator = this.createFormatErrorIndicator(gap);
        
        // Try to insert indicator near the section
        // For POC, we'll append to the end of the section
        const sectionElements = this.editorElement.querySelectorAll(`[data-section-id="${gap.ruleId}"]`);
        
        if (sectionElements.length > 0) {
          sectionElements[0].appendChild(indicator);
        } else {
          // If no specific section found, append to editor
          this.editorElement.appendChild(indicator);
        }
        
        // Store decoration
        const decoration: EditorDecoration = {
          id: `format-error-${gap.ruleId}`,
          gapId: gap.ruleId,
          type: 'format_error',
          severity: gap.severity,
          position: 0,
          element: indicator,
          status: 'active'
        };
        
        this.decorations.set(decoration.id, decoration);
      }
    });

    // Update issue count in toolbar
    this.editor.updateIssueCount();
  }

  /**
   * Create format error indicator element
   * 
   * @param gap - Validation gap for format error
   * @returns HTMLElement indicator
   */
  private createFormatErrorIndicator(gap: ValidationGap): HTMLElement {
    const indicator = document.createElement('div');
    indicator.className = `validation-error validation-${gap.severity}`;
    indicator.setAttribute('data-gap-id', gap.ruleId);
    indicator.setAttribute('data-severity', gap.severity);
    indicator.setAttribute('data-type', 'format_error');
    indicator.setAttribute('contenteditable', 'false');

    // Icon and message
    const icon = this.getSeverityIcon(gap.severity);
    const message = document.createElement('span');
    message.className = 'error-message';
    message.innerHTML = `${icon} <strong>${gap.ruleName}</strong>: ${gap.description}`;
    indicator.appendChild(message);

    // Remediation steps
    if (gap.remediationSteps.length > 0) {
      const steps = document.createElement('div');
      steps.className = 'error-remediation';
      steps.innerHTML = '<strong>To fix:</strong>';
      const list = document.createElement('ul');
      gap.remediationSteps.forEach(step => {
        const li = document.createElement('li');
        li.textContent = step;
        list.appendChild(li);
      });
      steps.appendChild(list);
      indicator.appendChild(steps);
    }

    // Action buttons container
    const actions = document.createElement('div');
    actions.className = 'error-actions';
    actions.style.cssText = 'display: flex; gap: 8px; margin-top: 8px;';

    // Acknowledge button
    const acknowledgeBtn = document.createElement('button');
    acknowledgeBtn.className = 'error-action-btn btn-acknowledge';
    acknowledgeBtn.textContent = 'Acknowledge';
    acknowledgeBtn.style.cssText = `
      padding: 4px 12px;
      border: 1px solid #3b82f6;
      border-radius: 4px;
      background: white;
      color: #3b82f6;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    acknowledgeBtn.addEventListener('click', async () => {
      await this.acknowledgeIndicator(gap.ruleId, gap);
    });
    actions.appendChild(acknowledgeBtn);

    // Dismiss button
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'error-action-btn btn-dismiss';
    dismissBtn.textContent = 'Dismiss';
    dismissBtn.style.cssText = `
      padding: 4px 12px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: white;
      color: #6b7280;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    dismissBtn.addEventListener('click', async () => {
      await this.dismissIndicator(gap.ruleId, gap);
    });
    actions.appendChild(dismissBtn);

    indicator.appendChild(actions);

    return indicator;
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
   * Check if a section exists in content
   * 
   * @param sectionId - Section identifier
   * @param content - HTML content
   * @returns True if section exists
   */
  private checkSectionExists(sectionId: string, content: string): boolean {
    const normalizedContent = content.toLowerCase();
    const normalizedId = sectionId.toLowerCase();
    
    // Check for various formats of the section ID
    return normalizedContent.includes(normalizedId) ||
           normalizedContent.includes(normalizedId.replace(/\s*-\s*/g, '')) ||
           normalizedContent.includes(normalizedId.replace(/\s+/g, ''));
  }

  /**
   * Find section in content
   * 
   * @param sectionId - Section identifier
   * @param content - HTML content
   * @returns Match information or null
   */
  private findSectionInContent(sectionId: string, content: string): { index: number; length: number } | null {
    const normalizedContent = content.toLowerCase();
    const normalizedId = sectionId.toLowerCase();
    
    const index = normalizedContent.indexOf(normalizedId);
    
    if (index !== -1) {
      return { index, length: sectionId.length };
    }
    
    return null;
  }

  /**
   * Update validation status for a gap
   * 
   * @param gapId - Gap identifier
   * @param status - New status
   */
  updateValidationStatus(gapId: string, status: 'fixed' | 'acknowledged' | 'dismissed'): void {
    // Find all decorations for this gap
    const decorations = Array.from(this.decorations.values()).filter(d => d.gapId === gapId);
    
    decorations.forEach(decoration => {
      decoration.status = status;
      
      if (status === 'fixed' || status === 'dismissed') {
        // Remove the decoration element
        decoration.element.remove();
        this.decorations.delete(decoration.id);
      } else if (status === 'acknowledged') {
        // Update visual state
        decoration.element.classList.add('acknowledged');
      }
    });

    // Update issue count in toolbar
    this.editor.updateIssueCount();
  }

  /**
   * Dismiss an indicator
   * 
   * @param gapId - Gap identifier
   * @param gap - Optional validation gap for dialog
   */
  async dismissIndicator(gapId: string, gap?: ValidationGap): Promise<void> {
    if (gap) {
      // Show dismissal dialog
      const result = await this.acknowledgmentManager.showDismissalDialog(gapId, gap);
      if (result.dismissed) {
        this.updateValidationStatus(gapId, 'dismissed');
      }
    } else {
      // Direct dismissal without dialog
      this.acknowledgmentManager.dismissIndicator(gapId);
      this.updateValidationStatus(gapId, 'dismissed');
    }
  }

  /**
   * Acknowledge an indicator
   * 
   * @param gapId - Gap identifier
   * @param gap - Validation gap for dialog
   */
  async acknowledgeIndicator(gapId: string, gap: ValidationGap): Promise<void> {
    const result = await this.acknowledgmentManager.showAcknowledgmentDialog(gapId, gap);
    if (result.acknowledged) {
      this.updateValidationStatus(gapId, 'acknowledged');
    }
  }

  /**
   * Handle acknowledgment status change
   * 
   * @param gapId - Gap identifier
   * @param status - New status
   * @param reason - Reason for change
   */
  private handleAcknowledgmentChange(gapId: string, status: 'acknowledged' | 'dismissed', reason: string): void {
    // Find all decorations for this gap
    const decorations = Array.from(this.decorations.values()).filter(d => d.gapId === gapId);
    
    decorations.forEach(decoration => {
      if (status === 'dismissed') {
        // Remove the decoration element
        decoration.element.classList.add('removing');
        setTimeout(() => {
          decoration.element.remove();
          this.decorations.delete(decoration.id);
          this.editor.updateIssueCount();
        }, 300);
      } else if (status === 'acknowledged') {
        // Update visual state
        decoration.element.classList.add('acknowledged');
        decoration.status = 'acknowledged';
      }
    });
  }

  /**
   * Show dismissed items panel
   */
  showDismissedPanel(): void {
    if (!this.validationResults) return;

    const container = document.body;
    this.acknowledgmentManager.showDismissedPanel(this.validationResults.gaps, container);
  }

  /**
   * Hide dismissed items panel
   */
  hideDismissedPanel(): void {
    this.acknowledgmentManager.hideDismissedPanel();
  }

  /**
   * Get acknowledgment manager
   */
  getAcknowledgmentManager(): AcknowledgmentManager {
    return this.acknowledgmentManager;
  }

  /**
   * Setup auto-update on content changes
   */
  private setupAutoUpdate(): void {
    // Listen to editor changes
    const editorElement = this.editor.getEditorElement();
    
    editorElement.addEventListener('input', () => {
      this.scheduleValidationUpdate();
    });
  }

  /**
   * Schedule validation update with debouncing
   */
  scheduleValidationUpdate(): void {
    if (this.updateTimeout !== null) {
      clearTimeout(this.updateTimeout);
    }
    
    this.updateTimeout = window.setTimeout(() => {
      this.performValidationUpdate();
    }, this.config.debounceMs);
  }

  /**
   * Perform validation update
   */
  private performValidationUpdate(): void {
    // In a real implementation, this would trigger a new validation
    // For now, we'll just check if sections have been added
    const content = this.editorElement.innerHTML;
    
    // Check each decoration to see if it should be removed
    this.decorations.forEach((decoration, id) => {
      if (decoration.type === 'placeholder_hint') {
        const sectionExists = this.checkSectionExists(decoration.gapId, content);
        if (sectionExists) {
          this.updateValidationStatus(decoration.gapId, 'fixed');
        }
      }
    });

    // Update issue count in toolbar
    this.editor.updateIssueCount();
  }

  /**
   * Clear all decorations
   */
  clearAllDecorations(): void {
    this.decorations.forEach(decoration => {
      decoration.element.remove();
    });
    this.decorations.clear();
  }

  /**
   * Detach from editor
   */
  detachFromEditor(): void {
    this.clearAllDecorations();
    
    if (this.updateTimeout !== null) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
    
    this.validationResults = null;
  }

  /**
   * Get current decorations
   */
  getDecorations(): EditorDecoration[] {
    return Array.from(this.decorations.values());
  }

  /**
   * Get decorations by type
   */
  getDecorationsByType(type: 'missing_content' | 'format_error' | 'placeholder_hint'): EditorDecoration[] {
    return this.getDecorations().filter(d => d.type === type);
  }

  /**
   * Get decorations by severity
   */
  getDecorationsBySeverity(severity: 'critical' | 'warning' | 'info'): EditorDecoration[] {
    return this.getDecorations().filter(d => d.severity === severity);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ValidationIndicatorConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Re-render decorations with new config
    if (this.validationResults) {
      this.attachToEditor(this.validationResults);
    }
  }

  /**
   * Get configuration
   */
  getConfig(): ValidationIndicatorConfig {
    return { ...this.config };
  }

  /**
   * Get indicator groups
   */
  getIndicatorGroups(): Map<string, IndicatorGroup> {
    return this.indicatorGroups;
  }
}
