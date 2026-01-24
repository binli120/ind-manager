import { NextRequest, NextResponse } from 'next/server';
import { TemplateParser } from '@/lib/gap-analysis/template-parser';
import { DocumentAnalyzer } from '@/lib/gap-analysis/document-analyzer';
import { RuleEngine } from '@/lib/gap-analysis/rule-engine';
import { AlertGenerator } from '@/lib/gap-analysis/alert-generator';

/**
 * POST /api/gap-analysis/validation
 * Validates a document against a template
 * 
 * Expected request body:
 * - documentFile: File content (base64 encoded)
 * - documentName: string
 * - templateFile: File content (base64 encoded)
 * - templateName: string
 * - templateType: 'excel' | 'json'
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { documentFile, documentName, templateFile, templateName, templateType } = body;

    // Validate required fields
    if (!documentFile || !documentName || !templateFile || !templateName || !templateType) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          details: 'documentFile, documentName, templateFile, templateName, and templateType are required'
        },
        { status: 400 }
      );
    }

    // Validate template type
    if (templateType !== 'excel' && templateType !== 'json') {
      return NextResponse.json(
        { 
          error: 'Invalid template type',
          details: 'templateType must be either "excel" or "json"'
        },
        { status: 400 }
      );
    }

    // Decode base64 files to buffers
    const templateBuffer = Buffer.from(templateFile, 'base64');
    const documentBuffer = Buffer.from(documentFile, 'base64');

    // Initialize validation components
    const templateParser = new TemplateParser();
    const documentAnalyzer = new DocumentAnalyzer();
    const ruleEngine = new RuleEngine();
    const alertGenerator = new AlertGenerator();

    // Parse template to extract validation rules
    let validationRuleSet;
    try {
      if (templateType === 'excel') {
        validationRuleSet = templateParser.parseExcelTemplate(templateBuffer);
      } else {
        validationRuleSet = templateParser.parseJsonTemplate(templateBuffer.toString('utf-8'));
      }
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Template parsing failed',
          details: error instanceof Error ? error.message : 'Failed to parse template file'
        },
        { status: 400 }
      );
    }

    // Analyze document against template rules
    let analysisResult;
    try {
      analysisResult = await documentAnalyzer.analyzeLocalDocument(
        documentBuffer,
        validationRuleSet,
        documentName
      );
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Document analysis failed',
          details: error instanceof Error ? error.message : 'Failed to analyze document'
        },
        { status: 400 }
      );
    }

    // Execute rules through rule engine for detailed scoring
    const ruleResults = validationRuleSet.rules.map(rule => 
      ruleEngine.executeRule(rule, documentBuffer.toString('utf-8'))
    );

    // Calculate completeness score
    const completenessScore = ruleEngine.calculateCompleteness(ruleResults);

    // Prioritize issues
    const prioritizedIssues = ruleEngine.prioritizeIssues(ruleResults);

    // Generate interactive alerts
    const alerts = alertGenerator.generateAlertsFromIssues(prioritizedIssues);

    // Return comprehensive validation results
    return NextResponse.json({
      success: true,
      message: 'Validation completed successfully',
      data: {
        documentName,
        templateName,
        templateType,
        status: 'completed',
        validation: {
          completenessPercentage: analysisResult.completenessPercentage,
          totalRules: completenessScore.totalRules,
          passedRules: completenessScore.passedRules,
          failedRules: completenessScore.failedRules,
          weightedScore: completenessScore.weightedScore,
          breakdown: {
            critical: {
              passed: completenessScore.criticalPassed,
              failed: completenessScore.criticalFailed
            },
            warning: {
              passed: completenessScore.warningPassed,
              failed: completenessScore.warningFailed
            },
            info: {
              passed: completenessScore.infoPassed,
              failed: completenessScore.infoFailed
            }
          }
        },
        gaps: analysisResult.gaps,
        alerts: alerts,
        processingTime: analysisResult.processingTime,
        analysisDate: analysisResult.analysisDate
      }
    });

  } catch (error) {
    console.error('Validation API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gap-analysis/validation
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Validation API is running',
    version: '1.0.0'
  });
}
