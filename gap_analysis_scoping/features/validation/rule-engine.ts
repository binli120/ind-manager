/**
 * Rule Engine for Gap Analysis Completeness Check
 * 
 * Executes validation rules against document content and calculates
 * completeness scores. Provides rule execution, scoring, and issue prioritization.
 */

import { ValidationRule } from './template-parser';

export interface RuleCondition {
  field: string;
  operator: 'contains' | 'equals' | 'matches' | 'exists' | 'length_gte' | 'length_lte';
  value?: any;
}

export interface RuleResult {
  rule: ValidationRule;
  passed: boolean;
  score: number; // 0-100 score for this rule
  details?: string;
  errorMessage?: string;
}

export interface CompletenessScore {
  overallScore: number; // 0-100
  totalRules: number;
  passedRules: number;
  failedRules: number;
  criticalPassed: number;
  criticalFailed: number;
  warningPassed: number;
  warningFailed: number;
  infoPassed: number;
  infoFailed: number;
  weightedScore: number; // Weighted by severity
}

export interface PrioritizedIssue {
  rule: ValidationRule;
  priority: number; // 1-10, higher = more urgent
  severity: 'critical' | 'warning' | 'info';
  required: boolean;
  impact: 'high' | 'medium' | 'low';
  remediationHint: string;
}

/**
 * RuleEngine class for executing validation rules and calculating scores
 * Stateless processing of validation rules against document content
 */
export class RuleEngine {
  /**
   * Execute a single validation rule against document content
   * 
   * @param rule - ValidationRule to execute
   * @param document - Document content (string or object)
   * @returns RuleResult with pass/fail status and details
   */
  executeRule(rule: ValidationRule, document: any): RuleResult {
    try {
      // Handle different document types
      const documentContent = typeof document === 'string' 
        ? document 
        : JSON.stringify(document);

      const normalizedContent = documentContent.toLowerCase();
      const searchField = rule.field.toLowerCase();

      let passed = false;
      let details = '';

      // Execute rule based on type
      if (rule.type === 'content_presence') {
        passed = this.checkContentPresence(normalizedContent, searchField, rule);
        details = passed 
          ? `Content for field '${rule.field}' found in document`
          : `Content for field '${rule.field}' not found in document`;
      } else if (rule.type === 'format_requirement') {
        passed = this.checkFormatRequirement(normalizedContent, rule);
        details = passed
          ? `Format requirements for '${rule.field}' met`
          : `Format requirements for '${rule.field}' not met`;
      }

      // Calculate score for this rule (100 if passed, 0 if failed)
      const score = passed ? 100 : 0;

      return {
        rule,
        passed,
        score,
        details: passed ? details : undefined,
        errorMessage: passed ? undefined : details
      };
    } catch (error) {
      return {
        rule,
        passed: false,
        score: 0,
        errorMessage: `Rule execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check content presence for a field
   * 
   * @param content - Normalized document content
   * @param field - Field to search for
   * @param rule - Validation rule
   * @returns True if content is present
   */
  private checkContentPresence(content: string, field: string, rule: ValidationRule): boolean {
    // Generate field variations to search for
    const fieldVariations = [
      field,
      field.replace(/\s*-\s*/g, ''), // Remove dashes
      field.replace(/\s+/g, ''), // Remove all spaces
      field.replace(/\./g, ''), // Remove dots
      field.replace(/[^a-z0-9]/g, ''), // Remove all special chars
    ];

    // Check if any variation exists in content
    for (const variation of fieldVariations) {
      if (content.includes(variation)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check format requirement
   * 
   * @param content - Normalized document content
   * @param rule - Validation rule
   * @returns True if format requirement is met
   */
  private checkFormatRequirement(content: string, rule: ValidationRule): boolean {
    // Extract key terms from rule description
    const keyTerms = this.extractKeyTerms(rule.description);
    
    if (keyTerms.length === 0) {
      // If no key terms, check if field exists
      return content.includes(rule.field.toLowerCase());
    }

    // Count how many key terms are found
    let foundCount = 0;
    for (const term of keyTerms) {
      if (content.includes(term.toLowerCase())) {
        foundCount++;
      }
    }

    // Require at least 30% of key terms to be present
    const threshold = Math.max(1, Math.ceil(keyTerms.length * 0.3));
    return foundCount >= threshold;
  }

  /**
   * Extract key terms from description for validation
   * 
   * @param description - Rule description
   * @returns Array of key terms
   */
  private extractKeyTerms(description: string): string[] {
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'should', 'could', 'may', 'might', 'must', 'can', 'shall',
      'section', 'must', 'should', 'include', 'contain', 'reference', 'specified'
    ]);

    const words = description
      .toLowerCase()
      .replace(/[^\w\s.-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word));

    return Array.from(new Set(words));
  }

  /**
   * Evaluate conditions against content
   * 
   * @param conditions - Array of rule conditions to evaluate
   * @param content - Content to evaluate against
   * @returns True if all conditions are met
   */
  evaluateConditions(conditions: RuleCondition[], content: any): boolean {
    if (conditions.length === 0) {
      return true;
    }

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const normalizedContent = contentStr.toLowerCase();

    for (const condition of conditions) {
      const fieldValue = this.extractFieldValue(content, condition.field);
      
      switch (condition.operator) {
        case 'contains':
          if (!normalizedContent.includes(String(condition.value).toLowerCase())) {
            return false;
          }
          break;
        
        case 'equals':
          if (fieldValue !== condition.value) {
            return false;
          }
          break;
        
        case 'matches':
          if (condition.value instanceof RegExp) {
            if (!condition.value.test(String(fieldValue))) {
              return false;
            }
          }
          break;
        
        case 'exists':
          if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
            return false;
          }
          break;
        
        case 'length_gte':
          if (String(fieldValue).length < Number(condition.value)) {
            return false;
          }
          break;
        
        case 'length_lte':
          if (String(fieldValue).length > Number(condition.value)) {
            return false;
          }
          break;
        
        default:
          return false;
      }
    }

    return true;
  }

  /**
   * Extract field value from content
   * 
   * @param content - Content object or string
   * @param field - Field name to extract
   * @returns Field value or undefined
   */
  private extractFieldValue(content: any, field: string): any {
    if (typeof content === 'string') {
      return content;
    }

    if (typeof content === 'object' && content !== null) {
      return content[field];
    }

    return undefined;
  }

  /**
   * Calculate overall completeness score from rule results
   * 
   * @param results - Array of RuleResult from executed rules
   * @returns CompletenessScore with detailed scoring breakdown
   */
  calculateCompleteness(results: RuleResult[]): CompletenessScore {
    const totalRules = results.length;
    const passedRules = results.filter(r => r.passed).length;
    const failedRules = totalRules - passedRules;

    // Count by severity
    let criticalPassed = 0;
    let criticalFailed = 0;
    let warningPassed = 0;
    let warningFailed = 0;
    let infoPassed = 0;
    let infoFailed = 0;

    for (const result of results) {
      const severity = result.rule.severity;
      
      if (result.passed) {
        if (severity === 'critical') criticalPassed++;
        else if (severity === 'warning') warningPassed++;
        else if (severity === 'info') infoPassed++;
      } else {
        if (severity === 'critical') criticalFailed++;
        else if (severity === 'warning') warningFailed++;
        else if (severity === 'info') infoFailed++;
      }
    }

    // Calculate simple overall score (percentage of passed rules)
    const overallScore = totalRules > 0 
      ? Math.round((passedRules / totalRules) * 100) 
      : 0;

    // Calculate weighted score (critical = 3x, warning = 2x, info = 1x)
    const criticalWeight = 3;
    const warningWeight = 2;
    const infoWeight = 1;

    const totalWeight = 
      (criticalPassed + criticalFailed) * criticalWeight +
      (warningPassed + warningFailed) * warningWeight +
      (infoPassed + infoFailed) * infoWeight;

    const achievedWeight =
      criticalPassed * criticalWeight +
      warningPassed * warningWeight +
      infoPassed * infoWeight;

    const weightedScore = totalWeight > 0
      ? Math.round((achievedWeight / totalWeight) * 100)
      : 0;

    return {
      overallScore,
      totalRules,
      passedRules,
      failedRules,
      criticalPassed,
      criticalFailed,
      warningPassed,
      warningFailed,
      infoPassed,
      infoFailed,
      weightedScore
    };
  }

  /**
   * Prioritize issues by severity and impact
   * Orders failed rules by urgency for remediation
   * 
   * @param results - Array of RuleResult from executed rules
   * @returns Array of PrioritizedIssue sorted by priority (highest first)
   */
  prioritizeIssues(results: RuleResult[]): PrioritizedIssue[] {
    // Filter to only failed rules
    const failedResults = results.filter(r => !r.passed);

    // Convert to prioritized issues
    const issues: PrioritizedIssue[] = failedResults.map(result => {
      const rule = result.rule;
      
      // Calculate priority (1-10 scale)
      let priority = 5; // Base priority
      
      // Adjust by severity
      if (rule.severity === 'critical') {
        priority += 4; // Critical: 9-10
      } else if (rule.severity === 'warning') {
        priority += 2; // Warning: 7-8
      } else {
        priority += 0; // Info: 5-6
      }

      // Adjust by required status
      if (rule.required) {
        priority += 1;
      }

      // Cap at 10
      priority = Math.min(10, priority);

      // Determine impact
      let impact: 'high' | 'medium' | 'low' = 'medium';
      if (rule.severity === 'critical' && rule.required) {
        impact = 'high';
      } else if (rule.severity === 'info' && !rule.required) {
        impact = 'low';
      }

      return {
        rule,
        priority,
        severity: rule.severity,
        required: rule.required,
        impact,
        remediationHint: rule.remediationHint
      };
    });

    // Sort by priority (highest first), then by severity, then by required status
    issues.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      
      // If same priority, sort by severity
      const severityOrder = { critical: 3, warning: 2, info: 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }

      // If same severity, required rules first
      if (a.required !== b.required) {
        return a.required ? -1 : 1;
      }

      return 0;
    });

    return issues;
  }
}
