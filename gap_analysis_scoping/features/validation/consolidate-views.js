/**
 * Script to create a consolidated gap analysis HTML file
 * Combines report view and in-editor validation view into a single interface
 * 
 * Usage: node gap_analysis_scoping/features/validation/consolidate-views.js
 */

const fs = require('fs');
const path = require('path');

// Read the existing HTML files
const reportHtml = fs.readFileSync(path.join(__dirname, '../../../public/gap-analysis-poc.html'), 'utf8');
const editorHtml = fs.readFileSync(path.join(__dirname, '../../../public/gap-analysis-editor.html'), 'utf8');

// Extract styles from both files
const extractStyles = (html) => {
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    return styleMatch ? styleMatch[1] : '';
};

// Extract body content from both files
const extractBodyContent = (html) => {
    const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
    return bodyMatch ? bodyMatch[1] : '';
};

const reportStyles = extractStyles(reportHtml);
const editorStyles = extractStyles(editorHtml);

// Create consolidated HTML
const consolidatedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gap Analysis - Consolidated View</title>
    
    <style>
        /* Base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }

        .header p {
            font-size: 14px;
            opacity: 0.9;
        }

        /* View mode toggle */
        .view-mode-toggle {
            display: flex;
            justify-content: center;
            gap: 10px;
            padding: 20px;
            background: #f8f9ff;
            border-bottom: 1px solid #e0e0e0;
        }

        .view-mode-btn {
            padding: 12px 24px;
            border: 2px solid #667eea;
            border-radius: 8px;
            background: white;
            color: #667eea;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .view-mode-btn:hover {
            background: #f8f9ff;
        }

        .view-mode-btn.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        /* View containers */
        .view-container {
            display: none;
        }

        .view-container.active {
            display: block;
        }

        ${reportStyles}
        ${editorStyles}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Gap Analysis - Consolidated View</h1>
            <p>Choose between Report View (for early-stage review) or Editor View (for inline validation)</p>
        </div>

        <!-- View Mode Toggle -->
        <div class="view-mode-toggle">
            <button class="view-mode-btn active" data-view="report">
                📊 Report View
            </button>
            <button class="view-mode-btn" data-view="editor">
                ✏️ Editor View
            </button>
        </div>

        <!-- Report View Container -->
        <div id="reportView" class="view-container active">
            <!-- Report view content will be inserted here -->
        </div>

        <!-- Editor View Container -->
        <div id="editorView" class="view-container">
            <!-- Editor view content will be inserted here -->
        </div>
    </div>

    <script>
        // View mode switching
        const viewModeButtons = document.querySelectorAll('.view-mode-btn');
        const reportView = document.getElementById('reportView');
        const editorView = document.getElementById('editorView');

        viewModeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const viewMode = btn.getAttribute('data-view');
                
                // Update button states
                viewModeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Show/hide views
                if (viewMode === 'report') {
                    reportView.classList.add('active');
                    editorView.classList.remove('active');
                } else {
                    reportView.classList.remove('active');
                    editorView.classList.add('active');
                }
            });
        });

        // Initialize views
        initializeReportView();
        initializeEditorView();

        function initializeReportView() {
            // Report view initialization code
            console.log('Report view initialized');
        }

        function initializeEditorView() {
            // Editor view initialization code
            console.log('Editor view initialized');
        }
    </script>
</body>
</html>`;

// Write the consolidated HTML file
const outputPath = path.join(__dirname, '../../../public/gap-analysis-consolidated.html');
fs.writeFileSync(outputPath, consolidatedHtml, 'utf8');

console.log('✓ Consolidated HTML file created successfully at:', outputPath);
