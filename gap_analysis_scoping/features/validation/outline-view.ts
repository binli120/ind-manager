/**
 * Outline View for Blank Documents
 * 
 * Displays a structured outline of all required sections from the template
 * when a document is blank or has minimal content. Provides progress tracking
 * and template insertion functionality.
 */

import { ValidationGap, AnalysisResult } from './document-analyzer';
import { ValidationRuleSet, ValidationRule } from './template-parser';

export interface OutlineSection {
  id: string;
  title: string;
  required: boolean;
  status: 'complete' | 'incomplete' | 'partial';
  severity: 'critical' | 'warning' | 'info';
  subsections: OutlineSection[];
  validationGaps: ValidationGap[];
  position?: number;
  rule?: ValidationRule;
}

export interface OutlineViewData {
  sections: OutlineSection[];
  completenessPercentage: number;
  totalRequired: number;
  totalCompleted: number;
}

/**
 * OutlineView class for rendering structured document outlines
 * Displays hierarchical section structure with validation status
 */
export class OutlineView {
  private container: HTMLElement;
  private outlineData: OutlineViewData | null = null;
  private expandedSections: Set<string> = new Set();
  private onInsertSection?: (sectionId: string) => void;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Render outline view from template and validation results
   * @param template - ValidationRuleSet with all rules
   * @param analysisResult - Current validation analysis result
   * @param onInsertSection - Callback when user clicks "Insert Template"
   */
  render(
    template: ValidationRuleSet,
    analysisResult: AnalysisResult,
    onInsertSection?: (sectionId: string) => void
  ): void {
    this.onInsertSection = onInsertSection;
    
    // Generate outline data from template and analysis
    this.outlineData = this.generateOutlineData(template, analysisResult);
    
    // Clear container
    this.container.innerHTML = '';
    
    // Create outline view HTML
    const outlineElement = this.createOutlineElement(this.outlineData);
    this.container.appendChild(outlineElement);
    
    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Generate outline data structure from template and validation results
   */
  private generateOutlineData(
    template: ValidationRuleSet,
    analysisResult: AnalysisResult
  ): OutlineViewData {
    // Group rules by section hierarchy
    const sectionMap = new Map<string, OutlineSection>();
    const rootSections: OutlineSection[] = [];
    
    // Filter content_presence rules for outline structure
    const contentRules = template.rules.filter(r => r.type === 'content_presence');
    
    contentRules.forEach(rule => {
      const sectionId = rule.field;
      const parts = sectionId.split(/[\s-]+/);
      
      // Find gaps for this section
      const gaps = analysisResult.gaps.filter(g => 
        g.ruleId === rule.field || g.ruleId.startsWith(rule.field + '_')
      );
      
      // Determine status
      const hasGaps = gaps.length > 0;
      const status: 'complete' | 'incomplete' | 'partial' = hasGaps ? 'incomplete' : 'complete';
      
      const section: OutlineSection = {
        id: sectionId,
        title: rule.name.replace(' - Content Presence', ''),
        required: rule.required,
        status,
        severity: rule.severity,
        subsections: [],
        validationGaps: gaps,
        rule
      };
      
      sectionMap.set(sectionId, section);
      
      // For now, treat all as root sections (can be enhanced for hierarchy)
      rootSections.push(section);
    });
    
    // Calculate completeness
    const totalRequired = contentRules.filter(r => r.required).length;
    const completedRequired = rootSections.filter(s => 
      s.required && s.status === 'complete'
    ).length;
    
    const completenessPercentage = totalRequired > 0 
      ? Math.round((completedRequired / totalRequired) * 100)
      : 0;
    
    return {
      sections: rootSections,
      completenessPercentage,
      totalRequired,
      totalCompleted: completedRequired
    };
  }

  /**
   * Create HTML element for outline view
   */
  private createOutlineElement(data: OutlineViewData): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'outline-view';
    
    // Header with progress
    const header = document.createElement('div');
    header.className = 'outline-header';
    header.innerHTML = `
      <h3>Gap Analysis Completeness: ${data.completenessPercentage}% (${data.totalCompleted}/${data.totalRequired} required sections)</h3>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${data.completenessPercentage}%"></div>
      </div>
    `;
    wrapper.appendChild(header);
    
    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'outline-toolbar';
    toolbar.innerHTML = `
      <button class="btn-show-required" data-action="toggle-required">Show Only Required</button>
      <button class="btn-expand-all" data-action="expand-all">Expand All</button>
      <button class="btn-collapse-all" data-action="collapse-all">Collapse All</button>
    `;
    wrapper.appendChild(toolbar);
    
    // Sections list
    const sectionsList = document.createElement('div');
    sectionsList.className = 'outline-sections';
    
    data.sections.forEach(section => {
      const sectionElement = this.createSectionElement(section, 0);
      sectionsList.appendChild(sectionElement);
    });
    
    wrapper.appendChild(sectionsList);
    
    return wrapper;
  }

  /**
   * Create HTML element for a single section
   */
  private createSectionElement(section: OutlineSection, level: number): HTMLElement {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = `outline-section level-${level}`;
    sectionDiv.dataset.sectionId = section.id;
    
    // Severity icon
    const icon = this.getSeverityIcon(section.severity, section.status);
    
    // Required badge
    const requiredBadge = section.required 
      ? '<span class="badge-required">Required</span>' 
      : '<span class="badge-optional">Optional</span>';
    
    // Gap count
    const gapCount = section.validationGaps.length;
    const gapBadge = gapCount > 0 
      ? `<span class="badge-gaps">${gapCount} issue${gapCount > 1 ? 's' : ''}</span>`
      : '';
    
    // Expand/collapse button (if has subsections)
    const hasSubsections = section.subsections.length > 0;
    const isExpanded = this.expandedSections.has(section.id);
    const expandButton = hasSubsections
      ? `<button class="btn-expand" data-action="toggle-expand">${isExpanded ? '▼' : '▶'}</button>`
      : '<span class="expand-spacer"></span>';
    
    // Section header
    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
      ${expandButton}
      <span class="section-icon">${icon}</span>
      <span class="section-title">${section.title}</span>
      ${requiredBadge}
      ${gapBadge}
      <button class="btn-insert" data-action="insert-section">Insert Template</button>
    `;
    sectionDiv.appendChild(header);
    
    // Subsections (if expanded)
    if (hasSubsections && isExpanded) {
      const subsectionsDiv = document.createElement('div');
      subsectionsDiv.className = 'section-subsections';
      
      section.subsections.forEach(subsection => {
        const subsectionElement = this.createSectionElement(subsection, level + 1);
        subsectionsDiv.appendChild(subsectionElement);
      });
      
      sectionDiv.appendChild(subsectionsDiv);
    }
    
    return sectionDiv;
  }

  /**
   * Get severity icon based on status and severity
   */
  private getSeverityIcon(severity: 'critical' | 'warning' | 'info', status: string): string {
    if (status === 'complete') {
      return '✓'; // Checkmark for complete
    }
    
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '○';
    }
  }

  /**
   * Attach event listeners to outline elements
   */
  private attachEventListeners(): void {
    // Toolbar actions
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.dataset.action;
      
      if (!action) return;
      
      switch (action) {
        case 'toggle-required':
          this.toggleRequiredOnly();
          break;
        case 'expand-all':
          this.expandAll();
          break;
        case 'collapse-all':
          this.collapseAll();
          break;
        case 'toggle-expand':
          this.toggleExpand(target);
          break;
        case 'insert-section':
          this.handleInsertSection(target);
          break;
      }
    });
  }

  /**
   * Toggle showing only required sections
   */
  private toggleRequiredOnly(): void {
    const sections = this.container.querySelectorAll('.outline-section');
    const button = this.container.querySelector('.btn-show-required') as HTMLButtonElement;
    const isFiltering = button.textContent === 'Show Only Required';
    
    sections.forEach(section => {
      const sectionElement = section as HTMLElement;
      const header = sectionElement.querySelector('.section-header');
      const isRequired = header?.querySelector('.badge-required') !== null;
      
      if (isFiltering && !isRequired) {
        sectionElement.style.display = 'none';
      } else {
        sectionElement.style.display = '';
      }
    });
    
    button.textContent = isFiltering ? 'Show All Sections' : 'Show Only Required';
  }

  /**
   * Expand all sections
   */
  private expandAll(): void {
    if (!this.outlineData) return;
    
    const allSectionIds = this.getAllSectionIds(this.outlineData.sections);
    allSectionIds.forEach(id => this.expandedSections.add(id));
    
    // Re-render
    if (this.outlineData) {
      this.render(
        { name: '', templateType: 'json', rules: [] }, 
        { 
          documentName: '', 
          templateName: '', 
          completenessPercentage: 0, 
          gaps: [], 
          analysisDate: new Date(), 
          processingTime: 0 
        }
      );
    }
  }

  /**
   * Collapse all sections
   */
  private collapseAll(): void {
    this.expandedSections.clear();
    
    // Re-render
    if (this.outlineData) {
      this.render(
        { name: '', templateType: 'json', rules: [] }, 
        { 
          documentName: '', 
          templateName: '', 
          completenessPercentage: 0, 
          gaps: [], 
          analysisDate: new Date(), 
          processingTime: 0 
        }
      );
    }
  }

  /**
   * Toggle expand/collapse for a section
   */
  private toggleExpand(button: HTMLElement): void {
    const sectionElement = button.closest('.outline-section') as HTMLElement;
    const sectionId = sectionElement.dataset.sectionId;
    
    if (!sectionId) return;
    
    if (this.expandedSections.has(sectionId)) {
      this.expandedSections.delete(sectionId);
    } else {
      this.expandedSections.add(sectionId);
    }
    
    // Update button
    button.textContent = this.expandedSections.has(sectionId) ? '▼' : '▶';
    
    // Toggle subsections visibility
    const subsections = sectionElement.querySelector('.section-subsections');
    if (subsections) {
      (subsections as HTMLElement).style.display = 
        this.expandedSections.has(sectionId) ? '' : 'none';
    }
  }

  /**
   * Handle insert section button click
   */
  private handleInsertSection(button: HTMLElement): void {
    const sectionElement = button.closest('.outline-section') as HTMLElement;
    const sectionId = sectionElement.dataset.sectionId;
    
    if (sectionId && this.onInsertSection) {
      this.onInsertSection(sectionId);
    }
  }

  /**
   * Get all section IDs recursively
   */
  private getAllSectionIds(sections: OutlineSection[]): string[] {
    const ids: string[] = [];
    
    sections.forEach(section => {
      ids.push(section.id);
      if (section.subsections.length > 0) {
        ids.push(...this.getAllSectionIds(section.subsections));
      }
    });
    
    return ids;
  }

  /**
   * Update outline with new analysis results
   */
  updateAnalysis(analysisResult: AnalysisResult): void {
    if (!this.outlineData) return;
    
    // Update section statuses based on new analysis
    this.updateSectionStatuses(this.outlineData.sections, analysisResult);
    
    // Recalculate completeness
    const totalRequired = this.outlineData.totalRequired;
    const completedRequired = this.countCompletedSections(this.outlineData.sections);
    
    this.outlineData.completenessPercentage = totalRequired > 0
      ? Math.round((completedRequired / totalRequired) * 100)
      : 0;
    this.outlineData.totalCompleted = completedRequired;
    
    // Update progress bar
    const progressFill = this.container.querySelector('.progress-fill') as HTMLElement;
    if (progressFill) {
      progressFill.style.width = `${this.outlineData.completenessPercentage}%`;
    }
    
    // Update header text
    const header = this.container.querySelector('.outline-header h3');
    if (header) {
      header.textContent = `Gap Analysis Completeness: ${this.outlineData.completenessPercentage}% (${this.outlineData.totalCompleted}/${this.outlineData.totalRequired} required sections)`;
    }
    
    // Update section icons and badges
    this.updateSectionElements(this.outlineData.sections);
  }

  /**
   * Update section statuses recursively
   */
  private updateSectionStatuses(sections: OutlineSection[], analysisResult: AnalysisResult): void {
    sections.forEach(section => {
      // Find gaps for this section
      const gaps = analysisResult.gaps.filter(g => 
        g.ruleId === section.id || g.ruleId.startsWith(section.id + '_')
      );
      
      section.validationGaps = gaps;
      section.status = gaps.length > 0 ? 'incomplete' : 'complete';
      
      // Update subsections
      if (section.subsections.length > 0) {
        this.updateSectionStatuses(section.subsections, analysisResult);
      }
    });
  }

  /**
   * Count completed required sections
   */
  private countCompletedSections(sections: OutlineSection[]): number {
    let count = 0;
    
    sections.forEach(section => {
      if (section.required && section.status === 'complete') {
        count++;
      }
      
      if (section.subsections.length > 0) {
        count += this.countCompletedSections(section.subsections);
      }
    });
    
    return count;
  }

  /**
   * Update section elements in DOM
   */
  private updateSectionElements(sections: OutlineSection[]): void {
    sections.forEach(section => {
      const sectionElement = this.container.querySelector(
        `.outline-section[data-section-id="${section.id}"]`
      ) as HTMLElement;
      
      if (!sectionElement) return;
      
      // Update icon
      const iconElement = sectionElement.querySelector('.section-icon');
      if (iconElement) {
        iconElement.textContent = this.getSeverityIcon(section.severity, section.status);
      }
      
      // Update gap badge
      const gapBadge = sectionElement.querySelector('.badge-gaps');
      const gapCount = section.validationGaps.length;
      
      if (gapCount > 0) {
        if (gapBadge) {
          gapBadge.textContent = `${gapCount} issue${gapCount > 1 ? 's' : ''}`;
        } else {
          const header = sectionElement.querySelector('.section-header');
          if (header) {
            const badge = document.createElement('span');
            badge.className = 'badge-gaps';
            badge.textContent = `${gapCount} issue${gapCount > 1 ? 's' : ''}`;
            header.appendChild(badge);
          }
        }
      } else if (gapBadge) {
        gapBadge.remove();
      }
      
      // Update subsections
      if (section.subsections.length > 0) {
        this.updateSectionElements(section.subsections);
      }
    });
  }
}