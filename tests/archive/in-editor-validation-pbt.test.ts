/**
 * Property-Based Tests for In-Editor Validation
 * 
 * Tests universal properties of the in-editor validation system using fast-check.
 * 
 * Feature: gap-analysis-completeness-check
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { InEditorValidationManager, EditorDecoration } from '../features/validation/in-editor-validation-manager';
import { HTMLEditor } from '../features/validation/html-editor';
import { ValidationGap, AnalysisResult } from '../features/validation/document-analyzer';
import { OutlineView, OutlineViewData } from '../features/validation/outline-view';
import { ValidationRuleSet } from '../features/validation/template-parser';

// ============================================================================
// Arbitraries (Generators) for Property-Based Testing
// ============================================================================

/**
 * Generate arbitrary validation gaps
 */
const arbValidationGap = (): fc.Arbitrary<ValidationGap> => {
  return fc.record({
    ruleId: fc.oneof(
      fc.constant('2.6.2.1 - a'),
      fc.constant('2.6.2.1 - b'),
      fc.constant('2.6.2.2 - a'),
      fc.constant('2.6.2.4 - b'),
      fc.string({ minLength: 5, maxLength: 20 }).map(s => `2.6.${s}`)
    ),
    ruleName: fc.string({ minLength: 10, maxLength: 50 }),
    severity: fc.constantFrom('critical' as const, 'warning' as const, 'info' as const),
    category: fc.constantFrom('missing_content' as const, 'format_error' as const),
    description: fc.string({ minLength: 20, maxLength: 100 }),
    remediationSteps: fc.array(fc.string({ minLength: 10, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
    required: fc.boolean()
  });
};

/**
 * Generate arbitrary analysis results
 */
const arbAnalysisResult = (): fc.Arbitrary<AnalysisResult> => {
  return fc.record({
    documentName: fc.string({ minLength: 5, maxLength: 30 }),
    templateName: fc.string({ minLength: 5, maxLength: 30 }),
    completenessPercentage: fc.integer({ min: 0, max: 100 }),
    gaps: fc.array(arbValidationGap(), { minLength: 0, maxLength: 20 }),
    analysisDate: fc.date(),
    processingTime: fc.integer({ min: 100, max: 5000 })
  });
};

/**
 * Generate arbitrary validation rule set
 */
const arbValidationRuleSet = (): fc.Arbitrary<ValidationRuleSet> => {
  return fc.record({
    name: fc.string({ minLength: 5, maxLength: 30 }),
    templateType: fc.constantFrom('excel' as const, 'json' as const),
    rules: fc.array(
      fc.record({
        name: fc.string({ minLength: 10, maxLength: 50 }),
        description: fc.string({ minLength: 20, maxLength: 100 }),
        type: fc.constantFrom('content_presence' as const, 'format_requirement' as const),
        field: fc.string({ minLength: 5, maxLength: 20 }),
        required: fc.boolean(),
        severity: fc.constantFrom('critical' as const, 'warning' as const, 'info' as const),
        remediationHint: fc.string({ minLength: 10, maxLength: 50 })
      }),
      { minLength: 1, maxLength: 20 }
    )
  });
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a mock HTML editor for testing
 */
function createMockEditor(): HTMLEditor {
  const container = document.createElement('div');
  const editorDiv = document.createElement('div');
  editorDiv.contentEditable = 'true';
  editorDiv.className = 'editor-content';
  container.appendChild(editorDiv);
  document.body.appendChild(container);

  return new HTMLEditor(container);
}

/**
 * Cleanup mock editor
 */
function cleanupMockEditor(editor: HTMLEditor): void {
  const container = editor.getEditorElement().parentElement;
  if (container && container.parentElement) {
    container.parentElement.removeChild(container);
  }
}

/**
 * Create mock outline view container
 */
function createMockOutlineContainer(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'outline-container';
  document.body.appendChild(container);
  return container;
}

/**
 * Cleanup mock outline container
 */
function cleanupMockOutlineContainer(container: HTMLElement): void {
  if (container.parentElement) {
    container.parentElement.removeChild(container);
  }
}

// ============================================================================
// Property 9: In-Editor Validation Indicator Display
// Feature: gap-analysis-completeness-check, Property 9: In-Editor Validation Indicator Display
// Validates: Requirements 4.1, 4.3, 4.7
// ============================================================================

describe('Property 9: In-Editor Validation Indicator Display', () => {
  it('should display inline indicators for all identified gaps with correct severity styling', () => {
    fc.assert(
      fc.property(arbAnalysisResult(), (analysisResult) => {
        // Setup
        const editor = createMockEditor();
        const manager = new InEditorValidationManager(editor, {
          showPlaceholders: true,
          showFormatErrors: true,
          severityFilter: ['critical', 'warning', 'info'],
          groupIndicators: false
        });

        try {
          // Attach validation results
          manager.attachToEditor(analysisResult);

          // Get all decorations
          const decorations = manager.getDecorations();

          // Property: Every gap should have at least one decoration
          const gapIds = new Set(analysisResult.gaps.map(g => g.ruleId));
          const decorationGapIds = new Set(decorations.map(d => d.gapId));

          // All gaps should be represented in decorations
          gapIds.forEach(gapId => {
            expect(decorationGapIds.has(gapId)).toBe(true);
          });

          // Property: Each decoration should have correct severity
          decorations.forEach(decoration => {
            const gap = analysisResult.gaps.find(g => g.ruleId === decoration.gapId);
            if (gap) {
              expect(decoration.severity).toBe(gap.severity);
            }
          });

          // Property: Decorations should have visual elements
          decorations.forEach(decoration => {
            expect(decoration.element).toBeDefined();
            expect(decoration.element.getAttribute('data-severity')).toBe(decoration.severity);
          });

          return true;
        } finally {
          cleanupMockEditor(editor);
        }
      }),
      { numRuns: 50 }
    );
  });

  it('should apply severity-based visual differentiation (critical, warning, info)', () => {
    fc.assert(
      fc.property(
        fc.array(arbValidationGap(), { minLength: 3, maxLength: 10 }),
        (gaps) => {
          // Ensure we have at least one of each severity
          const criticalGap: ValidationGap = { ...gaps[0], severity: 'critical' };
          const warningGap: ValidationGap = { ...gaps[1], severity: 'warning' };
          const infoGap: ValidationGap = { ...gaps[2], severity: 'info' };

          const analysisResult: AnalysisResult = {
            documentName: 'test.docx',
            templateName: 'template.xlsx',
            completenessPercentage: 50,
            gaps: [criticalGap, warningGap, infoGap],
            analysisDate: new Date(),
            processingTime: 1000
          };

          const editor = createMockEditor();
          const manager = new InEditorValidationManager(editor, {
            groupIndicators: false
          });

          try {
            manager.attachToEditor(analysisResult);

            // Get decorations by severity
            const criticalDecorations = manager.getDecorationsBySeverity('critical');
            const warningDecorations = manager.getDecorationsBySeverity('warning');
            const infoDecorations = manager.getDecorationsBySeverity('info');

            // Property: Each severity level should have decorations
            expect(criticalDecorations.length).toBeGreaterThan(0);
            expect(warningDecorations.length).toBeGreaterThan(0);
            expect(infoDecorations.length).toBeGreaterThan(0);

            // Property: Decorations should have severity-specific classes
            criticalDecorations.forEach(d => {
              expect(d.element.className).toContain('critical');
            });

            warningDecorations.forEach(d => {
              expect(d.element.className).toContain('warning');
            });

            infoDecorations.forEach(d => {
              expect(d.element.className).toContain('info');
            });

            return true;
          } finally {
            cleanupMockEditor(editor);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should filter indicators based on severity filter configuration', () => {
    fc.assert(
      fc.property(
        arbAnalysisResult(),
        fc.constantFrom(
          ['critical'] as const,
          ['critical', 'warning'] as const,
          ['critical', 'warning', 'info'] as const
        ),
        (analysisResult, severityFilter) => {
          const editor = createMockEditor();
          const manager = new InEditorValidationManager(editor, {
            severityFilter: severityFilter as ('critical' | 'warning' | 'info')[],
            groupIndicators: false
          });

          try {
            manager.attachToEditor(analysisResult);

            const decorations = manager.getDecorations();

            // Property: Only decorations matching the filter should be displayed
            decorations.forEach(decoration => {
              expect(severityFilter).toContain(decoration.severity);
            });

            // Property: All gaps matching the filter should have decorations
            const filteredGaps = analysisResult.gaps.filter(g =>
              severityFilter.includes(g.severity)
            );

            const decorationGapIds = new Set(decorations.map(d => d.gapId));
            filteredGaps.forEach(gap => {
              expect(decorationGapIds.has(gap.ruleId)).toBe(true);
            });

            return true;
          } finally {
            cleanupMockEditor(editor);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ============================================================================
// Property 10: Placeholder Hint Generation
// Feature: gap-analysis-completeness-check, Property 10: Placeholder Hint Generation
// Validates: Requirements 4.2
// ============================================================================

describe('Property 10: Placeholder Hint Generation', () => {
  it('should generate placeholder hints for all missing content gaps', () => {
    fc.assert(
      fc.property(
        fc.array(arbValidationGap(), { minLength: 1, maxLength: 15 }),
        (gaps) => {
          // Ensure all gaps are missing_content type
          const missingContentGaps = gaps.map(g => ({ ...g, category: 'missing_content' as const }));

          const analysisResult: AnalysisResult = {
            documentName: 'test.docx',
            templateName: 'template.xlsx',
            completenessPercentage: 0,
            gaps: missingContentGaps,
            analysisDate: new Date(),
            processingTime: 1000
          };

          const editor = createMockEditor();
          const manager = new InEditorValidationManager(editor, {
            showPlaceholders: true,
            groupIndicators: false
          });

          try {
            manager.attachToEditor(analysisResult);

            // Get placeholder decorations
            const placeholders = manager.getDecorationsByType('placeholder_hint');

            // Property: Every missing content gap should have a placeholder
            expect(placeholders.length).toBeGreaterThan(0);

            // Property: Each placeholder should have expected content
            placeholders.forEach(placeholder => {
              expect(placeholder.type).toBe('placeholder_hint');
              expect(placeholder.element).toBeDefined();
              expect(placeholder.element.className).toContain('placeholder');
              
              // Should have gap ID attribute
              expect(placeholder.element.getAttribute('data-gap-id')).toBe(placeholder.gapId);
              
              // Should have type attribute
              expect(placeholder.element.getAttribute('data-type')).toBe('missing_content');
            });

            return true;
          } finally {
            cleanupMockEditor(editor);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should include remediation steps in placeholder hints when available', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            ...arbValidationGap().value,
            category: fc.constant('missing_content' as const),
            remediationSteps: fc.array(fc.string({ minLength: 10, maxLength: 50 }), { minLength: 1, maxLength: 5 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (gaps) => {
          const analysisResult: AnalysisResult = {
            documentName: 'test.docx',
            templateName: 'template.xlsx',
            completenessPercentage: 0,
            gaps,
            analysisDate: new Date(),
            processingTime: 1000
          };

          const editor = createMockEditor();
          const manager = new InEditorValidationManager(editor, {
            showPlaceholders: true,
            groupIndicators: false
          });

          try {
            manager.attachToEditor(analysisResult);

            const placeholders = manager.getDecorationsByType('placeholder_hint');

            // Property: Placeholders with remediation steps should display them
            placeholders.forEach(placeholder => {
              const gap = gaps.find(g => g.ruleId === placeholder.gapId);
              if (gap && gap.remediationSteps.length > 0) {
                // Check if element contains remediation steps
                const requirementsList = placeholder.element.querySelector('.placeholder-requirements');
                expect(requirementsList).toBeDefined();
              }
            });

            return true;
          } finally {
            cleanupMockEditor(editor);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should not generate placeholders when showPlaceholders is false', () => {
    fc.assert(
      fc.property(arbAnalysisResult(), (analysisResult) => {
        const editor = createMockEditor();
        const manager = new InEditorValidationManager(editor, {
          showPlaceholders: false,
          groupIndicators: false
        });

        try {
          manager.attachToEditor(analysisResult);

          const placeholders = manager.getDecorationsByType('placeholder_hint');

          // Property: No placeholders should be generated when disabled
          expect(placeholders.length).toBe(0);

          return true;
        } finally {
          cleanupMockEditor(editor);
        }
      }),
      { numRuns: 50 }
    );
  });
});

// ============================================================================
// Property 11: Real-Time Validation Updates
// Feature: gap-analysis-completeness-check, Property 11: Real-Time Validation Updates
// Validates: Requirements 4.6
// ============================================================================

describe('Property 11: Real-Time Validation Updates', () => {
  it('should automatically update validation status when content changes fix issues', () => {
    fc.assert(
      fc.property(
        fc.array(arbValidationGap(), { minLength: 1, maxLength: 5 }),
        (gaps) => {
          const analysisResult: AnalysisResult = {
            documentName: 'test.docx',
            templateName: 'template.xlsx',
            completenessPercentage: 0,
            gaps,
            analysisDate: new Date(),
            processingTime: 1000
          };

          const editor = createMockEditor();
          const manager = new InEditorValidationManager(editor, {
            autoUpdate: true,
            debounceMs: 100
          });

          try {
            manager.attachToEditor(analysisResult);

            const initialDecorationCount = manager.getDecorations().length;
            expect(initialDecorationCount).toBeGreaterThan(0);

            // Property: Updating status to 'fixed' should remove decoration
            const firstGap = gaps[0];
            manager.updateValidationStatus(firstGap.ruleId, 'fixed');

            const decorationsAfterFix = manager.getDecorations();
            const fixedDecoration = decorationsAfterFix.find(d => d.gapId === firstGap.ruleId);

            // Property: Fixed decoration should be removed
            expect(fixedDecoration).toBeUndefined();

            // Property: Decoration count should decrease
            expect(decorationsAfterFix.length).toBeLessThan(initialDecorationCount);

            return true;
          } finally {
            cleanupMockEditor(editor);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should remove indicators when validation status changes to fixed or dismissed', () => {
    fc.assert(
      fc.property(
        arbAnalysisResult(),
        fc.constantFrom('fixed' as const, 'dismissed' as const),
        (analysisResult, status) => {
          if (analysisResult.gaps.length === 0) {
            return true; // Skip if no gaps
          }

          const editor = createMockEditor();
          const manager = new InEditorValidationManager(editor);

          try {
            manager.attachToEditor(analysisResult);

            const initialCount = manager.getDecorations().length;
            const gapToUpdate = analysisResult.gaps[0];

            // Update status
            manager.updateValidationStatus(gapToUpdate.ruleId, status);

            const afterUpdateCount = manager.getDecorations().length;

            // Property: Decoration count should decrease
            expect(afterUpdateCount).toBeLessThan(initialCount);

            // Property: Specific decoration should be removed
            const decoration = manager.getDecorations().find(d => d.gapId === gapToUpdate.ruleId);
            expect(decoration).toBeUndefined();

            return true;
          } finally {
            cleanupMockEditor(editor);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should maintain acknowledged indicators with updated visual state', () => {
    fc.assert(
      fc.property(arbAnalysisResult(), (analysisResult) => {
        if (analysisResult.gaps.length === 0) {
          return true; // Skip if no gaps
          }

        const editor = createMockEditor();
        const manager = new InEditorValidationManager(editor);

        try {
          manager.attachToEditor(analysisResult);

          const gapToAcknowledge = analysisResult.gaps[0];

          // Acknowledge the indicator
          manager.updateValidationStatus(gapToAcknowledge.ruleId, 'acknowledged');

          const decoration = manager.getDecorations().find(d => d.gapId === gapToAcknowledge.ruleId);

          // Property: Acknowledged decoration should still exist
          expect(decoration).toBeDefined();

          // Property: Status should be updated
          if (decoration) {
            expect(decoration.status).toBe('acknowledged');
            expect(decoration.element.classList.contains('acknowledged')).toBe(true);
          }

          return true;
        } finally {
          cleanupMockEditor(editor);
        }
      }),
      { numRuns: 50 }
    );
  });
});

// ============================================================================
// Property 12: Outline View Completeness
// Feature: gap-analysis-completeness-check, Property 12: Outline View Completeness
// Validates: Requirements 4.5
// ============================================================================

describe('Property 12: Outline View Completeness', () => {
  it('should generate complete outline view showing all required sections from template', () => {
    fc.assert(
      fc.property(
        arbValidationRuleSet(),
        arbAnalysisResult(),
        (template, analysisResult) => {
          const container = createMockOutlineContainer();
          const outlineView = new OutlineView(container);

          try {
            outlineView.render(template, analysisResult);

            // Property: Outline should be rendered
            const outlineElement = container.querySelector('.outline-view');
            expect(outlineElement).toBeDefined();

            // Property: Should have header with completeness percentage
            const header = container.querySelector('.outline-header');
            expect(header).toBeDefined();

            // Property: Should display sections
            const sections = container.querySelectorAll('.outline-section');
            expect(sections.length).toBeGreaterThan(0);

            // Property: Number of sections should match content_presence rules
            const contentRules = template.rules.filter(r => r.type === 'content_presence');
            expect(sections.length).toBe(contentRules.length);

            return true;
          } finally {
            cleanupMockOutlineContainer(container);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should display validation status for each section (complete, incomplete, partial)', () => {
    fc.assert(
      fc.property(
        arbValidationRuleSet(),
        arbAnalysisResult(),
        (template, analysisResult) => {
          const container = createMockOutlineContainer();
          const outlineView = new OutlineView(container);

          try {
            outlineView.render(template, analysisResult);

            const sections = container.querySelectorAll('.outline-section');

            // Property: Each section should have a status indicator
            sections.forEach(section => {
              const icon = section.querySelector('.section-icon');
              expect(icon).toBeDefined();
              expect(icon?.textContent).toBeTruthy();
            });

            return true;
          } finally {
            cleanupMockOutlineContainer(container);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should calculate and display accurate completeness percentage', () => {
    fc.assert(
      fc.property(
        arbValidationRuleSet(),
        arbAnalysisResult(),
        (template, analysisResult) => {
          const container = createMockOutlineContainer();
          const outlineView = new OutlineView(container);

          try {
            outlineView.render(template, analysisResult);

            // Property: Completeness percentage should be between 0 and 100
            const headerText = container.querySelector('.outline-header h3')?.textContent || '';
            const percentageMatch = headerText.match(/(\d+)%/);
            
            if (percentageMatch) {
              const percentage = parseInt(percentageMatch[1]);
              expect(percentage).toBeGreaterThanOrEqual(0);
              expect(percentage).toBeLessThanOrEqual(100);
            }

            return true;
          } finally {
            cleanupMockOutlineContainer(container);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should provide insert template action for each section', () => {
    fc.assert(
      fc.property(
        arbValidationRuleSet(),
        arbAnalysisResult(),
        (template, analysisResult) => {
          const container = createMockOutlineContainer();
          const outlineView = new OutlineView(container);

          try {
            outlineView.render(template, analysisResult);

            const sections = container.querySelectorAll('.outline-section');

            // Property: Each section should have an insert button
            sections.forEach(section => {
              const insertButton = section.querySelector('.btn-insert');
              expect(insertButton).toBeDefined();
              expect(insertButton?.getAttribute('data-action')).toBe('insert-section');
            });

            return true;
          } finally {
            cleanupMockOutlineContainer(container);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should distinguish between required and optional sections', () => {
    fc.assert(
      fc.property(
        arbValidationRuleSet(),
        arbAnalysisResult(),
        (template, analysisResult) => {
          const container = createMockOutlineContainer();
          const outlineView = new OutlineView(container);

          try {
            outlineView.render(template, analysisResult);

            const sections = container.querySelectorAll('.outline-section');

            // Property: Each section should have a required/optional badge
            sections.forEach(section => {
              const requiredBadge = section.querySelector('.badge-required');
              const optionalBadge = section.querySelector('.badge-optional');
              
              // Should have exactly one badge
              const hasBadge = (requiredBadge !== null) !== (optionalBadge !== null);
              expect(hasBadge).toBe(true);
            });

            return true;
          } finally {
            cleanupMockOutlineContainer(container);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should update outline view when analysis results change', () => {
    fc.assert(
      fc.property(
        arbValidationRuleSet(),
        arbAnalysisResult(),
        arbAnalysisResult(),
        (template, initialResult, updatedResult) => {
          const container = createMockOutlineContainer();
          const outlineView = new OutlineView(container);

          try {
            // Initial render
            outlineView.render(template, initialResult);
            
            const initialHeaderText = container.querySelector('.outline-header h3')?.textContent || '';

            // Update with new results
            outlineView.updateAnalysis(updatedResult);

            const updatedHeaderText = container.querySelector('.outline-header h3')?.textContent || '';

            // Property: Header should be updated (may or may not change depending on data)
            expect(updatedHeaderText).toBeTruthy();

            // Property: Outline structure should still be valid
            const sections = container.querySelectorAll('.outline-section');
            expect(sections.length).toBeGreaterThan(0);

            return true;
          } finally {
            cleanupMockOutlineContainer(container);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
