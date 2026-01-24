# In-Editor Validation Experience Design

## Overview

This document describes the design for integrating validation feedback directly into an editor, providing real-time, contextual guidance as users author documents.

**Implementation Approach**:
- **Phase 1 (Task 6)**: HTML-based demo using contenteditable - Proof of concept without Tiptap dependency
- **Phase 2 (Task 9)**: Tiptap integration - Production-ready implementation with ProseMirror decorations

## Key Design Principles

### 1. Non-Intrusive
Validation indicators guide without overwhelming the user experience.

### 2. Contextual
Feedback appears where it's needed, when it's needed.

### 3. Actionable
Every indicator provides clear next steps for resolution.

## Validation Visualization Strategy

### Problem: Avoiding UX Overwhelm

With 87 validation rules extracted from the template, showing all issues simultaneously would create a poor user experience. Our design addresses this through several strategies:

#### 1. Smart Indicator Grouping

Instead of showing 87 individual indicators, we group related issues:

- **By Section**: All issues for section 2.6.2.1 grouped together
- **Count Badges**: "3 issues in this section" instead of 3 separate indicators
- **Expandable**: Click to see individual issues within a group
- **Auto-Update**: Fix one issue, count updates automatically

#### 2. Progressive Disclosure

Reveal validation issues progressively based on severity:

- **Initial View**: Show only critical issues (blocking problems)
- **User Control**: "Show warnings" button reveals warning-level issues
- **Full View**: "Show all suggestions" for info-level issues
- **Persistent Preference**: Remember user's display preference

#### 3. Contextual Filtering

Only show indicators relevant to the current editing context:

- **Visible Content**: Only display indicators for content in viewport
- **Sidebar Summary**: Complete list of all issues available in sidebar
- **Navigation**: "Jump to next issue" button for quick traversal
- **Filters**: Filter by severity, section, or status

## Visualization Types

### 1. Missing Content (Placeholder Hints)

**Visual Design**:
```
┌─────────────────────────────────────────┐
│ ➕ Section 2.6.2.1-a: Brief Summary     │
│                                         │
│ Click to add required content           │
│ • Executive summary of findings         │
│ • Key safety conclusions                │
└─────────────────────────────────────────┘
```

**Styling**:
- Light gray dashed border
- Very subtle background (5% opacity)
- ➕ icon with section title
- Italic placeholder text
- Collapsible to reduce clutter

**Interaction**:
- Click to insert section template
- Hover to see full requirements
- Dismiss button to hide temporarily
- Reappears on next validation run

### 2. Wrong Information (Format Errors)

**Visual Design**:
- Colored underline on problematic text
- Severity-based colors:
  - **Critical**: Solid red underline (2px)
  - **Warning**: Dashed amber underline (2px)
  - **Info**: Dotted blue underline (1px)
- Background tint (10% opacity) matching severity color

**Tooltip on Hover**:
```
┌─────────────────────────────────────┐
│ ⚠️ Format Issue: Missing Data       │
│ ─────────────────────────────────── │
│ This section requires:              │
│ • Study ID                          │
│ • Species information               │
│ • Dose levels                       │
│                                     │
│ [Fix] [Dismiss] [View Details]     │
└─────────────────────────────────────┘
```

### 3. Wrong Format (Structure Issues)

**Visual Design**:
- Similar to wrong information but with different icon
- Highlights entire sections or paragraphs
- Shows structural requirements

**Example**:
```
┌─────────────────────────────────────┐
│ ℹ️ Missing Module 4 References      │
│ ─────────────────────────────────── │
│ Content must reference:             │
│ • 4.2.1.3 Safety pharmacology       │
│ • 4.2.3.2 Repeat-dose toxicology    │
│                                     │
│ [Add References] [Dismiss]          │
└─────────────────────────────────────┘
```

## Blank Document Experience

### Outline View

When a document is blank or has minimal content, display a structured outline showing all required sections:

```
Gap Analysis Completeness: 0% (0/16 required sections)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 2.6.2 Nonclinical Overview

  🔴 2.6.2.1 Brief Summary (Required)
     ├─ 2.6.2.1-a: Executive Summary
     └─ 2.6.2.1-b: Secondary Findings
     [Insert Section Template]

  🔴 2.6.2.2 Pharmacology (Required)
     ├─ 2.6.2.2-a: Primary Pharmacodynamics
     ├─ 2.6.2.2-b: Secondary Pharmacodynamics
     └─ 2.6.2.2-c: Safety Pharmacology
     [Insert Section Template]

  ⚠️ 2.6.2.3 Pharmacokinetics (Required)
     [Expand to see subsections]

  ℹ️ 2.6.2.4 Toxicology (Optional)
     [Expand to see subsections]

[Show Only Required] [Expand All] [Collapse All]
```

**Features**:
- Hierarchical display with expand/collapse
- Visual severity indicators (🔴 critical, ⚠️ warning, ℹ️ info)
- Progress bar showing overall completeness
- "Insert Section Template" buttons
- Filter to show only required sections
- Click any section to jump to it (or insert if missing)

## Severity-Based Visual Language

### Critical (Red) 🔴
- **Use Case**: Required missing content, blocking issues
- **Visual**: Solid red underline (2px), red background tint (10%)
- **Priority**: Must be fixed before submission

### Warning (Amber) ⚠️
- **Use Case**: Important but non-blocking issues
- **Visual**: Dashed amber underline (2px), amber background tint (10%)
- **Priority**: Should be addressed

### Info (Blue) ℹ️
- **Use Case**: Suggestions, optional improvements
- **Visual**: Dotted blue underline (1px), blue background tint (10%)
- **Priority**: Nice to have

## Toolbar Integration

### Validation Toggle Button

**Location**: Editor toolbar, next to "Review" button

**Visual**: Checkmark icon with badge showing issue count

**Dropdown Menu**:
- ✓ Show Critical Only
- ☐ Show Warnings
- ☐ Show All
- ☐ Hide All
- ─────────────
- View Outline
- Validation Settings

**Badge Behavior**:
- Shows total issue count
- Color-coded by highest severity
- Pulsing animation for new issues
- Click to toggle validation display

## Real-Time Validation

### Debounced Validation
- Wait 1 second after user stops typing
- Run validation in background
- Update indicators without interrupting typing
- Show subtle loading indicator during validation

### Incremental Updates
- Only re-validate changed sections
- Cache validation results for unchanged content
- Diff-based indicator updates
- Smooth fade in/out transitions

## Acknowledgment and Dismissal

### Dismissal System

**Temporary Dismissal**:
- Click "Dismiss" on any indicator
- Indicator hidden until next validation run
- Reappears if issue still exists

**Permanent Acknowledgment**:
- Click "Acknowledge" with reason
- Indicator hidden permanently
- Tracked in "Dismissed items" panel
- Can be reviewed and un-acknowledged

### Dismissed Items Panel

**Access**: Validation dropdown → "View Dismissed Items"

**Display**:
```
Dismissed Validation Items (5)

🔴 Section 2.6.2.1-a: Brief Summary
   Dismissed by: John Doe
   Reason: Will add in next revision
   Date: 2026-01-22
   [Un-dismiss] [View Details]

⚠️ Missing Module 4 References
   Acknowledged by: Jane Smith
   Reason: References in separate document
   Date: 2026-01-21
   [Un-acknowledge] [View Details]
```

## Accessibility

### Screen Reader Support
- ARIA labels for all indicators
- Announce validation status changes
- Keyboard navigation through issues
- Focus management for tooltips

### Keyboard Shortcuts
- `Ctrl+Shift+V`: Toggle validation display
- `F8`: Jump to next issue
- `Shift+F8`: Jump to previous issue
- `Ctrl+.`: Show quick fix menu
- `ESC`: Close tooltip/popover

## Technical Implementation

### Phase 1: HTML-Based Demo (Task 6)

**Editor Foundation**:
```html
<div id="validation-editor" contenteditable="true" class="editor-content">
  <!-- User content here -->
</div>
```

**Validation Indicators**: HTML spans with data attributes
```html
<!-- Missing Content Placeholder -->
<div class="validation-placeholder" 
     data-gap-id="2.6.2.1-a" 
     data-severity="critical"
     data-type="missing_content">
  <span class="placeholder-icon">➕</span>
  <span class="placeholder-title">Section 2.6.2.1-a: Brief Summary</span>
  <div class="placeholder-hint">Click to add required content</div>
</div>

<!-- Format Error Highlight -->
<span class="validation-error" 
      data-gap-id="2.6.2.4-b_data_inputs"
      data-severity="warning"
      style="border-bottom: 2px dashed #f59e0b; background: rgba(245, 158, 11, 0.1);">
  This section needs study ID and species
</span>
```

**Tooltip Implementation**: Absolute positioned div
```html
<div class="validation-tooltip" style="position: absolute; top: 100px; left: 200px;">
  <div class="tooltip-header">
    <span class="tooltip-icon">⚠️</span>
    <span class="tooltip-title">Format Issue: Missing Data</span>
  </div>
  <div class="tooltip-body">
    <p>This section requires:</p>
    <ul>
      <li>Study ID</li>
      <li>Species information</li>
      <li>Dose levels</li>
    </ul>
  </div>
  <div class="tooltip-actions">
    <button class="btn-fix">Fix</button>
    <button class="btn-dismiss">Dismiss</button>
  </div>
</div>
```

**Event Handling**:
```javascript
// Content change detection
editor.addEventListener('input', debounce(() => {
  const content = editor.innerHTML;
  validateContent(content);
}, 1000));

// Indicator interactions
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('validation-placeholder')) {
    insertSectionTemplate(e.target.dataset.gapId);
  }
});

// Tooltip display
document.addEventListener('mouseover', (e) => {
  if (e.target.classList.contains('validation-error')) {
    showTooltip(e.target);
  }
});
```

### Phase 2: Tiptap Integration (Task 9)

**Tiptap Extension**

Custom extension: `ValidationIndicatorExtension`

**Decoration Types**:
1. **Widget Decorations**: For placeholder hints
2. **Inline Decorations**: For format errors
3. **Node Decorations**: For section-level issues

### State Management

**Validation State**:
- Current validation results
- Indicator visibility settings
- Dismissed/acknowledged items
- User preferences

**Updates**:
- Debounced content changes
- Immediate on user actions (dismiss, acknowledge)
- Background refresh on template change

## Example User Flows

### Flow 1: Starting with Blank Document

1. User opens blank document
2. System shows outline view with all required sections
3. User clicks "Insert Section Template" for 2.6.2.1-a
4. Template inserted with placeholder text
5. User fills in content
6. Validation runs automatically
7. Placeholder indicator removed
8. Progress bar updates: 1/16 sections complete

### Flow 2: Fixing Format Error

1. User types content in section 2.6.2.4-b
2. Validation detects missing data inputs
3. Amber dashed underline appears on section
4. User hovers, sees tooltip with requirements
5. User adds missing study ID and species
6. Validation re-runs after 1 second
7. Underline fades out
8. Success indicator briefly appears

### Flow 3: Managing Overwhelming Alerts

1. User opens document with many issues
2. System shows only critical issues (5 indicators)
3. User clicks "Show warnings" in toolbar
4. Additional 8 warning indicators appear
5. User dismisses 3 non-urgent warnings
6. Focuses on fixing critical issues first
7. Can review dismissed items later in panel

## Benefits

### For Users
- **Immediate Feedback**: See issues as you type
- **Contextual Guidance**: Remediation steps right where you need them
- **Reduced Cognitive Load**: Progressive disclosure prevents overwhelm
- **Flexible Control**: Show/hide validation as needed

### For Quality
- **Proactive Validation**: Catch issues early
- **Comprehensive Coverage**: All 87 rules checked
- **Consistent Standards**: Template-driven validation
- **Audit Trail**: Track acknowledgments and dismissals

### For Productivity
- **No Context Switching**: Stay in editor
- **Quick Fixes**: One-click template insertion
- **Smart Navigation**: Jump between issues
- **Batch Operations**: Group similar fixes

## Future Enhancements

1. **AI-Powered Suggestions**: Auto-generate content for missing sections
2. **Collaborative Validation**: Share validation status with team
3. **Custom Rules**: Allow users to add project-specific rules
4. **Validation History**: Track validation status over time
5. **Export Reports**: Generate validation reports for stakeholders
