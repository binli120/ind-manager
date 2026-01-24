/**
 * HTML Editor with ContentEditable
 * 
 * Simple rich text editor using contenteditable for in-editor validation demo.
 * Provides basic formatting toolbar and content change detection.
 */

export interface EditorConfig {
  containerId: string;
  toolbarId: string;
  placeholder?: string;
  onChange?: (content: string) => void;
  onSelectionChange?: (selection: Selection | null) => void;
}

export interface EditorState {
  content: string;
  isDirty: boolean;
  lastSaved?: Date;
}

/**
 * HTMLEditor class for contenteditable-based rich text editing
 * Provides basic formatting controls and change detection
 */
export class HTMLEditor {
  private container: HTMLElement;
  private toolbar: HTMLElement;
  private editor: HTMLDivElement;
  private config: EditorConfig;
  private state: EditorState;
  private changeCallback?: (content: string) => void;
  private selectionCallback?: (selection: Selection | null) => void;
  private validationManager?: any; // Reference to InEditorValidationManager

  constructor(config: EditorConfig) {
    this.config = config;
    this.state = {
      content: '',
      isDirty: false
    };

    // Get container and toolbar elements
    const container = document.getElementById(config.containerId);
    const toolbar = document.getElementById(config.toolbarId);

    if (!container) {
      throw new Error(`Container element with id "${config.containerId}" not found`);
    }

    if (!toolbar) {
      throw new Error(`Toolbar element with id "${config.toolbarId}" not found`);
    }

    this.container = container;
    this.toolbar = toolbar;
    this.changeCallback = config.onChange;
    this.selectionCallback = config.onSelectionChange;

    // Create editor element
    this.editor = this.createEditorElement();
    
    // Initialize editor
    this.initialize();
  }

  /**
   * Create the contenteditable editor element
   */
  private createEditorElement(): HTMLDivElement {
    const editor = document.createElement('div');
    editor.className = 'html-editor-content';
    editor.contentEditable = 'true';
    editor.setAttribute('role', 'textbox');
    editor.setAttribute('aria-multiline', 'true');
    editor.setAttribute('aria-label', 'Document editor');
    
    if (this.config.placeholder) {
      editor.setAttribute('data-placeholder', this.config.placeholder);
    }

    return editor;
  }

  /**
   * Initialize the editor
   */
  private initialize(): void {
    // Append editor to container
    this.container.appendChild(this.editor);

    // Create toolbar buttons
    this.createToolbar();

    // Attach event listeners
    this.attachEventListeners();

    // Set initial focus
    this.editor.focus();
  }

  /**
   * Create toolbar with formatting buttons
   */
  private createToolbar(): void {
    const buttons = [
      { command: 'bold', icon: 'B', title: 'Bold (Ctrl+B)', className: 'btn-bold' },
      { command: 'italic', icon: 'I', title: 'Italic (Ctrl+I)', className: 'btn-italic' },
      { command: 'underline', icon: 'U', title: 'Underline (Ctrl+U)', className: 'btn-underline' },
      { command: 'separator', icon: '|', title: '', className: 'separator' },
      { command: 'formatBlock:h1', icon: 'H1', title: 'Heading 1', className: 'btn-h1' },
      { command: 'formatBlock:h2', icon: 'H2', title: 'Heading 2', className: 'btn-h2' },
      { command: 'formatBlock:h3', icon: 'H3', title: 'Heading 3', className: 'btn-h3' },
      { command: 'formatBlock:p', icon: 'P', title: 'Paragraph', className: 'btn-p' },
      { command: 'separator', icon: '|', title: '', className: 'separator' },
      { command: 'insertUnorderedList', icon: '• List', title: 'Bullet List', className: 'btn-ul' },
      { command: 'insertOrderedList', icon: '1. List', title: 'Numbered List', className: 'btn-ol' },
      { command: 'separator', icon: '|', title: '', className: 'separator' },
      { command: 'removeFormat', icon: 'Clear', title: 'Clear Formatting', className: 'btn-clear' }
    ];

    this.toolbar.innerHTML = '';
    this.toolbar.className = 'html-editor-toolbar';

    // Add formatting buttons
    buttons.forEach(btn => {
      if (btn.command === 'separator') {
        const separator = document.createElement('span');
        separator.className = 'toolbar-separator';
        separator.textContent = btn.icon;
        this.toolbar.appendChild(separator);
      } else {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `toolbar-btn ${btn.className}`;
        button.title = btn.title;
        button.textContent = btn.icon;
        button.setAttribute('data-command', btn.command);
        
        button.addEventListener('click', (e) => {
          e.preventDefault();
          this.executeCommand(btn.command);
          this.editor.focus();
        });

        this.toolbar.appendChild(button);
      }
    });

    // Add validation controls section
    this.createValidationControls();
  }

  /**
   * Create validation toolbar controls
   */
  private createValidationControls(): void {
    // Add separator
    const separator = document.createElement('span');
    separator.className = 'toolbar-separator';
    separator.textContent = '|';
    this.toolbar.appendChild(separator);

    // Validation toggle button with badge
    const validationToggle = document.createElement('button');
    validationToggle.type = 'button';
    validationToggle.className = 'toolbar-btn btn-validation-toggle';
    validationToggle.id = 'validationToggleBtn';
    validationToggle.title = 'Toggle Validation Indicators';
    validationToggle.innerHTML = `
      <span class="btn-icon">✓</span>
      <span class="btn-label">Validation</span>
      <span class="validation-badge" id="validationBadge">0</span>
    `;
    this.toolbar.appendChild(validationToggle);

    // Severity filter dropdown
    const severityFilter = document.createElement('div');
    severityFilter.className = 'toolbar-dropdown';
    severityFilter.innerHTML = `
      <button type="button" class="toolbar-btn btn-severity-filter" id="severityFilterBtn" title="Filter by Severity">
        <span class="btn-icon">⚠</span>
        <span class="btn-label">Filter</span>
        <span class="dropdown-arrow">▼</span>
      </button>
      <div class="dropdown-menu" id="severityFilterMenu">
        <label class="dropdown-item">
          <input type="checkbox" class="severity-checkbox" value="critical" checked>
          <span class="severity-label severity-critical">🔴 Critical</span>
        </label>
        <label class="dropdown-item">
          <input type="checkbox" class="severity-checkbox" value="warning" checked>
          <span class="severity-label severity-warning">⚠️ Warning</span>
        </label>
        <label class="dropdown-item">
          <input type="checkbox" class="severity-checkbox" value="info" checked>
          <span class="severity-label severity-info">ℹ️ Info</span>
        </label>
        <div class="dropdown-divider"></div>
        <button type="button" class="dropdown-action" id="showCriticalOnlyBtn">Show Critical Only</button>
        <button type="button" class="dropdown-action" id="showAllBtn">Show All</button>
      </div>
    `;
    this.toolbar.appendChild(severityFilter);

    // Jump to next issue button
    const jumpToNext = document.createElement('button');
    jumpToNext.type = 'button';
    jumpToNext.className = 'toolbar-btn btn-jump-next';
    jumpToNext.id = 'jumpToNextBtn';
    jumpToNext.title = 'Jump to Next Issue (F8)';
    jumpToNext.innerHTML = `
      <span class="btn-icon">→</span>
      <span class="btn-label">Next Issue</span>
    `;
    jumpToNext.disabled = true;
    this.toolbar.appendChild(jumpToNext);

    // Jump to previous issue button
    const jumpToPrev = document.createElement('button');
    jumpToPrev.type = 'button';
    jumpToPrev.className = 'toolbar-btn btn-jump-prev';
    jumpToPrev.id = 'jumpToPrevBtn';
    jumpToPrev.title = 'Jump to Previous Issue (Shift+F8)';
    jumpToPrev.innerHTML = `
      <span class="btn-icon">←</span>
      <span class="btn-label">Prev Issue</span>
    `;
    jumpToPrev.disabled = true;
    this.toolbar.appendChild(jumpToPrev);

    // Add separator
    const separator2 = document.createElement('span');
    separator2.className = 'toolbar-separator';
    separator2.textContent = '|';
    this.toolbar.appendChild(separator2);

    // Dismissed items button
    const dismissedItemsBtn = document.createElement('button');
    dismissedItemsBtn.type = 'button';
    dismissedItemsBtn.className = 'toolbar-btn btn-dismissed-items';
    dismissedItemsBtn.id = 'dismissedItemsBtn';
    dismissedItemsBtn.title = 'View Dismissed & Acknowledged Items';
    dismissedItemsBtn.innerHTML = `
      <span class="btn-icon">📋</span>
      <span class="btn-label">Dismissed Items</span>
    `;
    this.toolbar.appendChild(dismissedItemsBtn);

    // Attach event listeners for validation controls
    this.attachValidationControlListeners();
  }

  /**
   * Attach event listeners for validation controls
   */
  private attachValidationControlListeners(): void {
    // Validation toggle
    const validationToggle = document.getElementById('validationToggleBtn');
    if (validationToggle) {
      validationToggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleValidationDisplay();
      });
    }

    // Severity filter dropdown
    const severityFilterBtn = document.getElementById('severityFilterBtn');
    const severityFilterMenu = document.getElementById('severityFilterMenu');
    
    if (severityFilterBtn && severityFilterMenu) {
      severityFilterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        severityFilterMenu.classList.toggle('show');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!severityFilterBtn.contains(e.target as Node) && !severityFilterMenu.contains(e.target as Node)) {
          severityFilterMenu.classList.remove('show');
        }
      });

      // Handle checkbox changes
      const checkboxes = severityFilterMenu.querySelectorAll('.severity-checkbox');
      checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
          this.handleSeverityFilterChange();
        });
      });

      // Show Critical Only button
      const showCriticalOnlyBtn = document.getElementById('showCriticalOnlyBtn');
      if (showCriticalOnlyBtn) {
        showCriticalOnlyBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.showCriticalOnly();
          severityFilterMenu.classList.remove('show');
        });
      }

      // Show All button
      const showAllBtn = document.getElementById('showAllBtn');
      if (showAllBtn) {
        showAllBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.showAllSeverities();
          severityFilterMenu.classList.remove('show');
        });
      }
    }

    // Jump to next issue
    const jumpToNext = document.getElementById('jumpToNextBtn');
    if (jumpToNext) {
      jumpToNext.addEventListener('click', (e) => {
        e.preventDefault();
        this.jumpToNextIssue();
      });
    }

    // Jump to previous issue
    const jumpToPrev = document.getElementById('jumpToPrevBtn');
    if (jumpToPrev) {
      jumpToPrev.addEventListener('click', (e) => {
        e.preventDefault();
        this.jumpToPreviousIssue();
      });
    }

    // Keyboard shortcuts for navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F8') {
        e.preventDefault();
        if (e.shiftKey) {
          this.jumpToPreviousIssue();
        } else {
          this.jumpToNextIssue();
        }
      }
    });

    // Dismissed items button
    const dismissedItemsBtn = document.getElementById('dismissedItemsBtn');
    if (dismissedItemsBtn) {
      dismissedItemsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showDismissedPanel();
      });
    }
  }

  /**
   * Show dismissed items panel
   */
  private showDismissedPanel(): void {
    if (this.validationManager) {
      this.validationManager.showDismissedPanel();
    }
  }

  /**
   * Show critical issues only (progressive disclosure)
   */
  private showCriticalOnly(): void {
    // Dispatch custom event for validation manager
    const event = new CustomEvent('validation:showCriticalOnly');
    document.dispatchEvent(event);
    
    // If validation manager is set, call directly
    if (this.validationManager) {
      this.validationManager.showCriticalOnly();
    }
  }

  /**
   * Show all severity levels
   */
  private showAllSeverities(): void {
    // Dispatch custom event for validation manager
    const event = new CustomEvent('validation:showAll');
    document.dispatchEvent(event);
    
    // If validation manager is set, call directly
    if (this.validationManager) {
      this.validationManager.showAllSeverities();
    }
  }

  /**
   * Set validation manager reference
   */
  setValidationManager(manager: any): void {
    this.validationManager = manager;
  }

  /**
   * Get indicator groups from validation manager
   */
  private get indicatorGroups(): Map<string, any> {
    return this.validationManager?.getIndicatorGroups() || new Map();
  }

  /**
   * Toggle group expansion via validation manager
   */
  private toggleGroupExpansion(sectionId: string): void {
    if (this.validationManager) {
      this.validationManager.toggleGroupExpansion(sectionId);
    }
  }

  /**
   * Toggle validation indicator display
   */
  private toggleValidationDisplay(): void {
    const validationToggle = document.getElementById('validationToggleBtn');
    const indicators = this.editor.querySelectorAll('.validation-placeholder, .validation-error');
    
    if (validationToggle) {
      const isActive = validationToggle.classList.toggle('active');
      
      indicators.forEach(indicator => {
        if (isActive) {
          (indicator as HTMLElement).style.display = '';
        } else {
          (indicator as HTMLElement).style.display = 'none';
        }
      });
    }
  }

  /**
   * Handle severity filter changes
   */
  private handleSeverityFilterChange(): void {
    const checkboxes = document.querySelectorAll('.severity-checkbox') as NodeListOf<HTMLInputElement>;
    const selectedSeverities = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    // Update visibility of validation indicators
    const indicators = this.editor.querySelectorAll('.validation-placeholder, .validation-error');
    indicators.forEach(indicator => {
      const severity = indicator.getAttribute('data-severity');
      if (severity && selectedSeverities.includes(severity)) {
        (indicator as HTMLElement).style.display = '';
      } else {
        (indicator as HTMLElement).style.display = 'none';
      }
    });

    // Update issue count
    this.updateIssueCount();
  }

  /**
   * Jump to next validation issue
   */
  private jumpToNextIssue(): void {
    const indicators = Array.from(this.editor.querySelectorAll('.validation-placeholder, .validation-error, .validation-group'))
      .filter(el => (el as HTMLElement).style.display !== 'none') as HTMLElement[];
    
    if (indicators.length === 0) return;

    // Find current scroll position
    const scrollTop = this.editor.scrollTop;
    const editorTop = this.editor.getBoundingClientRect().top;

    // Find next indicator below current scroll position
    let nextIndicator: HTMLElement | null = null;
    for (const indicator of indicators) {
      const indicatorTop = indicator.getBoundingClientRect().top - editorTop + scrollTop;
      if (indicatorTop > scrollTop + 50) {
        nextIndicator = indicator;
        break;
      }
    }

    // If no indicator found below, wrap to first
    if (!nextIndicator && indicators.length > 0) {
      nextIndicator = indicators[0];
    }

    // Scroll to indicator
    if (nextIndicator) {
      nextIndicator.scrollIntoView({ behavior: 'smooth', block: 'center' });
      nextIndicator.classList.add('highlight-flash');
      
      // If it's a collapsed group, expand it
      if (nextIndicator.classList.contains('validation-group')) {
        const sectionId = nextIndicator.getAttribute('data-section-id');
        if (sectionId) {
          const group = this.indicatorGroups.get(sectionId);
          if (group && !group.isExpanded) {
            this.toggleGroupExpansion(sectionId);
          }
        }
      }
      
      setTimeout(() => {
        nextIndicator?.classList.remove('highlight-flash');
      }, 1000);
    }
  }

  /**
   * Jump to previous validation issue
   */
  private jumpToPreviousIssue(): void {
    const indicators = Array.from(this.editor.querySelectorAll('.validation-placeholder, .validation-error, .validation-group'))
      .filter(el => (el as HTMLElement).style.display !== 'none') as HTMLElement[];
    
    if (indicators.length === 0) return;

    // Find current scroll position
    const scrollTop = this.editor.scrollTop;
    const editorTop = this.editor.getBoundingClientRect().top;

    // Find previous indicator above current scroll position
    let prevIndicator: HTMLElement | null = null;
    for (let i = indicators.length - 1; i >= 0; i--) {
      const indicator = indicators[i];
      const indicatorTop = indicator.getBoundingClientRect().top - editorTop + scrollTop;
      if (indicatorTop < scrollTop - 50) {
        prevIndicator = indicator;
        break;
      }
    }

    // If no indicator found above, wrap to last
    if (!prevIndicator && indicators.length > 0) {
      prevIndicator = indicators[indicators.length - 1];
    }

    // Scroll to indicator
    if (prevIndicator) {
      prevIndicator.scrollIntoView({ behavior: 'smooth', block: 'center' });
      prevIndicator.classList.add('highlight-flash');
      
      // If it's a collapsed group, expand it
      if (prevIndicator.classList.contains('validation-group')) {
        const sectionId = prevIndicator.getAttribute('data-section-id');
        if (sectionId) {
          const group = this.indicatorGroups.get(sectionId);
          if (group && !group.isExpanded) {
            this.toggleGroupExpansion(sectionId);
          }
        }
      }
      
      setTimeout(() => {
        prevIndicator?.classList.remove('highlight-flash');
      }, 1000);
    }
  }

  /**
   * Update issue count badge
   */
  updateIssueCount(): void {
    const badge = document.getElementById('validationBadge');
    const jumpToNext = document.getElementById('jumpToNextBtn');
    const jumpToPrev = document.getElementById('jumpToPrevBtn');
    
    if (badge) {
      // Count visible indicators (including those in groups)
      const visibleGroups = Array.from(this.editor.querySelectorAll('.validation-group'))
        .filter(el => (el as HTMLElement).style.display !== 'none');
      
      const visibleIndividualIndicators = Array.from(this.editor.querySelectorAll('.validation-placeholder, .validation-error'))
        .filter(el => {
          const parent = (el as HTMLElement).closest('.validation-group');
          return !parent && (el as HTMLElement).style.display !== 'none';
        });
      
      // Count total issues in visible groups
      let groupIssueCount = 0;
      visibleGroups.forEach(group => {
        const sectionId = group.getAttribute('data-section-id');
        if (sectionId) {
          const indicatorGroup = this.indicatorGroups.get(sectionId);
          if (indicatorGroup) {
            groupIssueCount += indicatorGroup.indicators.length;
          }
        }
      });
      
      const count = groupIssueCount + visibleIndividualIndicators.length;
      badge.textContent = count.toString();
      
      // Update badge visibility
      if (count > 0) {
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }

      // Enable/disable navigation buttons
      if (jumpToNext) {
        jumpToNext.disabled = count === 0;
      }
      if (jumpToPrev) {
        jumpToPrev.disabled = count === 0;
      }
    }
  }

  /**
   * Execute a formatting command
   */
  private executeCommand(command: string): void {
    if (command.startsWith('formatBlock:')) {
      const tag = command.split(':')[1];
      document.execCommand('formatBlock', false, tag);
    } else {
      document.execCommand(command, false);
    }

    // Update toolbar button states
    this.updateToolbarState();

    // Trigger change callback
    this.handleContentChange();
  }

  /**
   * Attach event listeners to editor
   */
  private attachEventListeners(): void {
    // Content change detection
    this.editor.addEventListener('input', () => {
      this.handleContentChange();
    });

    // Selection change for toolbar updates
    this.editor.addEventListener('mouseup', () => {
      this.handleSelectionChange();
    });

    this.editor.addEventListener('keyup', () => {
      this.handleSelectionChange();
    });

    // Keyboard shortcuts
    this.editor.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });

    // Prevent default behavior for some keys
    this.editor.addEventListener('keydown', (e) => {
      // Prevent Tab from leaving editor
      if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
      }
    });

    // Update placeholder visibility
    this.editor.addEventListener('blur', () => {
      this.updatePlaceholder();
    });

    this.editor.addEventListener('focus', () => {
      this.updatePlaceholder();
    });
  }

  /**
   * Handle content changes
   */
  private handleContentChange(): void {
    const content = this.editor.innerHTML;
    this.state.content = content;
    this.state.isDirty = true;

    // Update placeholder
    this.updatePlaceholder();

    // Call change callback
    if (this.changeCallback) {
      this.changeCallback(content);
    }
  }

  /**
   * Handle selection changes
   */
  private handleSelectionChange(): void {
    const selection = window.getSelection();
    
    // Update toolbar state
    this.updateToolbarState();

    // Call selection callback
    if (this.selectionCallback) {
      this.selectionCallback(selection);
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  private handleKeyboardShortcuts(e: KeyboardEvent): void {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          this.executeCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          this.executeCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          this.executeCommand('underline');
          break;
      }
    }
  }

  /**
   * Update toolbar button states based on current selection
   */
  private updateToolbarState(): void {
    const commands = ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList'];
    
    commands.forEach(command => {
      const button = this.toolbar.querySelector(`[data-command="${command}"]`);
      if (button) {
        const isActive = document.queryCommandState(command);
        if (isActive) {
          button.classList.add('active');
        } else {
          button.classList.remove('active');
        }
      }
    });
  }

  /**
   * Update placeholder visibility
   */
  private updatePlaceholder(): void {
    const isEmpty = this.editor.textContent?.trim() === '';
    
    if (isEmpty) {
      this.editor.classList.add('empty');
    } else {
      this.editor.classList.remove('empty');
    }
  }

  /**
   * Get current editor content
   */
  getContent(): string {
    return this.editor.innerHTML;
  }

  /**
   * Get plain text content
   */
  getTextContent(): string {
    return this.editor.textContent || '';
  }

  /**
   * Set editor content
   */
  setContent(html: string): void {
    this.editor.innerHTML = html;
    this.state.content = html;
    this.state.isDirty = false;
    this.updatePlaceholder();
  }

  /**
   * Clear editor content
   */
  clear(): void {
    this.editor.innerHTML = '';
    this.state.content = '';
    this.state.isDirty = false;
    this.updatePlaceholder();
  }

  /**
   * Get editor state
   */
  getState(): EditorState {
    return { ...this.state };
  }

  /**
   * Check if editor has unsaved changes
   */
  isDirty(): boolean {
    return this.state.isDirty;
  }

  /**
   * Mark content as saved
   */
  markAsSaved(): void {
    this.state.isDirty = false;
    this.state.lastSaved = new Date();
  }

  /**
   * Get the editor element
   */
  getEditorElement(): HTMLDivElement {
    return this.editor;
  }

  /**
   * Focus the editor
   */
  focus(): void {
    this.editor.focus();
  }

  /**
   * Blur the editor
   */
  blur(): void {
    this.editor.blur();
  }

  /**
   * Destroy the editor and clean up
   */
  destroy(): void {
    // Remove editor from DOM
    this.editor.remove();
    
    // Clear toolbar
    this.toolbar.innerHTML = '';
    
    // Clear callbacks
    this.changeCallback = undefined;
    this.selectionCallback = undefined;
  }
}
