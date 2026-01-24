/**
 * Quick verification script for consolidated view
 * This script checks if the consolidated view HTML file has all required elements
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../../public/gap-analysis.html');
const html = fs.readFileSync(htmlPath, 'utf8');

console.log('🔍 Verifying Consolidated View Implementation...\n');

// Check for view mode toggle buttons
const hasReportViewButton = html.includes('data-view="report"');
const hasEditorViewButton = html.includes('data-view="editor"');

console.log('✓ View Mode Toggle:');
console.log(`  ${hasReportViewButton ? '✅' : '❌'} Report View button`);
console.log(`  ${hasEditorViewButton ? '✅' : '❌'} Editor View button\n`);

// Check for view containers
const hasReportViewContainer = html.includes('id="reportView"');
const hasEditorViewContainer = html.includes('id="editorView"');

console.log('✓ View Containers:');
console.log(`  ${hasReportViewContainer ? '✅' : '❌'} Report View container`);
console.log(`  ${hasEditorViewContainer ? '✅' : '❌'} Editor View container\n`);

// Check for key functions
const functions = [
    'switchViewMode',
    'displayReportView',
    'displayEditorView',
    'updateValidationIndicators',
    'addInlineIndicators',
    'createInlineBadge',
    'createMissingSectionsBanner',
    'createValidationSidePanel',
    'showGapDetailsInPanel',
    'groupGapsBySection',
    'extractSectionId',
    'getSeverityColor',
    'getSeverityBackground',
    'getSeverityIcon'
];

console.log('✓ Key Functions:');
let allFunctionsPresent = true;
functions.forEach(fn => {
    const present = html.includes(`function ${fn}`);
    console.log(`  ${present ? '✅' : '❌'} ${fn}()`);
    if (!present) allFunctionsPresent = false;
});

console.log('\n✓ Editor Features:');
const hasToolbar = html.includes('id="editorToolbar"');
const hasValidationBadge = html.includes('validationBadge');
const hasSidePanel = html.includes('validation-sidebar-panel');

console.log(`  ${hasToolbar ? '✅' : '❌'} Editor toolbar`);
console.log(`  ${hasValidationBadge ? '✅' : '❌'} Validation badge`);
console.log(`  ${hasSidePanel ? '✅' : '❌'} Side panel support\n`);

// Check for severity styling
console.log('✓ Severity Levels:');
const hasCriticalStyling = html.includes('critical') && html.includes('#e74c3c');
const hasWarningStyling = html.includes('warning') && html.includes('#f39c12');
const hasInfoStyling = html.includes('info') && html.includes('#3498db');

console.log(`  ${hasCriticalStyling ? '✅' : '❌'} Critical (red)`);
console.log(`  ${hasWarningStyling ? '✅' : '❌'} Warning (yellow)`);
console.log(`  ${hasInfoStyling ? '✅' : '❌'} Info (blue)\n`);

// Overall status
const allChecks = 
    hasReportViewButton &&
    hasEditorViewButton &&
    hasReportViewContainer &&
    hasEditorViewContainer &&
    allFunctionsPresent &&
    hasToolbar &&
    hasValidationBadge &&
    hasSidePanel &&
    hasCriticalStyling &&
    hasWarningStyling &&
    hasInfoStyling;

console.log('═══════════════════════════════════════════════════');
if (allChecks) {
    console.log('✅ ALL CHECKS PASSED - Consolidated view is properly implemented!');
} else {
    console.log('❌ SOME CHECKS FAILED - Review implementation');
}
console.log('═══════════════════════════════════════════════════\n');

console.log('📝 Next Steps:');
console.log('1. Navigate to http://localhost:3001/gap-analysis.html');
console.log('2. Click "Load Test Files" button');
console.log('3. Click "Start Validation" button');
console.log('4. Verify Report View shows validation results');
console.log('5. Click "✏️ Editor View" button');
console.log('6. Verify inline indicators appear in editor');
console.log('7. Click on inline badges to open side panel');
console.log('8. Verify side panel shows detailed issue information\n');

process.exit(allChecks ? 0 : 1);
