/**
 * Document Analyzer for Gap Analysis Completeness Check
 * 
 * Analyzes local documents against template requirements to identify gaps
 * and validate completeness. Supports multiple document formats (PDF, DOCX, TXT).
 */

import { ValidationRule, ValidationRuleSet } from './template-parser';
import * as mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib';

export interface ContentCheck {
  rule: ValidationRule;
  passed: boolean;
  foundContent?: string;
  missingReason?: string;
}

export interface FormatCheck {
  rule: ValidationRule;
  passed: boolean;
  validationDetails?: string;
  errorMessage?: string;
}

export interface ValidationCheck {
  rule: ValidationRule;
  passed: boolean;
  details?: string;
}

export interface ValidationGap {
  ruleId: string;
  ruleName: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'missing_content' | 'format_error';
  description: string;
  remediationSteps: string[];
  required: boolean;
}

export interface GapReport {
  totalRules: number;
  passedRules: number;
  failedRules: number;
  completenessPercentage: number;
  gaps: ValidationGap[];
  criticalGaps: number;
  warningGaps: number;
  infoGaps: number;
}

export interface AnalysisResult {
  documentName: string;
  templateName: string;
  completenessPercentage: number;
  gaps: ValidationGap[];
  analysisDate: Date;
  processingTime: number;
}

/**
 * DocumentAnalyzer class for analyzing documents against validation rules
 * Processes local documents and checks them against template requirements
 */
export class DocumentAnalyzer {
  /**
   * Analyze a local document against template requirements
   * Main entry point for document validation
   * 
   * @param fileContent - Buffer containing document file data
   * @param template - ValidationRuleSet with rules to validate against
   * @param fileName - Name of the document file
   * @returns AnalysisResult with gaps and completeness score
   */
  async analyzeLocalDocument(
    fileContent: Buffer,
    template: ValidationRuleSet,
    fileName: string = 'document'
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
      // Extract text content from document based on file type
      const documentContent = await this.extractDocumentContent(fileContent, fileName);

      // Check content presence against template rules
      const contentChecks = this.checkContentPresence(documentContent, template.rules);

      // Validate format requirements
      const formatChecks = this.validateFormatRequirements(documentContent, template.rules);

      // Combine all validation checks
      const allChecks: ValidationCheck[] = [
        ...contentChecks.map(c => ({ rule: c.rule, passed: c.passed, details: c.missingReason || c.foundContent })),
        ...formatChecks.map(f => ({ rule: f.rule, passed: f.passed, details: f.errorMessage || f.validationDetails }))
      ];

      // Generate gap report
      const gapReport = this.generateGapReport(allChecks);

      const processingTime = Date.now() - startTime;

      return {
        documentName: fileName,
        templateName: template.name,
        completenessPercentage: gapReport.completenessPercentage,
        gaps: gapReport.gaps,
        analysisDate: new Date(),
        processingTime
      };
    } catch (error) {
      throw new Error(`Failed to analyze document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text content from document buffer
   * Supports PDF, DOCX, and plain text formats
   * 
   * @param fileContent - Buffer containing document data
   * @param fileName - Name of the file to determine format
   * @returns Extracted text content as string
   */
  private async extractDocumentContent(fileContent: Buffer, fileName: string): Promise<string> {
    const fileExtension = fileName.toLowerCase().split('.').pop();

    try {
      switch (fileExtension) {
        case 'pdf':
          return await this.extractPdfContent(fileContent);
        
        case 'docx':
        case 'doc':
          return await this.extractDocxContent(fileContent);
        
        case 'txt':
        case 'md':
          return fileContent.toString('utf-8');
        
        default:
          // Try to parse as text
          return fileContent.toString('utf-8');
      }
    } catch (error) {
      throw new Error(`Failed to extract content from ${fileExtension} file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text content from PDF buffer
   * Uses pdf-lib to parse PDF and extract text
   * 
   * @param fileContent - Buffer containing PDF data
   * @returns Extracted text content
   */
  private async extractPdfContent(fileContent: Buffer): Promise<string> {
    try {
      const pdfDoc = await PDFDocument.load(fileContent);
      const pages = pdfDoc.getPages();
      
      // Note: pdf-lib doesn't have built-in text extraction
      // For POC, we'll return a placeholder that includes page count
      // In production, you'd use pdf-parse or pdfjs-dist for text extraction
      const pageCount = pages.length;
      
      return `[PDF Document with ${pageCount} pages - Text extraction requires pdf-parse library]`;
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text content from DOCX buffer
   * Uses mammoth to convert DOCX to plain text
   * 
   * @param fileContent - Buffer containing DOCX data
   * @returns Extracted text content
   */
  private async extractDocxContent(fileContent: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer: fileContent });
      return result.value;
    } catch (error) {
      throw new Error(`DOCX parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check content presence against template rules
   * Validates that required content elements exist in the document
   * 
   * @param document - Extracted document text content
   * @param rules - Array of validation rules to check
   * @returns Array of ContentCheck results
   */
  checkContentPresence(document: string, rules: ValidationRule[]): ContentCheck[] {
    const contentRules = rules.filter(rule => rule.type === 'content_presence');
    const checks: ContentCheck[] = [];

    for (const rule of contentRules) {
      const check = this.checkSingleContentRule(document, rule);
      checks.push(check);
    }

    return checks;
  }

  /**
   * Check a single content presence rule
   * Searches for the required field/section in the document
   * 
   * @param document - Document text content
   * @param rule - Validation rule to check
   * @returns ContentCheck result
   */
  private checkSingleContentRule(document: string, rule: ValidationRule): ContentCheck {
    // Normalize document content for searching
    const normalizedDoc = document.toLowerCase();
    const searchField = rule.field.toLowerCase();

    // Check if the field identifier exists in the document
    // For section identifiers like "2.6.2.1 - a", we search for variations
    const fieldVariations = [
      searchField,
      searchField.replace(/\s*-\s*/g, ''), // Remove dashes
      searchField.replace(/\s+/g, ''), // Remove all spaces
      searchField.replace(/\./g, '\\.'), // Escape dots for regex
    ];

    let found = false;
    let foundContent = '';

    for (const variation of fieldVariations) {
      if (normalizedDoc.includes(variation)) {
        found = true;
        // Extract a snippet of content around the found field
        const index = normalizedDoc.indexOf(variation);
        const snippetStart = Math.max(0, index - 50);
        const snippetEnd = Math.min(document.length, index + 200);
        foundContent = document.substring(snippetStart, snippetEnd).trim();
        break;
      }
    }

    return {
      rule,
      passed: found,
      foundContent: found ? foundContent : undefined,
      missingReason: found ? undefined : `Section ${rule.field} not found in document`
    };
  }

  /**
   * Validate format requirements against document content
   * Checks that document meets format specifications from template
   * 
   * @param document - Extracted document text content
   * @param rules - Array of validation rules to check
   * @returns Array of FormatCheck results
   */
  validateFormatRequirements(document: string, rules: ValidationRule[]): FormatCheck[] {
    const formatRules = rules.filter(rule => rule.type === 'format_requirement');
    const checks: FormatCheck[] = [];

    for (const rule of formatRules) {
      const check = this.checkSingleFormatRule(document, rule);
      checks.push(check);
    }

    return checks;
  }

  /**
   * Check a single format requirement rule
   * Validates specific format requirements like data inputs, sources, etc.
   * 
   * @param document - Document text content
   * @param rule - Validation rule to check
   * @returns FormatCheck result
   */
  private checkSingleFormatRule(document: string, rule: ValidationRule): FormatCheck {
    const normalizedDoc = document.toLowerCase();

    // For format requirements, we check if the document contains
    // indicators of the required format elements
    
    // Extract key terms from the rule description to search for
    const keyTerms = this.extractKeyTermsFromDescription(rule.description);
    
    let foundTerms = 0;
    const foundDetails: string[] = [];

    for (const term of keyTerms) {
      if (normalizedDoc.includes(term.toLowerCase())) {
        foundTerms++;
        foundDetails.push(term);
      }
    }

    // Consider the format requirement met if at least 30% of key terms are found
    // This is a heuristic for POC - production would need more sophisticated validation
    const threshold = Math.max(1, Math.ceil(keyTerms.length * 0.3));
    const passed = foundTerms >= threshold;

    return {
      rule,
      passed,
      validationDetails: passed 
        ? `Found ${foundTerms}/${keyTerms.length} required elements: ${foundDetails.join(', ')}`
        : undefined,
      errorMessage: passed 
        ? undefined 
        : `Missing required format elements. Found only ${foundTerms}/${keyTerms.length} elements. Expected: ${keyTerms.slice(0, 5).join(', ')}${keyTerms.length > 5 ? '...' : ''}`
    };
  }

  /**
   * Extract key terms from rule description for validation
   * Parses the description to identify important terms to search for
   * 
   * @param description - Rule description text
   * @returns Array of key terms
   */
  private extractKeyTermsFromDescription(description: string): string[] {
    // Remove common words and extract meaningful terms
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'should', 'could', 'may', 'might', 'must', 'can', 'shall',
      'section', 'must', 'should', 'include', 'contain', 'reference', 'specified'
    ]);

    // Split description into words and filter
    const words = description
      .toLowerCase()
      .replace(/[^\w\s.-]/g, ' ') // Keep dots and dashes for section numbers
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word));

    // Remove duplicates and return
    return Array.from(new Set(words));
  }

  /**
   * Generate gap report from validation checks
   * Aggregates all validation results into a comprehensive gap report
   * 
   * @param checks - Array of all validation checks performed
   * @returns GapReport with gaps and statistics
   */
  generateGapReport(checks: ValidationCheck[]): GapReport {
    const gaps: ValidationGap[] = [];
    let criticalGaps = 0;
    let warningGaps = 0;
    let infoGaps = 0;

    // Process failed checks into gaps
    for (const check of checks) {
      if (!check.passed) {
        const gap: ValidationGap = {
          ruleId: check.rule.field,
          ruleName: check.rule.name,
          severity: check.rule.severity,
          category: check.rule.type === 'content_presence' ? 'missing_content' : 'format_error',
          description: check.rule.description,
          remediationSteps: [check.rule.remediationHint],
          required: check.rule.required
        };

        gaps.push(gap);

        // Count by severity
        switch (gap.severity) {
          case 'critical':
            criticalGaps++;
            break;
          case 'warning':
            warningGaps++;
            break;
          case 'info':
            infoGaps++;
            break;
        }
      }
    }

    const totalRules = checks.length;
    const passedRules = checks.filter(c => c.passed).length;
    const failedRules = totalRules - passedRules;
    const completenessPercentage = totalRules > 0 ? Math.round((passedRules / totalRules) * 100) : 0;

    return {
      totalRules,
      passedRules,
      failedRules,
      completenessPercentage,
      gaps,
      criticalGaps,
      warningGaps,
      infoGaps
    };
  }
}
