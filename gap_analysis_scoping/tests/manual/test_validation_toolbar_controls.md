# Manual Test: Validation Toolbar Controls

## Test ID: 6.5
**Feature**: Validation Toolbar Controls  
**Date**: 2026-01-22  
**Tester**: Manual Testing Required

## Overview

This manual test verifies the validation toolbar controls functionality including:
- Validation toggle button with issue count badge
- Severity filter dropdown (critical/warning/info)
- Jump to next/previous issue navigation
- Keyboard shortcuts (F8, Shift+F8)

## Prerequisites

1. Start the development server: `npm run dev`
2. Navigate to `/gap-analysis-html` or open `public/gap-analysis-poc.html`
3. Load test files using the "Load Test Files" button

## Test Cases

### TC 6.5.1: Validation Toggle Button

**Steps:**
1. Load test files
2. Observe the toolbar - locate the "Validation" button with checkmark icon
3. Verify the badge shows the number of validation issues (should show a number > 0)
4. Click the "Validation" button to toggle validation indicators off
5. Click again to toggle validation indicators back on

**Expected Results:**
- ✓ Validation button is visible in the toolbar
- ✓ Badge displays the correct count of validation issues
- ✓ Badge is visible when issues exist (red background)
- ✓ Clicking the button toggles the active state (blue background when active)
- ✓ Validation indicators (placeholders and errors) hide/show accordingly
- ✓ Button remains functional after multiple toggles

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

**Notes:**
_____________________________________________________________________________

---

### TC 6.5.2: Severity Filter Dropdown

**Steps:**
1. Load test files
2. Locate the "Filter" button with warning icon in the toolbar
3. Click the "Filter" button to open the dropdown menu
4. Verify the dropdown shows three checkboxes:
   - 🔴 Critical (checked)
   - ⚠️ Warning (checked)
   - ℹ️ Info (checked)
5. Uncheck "Info" checkbox
6. Observe that info-level indicators are hidden
7. Uncheck "Warning" checkbox
8. Observe that warning-level indicators are hidden
9. Re-check all checkboxes
10. Click outside the dropdown to close it

**Expected Results:**
- ✓ Filter button is visible in the toolbar
- ✓ Dropdown menu opens when button is clicked
- ✓ Dropdown shows three severity checkboxes with icons
- ✓ All checkboxes are checked by default
- ✓ Unchecking a severity hides corresponding indicators
- ✓ Re-checking a severity shows corresponding indicators
- ✓ Badge count updates to reflect visible indicators
- ✓ Dropdown closes when clicking outside

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

**Notes:**
_____________________________________________________________________________

---

### TC 6.5.3: Jump to Next Issue Navigation

**Steps:**
1. Load test files
2. Scroll to the top of the editor
3. Locate the "Next Issue" button (→ icon) in the toolbar
4. Verify the button is enabled (not grayed out)
5. Click the "Next Issue" button
6. Observe that the editor scrolls to the first validation indicator
7. Observe that the indicator briefly flashes/highlights
8. Click "Next Issue" again
9. Observe that the editor scrolls to the second validation indicator
10. Continue clicking until you reach the last indicator
11. Click "Next Issue" one more time
12. Observe that it wraps around to the first indicator

**Expected Results:**
- ✓ Next Issue button is visible and enabled when issues exist
- ✓ Clicking the button scrolls to the next validation indicator
- ✓ The indicator briefly highlights when navigated to
- ✓ Navigation wraps around from last to first indicator
- ✓ Smooth scrolling animation occurs
- ✓ Only visible indicators (based on filter) are navigated

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

**Notes:**
_____________________________________________________________________________

---

### TC 6.5.4: Jump to Previous Issue Navigation

**Steps:**
1. Load test files
2. Scroll to the bottom of the editor
3. Locate the "Prev Issue" button (← icon) in the toolbar
4. Verify the button is enabled (not grayed out)
5. Click the "Prev Issue" button
6. Observe that the editor scrolls to the last validation indicator
7. Click "Prev Issue" again
8. Observe that the editor scrolls to the previous validation indicator
9. Continue clicking until you reach the first indicator
10. Click "Prev Issue" one more time
11. Observe that it wraps around to the last indicator

**Expected Results:**
- ✓ Prev Issue button is visible and enabled when issues exist
- ✓ Clicking the button scrolls to the previous validation indicator
- ✓ The indicator briefly highlights when navigated to
- ✓ Navigation wraps around from first to last indicator
- ✓ Smooth scrolling animation occurs
- ✓ Only visible indicators (based on filter) are navigated

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

**Notes:**
_____________________________________________________________________________

---

### TC 6.5.5: Keyboard Shortcuts - F8 (Next Issue)

**Steps:**
1. Load test files
2. Click inside the editor to focus it
3. Press the F8 key
4. Observe that the editor scrolls to the next validation indicator
5. Press F8 again
6. Observe that the editor scrolls to the next indicator
7. Continue pressing F8 to navigate through all indicators

**Expected Results:**
- ✓ F8 key navigates to the next validation indicator
- ✓ Behavior is identical to clicking "Next Issue" button
- ✓ Indicator highlights when navigated to
- ✓ Navigation wraps around from last to first

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

**Notes:**
_____________________________________________________________________________

---

### TC 6.5.6: Keyboard Shortcuts - Shift+F8 (Previous Issue)

**Steps:**
1. Load test files
2. Click inside the editor to focus it
3. Press Shift+F8 keys together
4. Observe that the editor scrolls to the previous validation indicator
5. Press Shift+F8 again
6. Observe that the editor scrolls to the previous indicator
7. Continue pressing Shift+F8 to navigate backwards through indicators

**Expected Results:**
- ✓ Shift+F8 keys navigate to the previous validation indicator
- ✓ Behavior is identical to clicking "Prev Issue" button
- ✓ Indicator highlights when navigated to
- ✓ Navigation wraps around from first to last

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

**Notes:**
_____________________________________________________________________________

---

### TC 6.5.7: Badge Count Updates

**Steps:**
1. Load test files
2. Note the initial badge count on the Validation button
3. Click on a placeholder indicator to insert content
4. Observe that the badge count decreases by 1
5. Dismiss a validation error by clicking its dismiss button
6. Observe that the badge count decreases by 1
7. Continue dismissing indicators until count reaches 0
8. Observe that the badge becomes hidden

**Expected Results:**
- ✓ Badge shows correct initial count
- ✓ Badge count decreases when indicators are fixed/dismissed
- ✓ Badge updates in real-time
- ✓ Badge becomes hidden when count reaches 0
- ✓ Navigation buttons become disabled when count reaches 0

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

**Notes:**
_____________________________________________________________________________

---

### TC 6.5.8: Disabled State (No Issues)

**Steps:**
1. Start with a blank editor (no test files loaded)
2. Observe the validation toolbar controls
3. Verify that navigation buttons are disabled
4. Verify that the badge is hidden or shows 0

**Expected Results:**
- ✓ Next Issue button is disabled (grayed out)
- ✓ Prev Issue button is disabled (grayed out)
- ✓ Badge is hidden or shows 0
- ✓ Validation toggle button is still functional
- ✓ Filter dropdown is still functional

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

**Notes:**
_____________________________________________________________________________

---

### TC 6.5.9: Integration with Severity Filter

**Steps:**
1. Load test files
2. Note the initial badge count (e.g., 16 issues)
3. Open the severity filter dropdown
4. Uncheck "Info" checkbox
5. Observe that the badge count decreases (e.g., to 11 issues)
6. Click "Next Issue" button
7. Verify that only critical and warning indicators are navigated
8. Re-check "Info" checkbox
9. Observe that the badge count increases back to original
10. Click "Next Issue" button
11. Verify that all severity indicators are now navigated

**Expected Results:**
- ✓ Badge count reflects only visible indicators based on filter
- ✓ Navigation only jumps to visible indicators
- ✓ Badge updates immediately when filter changes
- ✓ Navigation wraps correctly with filtered indicators

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

**Notes:**
_____________________________________________________________________________

---

## Summary

**Total Test Cases:** 9  
**Passed:** ___  
**Failed:** ___  
**Not Tested:** ___

## Issues Found

| Issue ID | Severity | Description | Steps to Reproduce |
|----------|----------|-------------|-------------------|
| | | | |

## Recommendations

_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

## Sign-off

**Tester Name:** _____________________  
**Date:** _____________________  
**Signature:** _____________________
