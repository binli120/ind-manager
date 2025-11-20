import { createLogger } from '@/lib/smart-editor/logger';

const logger = createLogger('SimpleSuggestions');

/**
 * Simple Suggestion Patterns Configuration
 *
 * This file contains trigger patterns and corresponding content for the smart suggestion system.
 * Each entry defines a pattern to match and the suggested content to display.
 */

export interface SimpleSuggestionPattern {
  // The text pattern to match (can be regex string or simple string)
  trigger: string;
  // Whether it's a regex pattern
  isRegex?: boolean;
  // The type of suggestion
  type: 'section' | 'topic' | 'continuation' | 'structure';
  // Category/name for this pattern
  category: string;
  // Context description shown to user
  description: string;
  // The suggested content to insert
  content: string;
}

/**
 * All suggestion patterns organized by type
 */
export const SUGGESTION_PATTERNS: SimpleSuggestionPattern[] = [
  // Section number patterns
  {
    trigger: '^1\\.?\\s*$',
    isRegex: true,
    type: 'section',
    category: 'Introduction',
    description:
      'I detected you\'re starting section "1." - Here\'s a structured introduction:',
    content: `Introduction

This section provides an overview of the main concepts and objectives that will be covered in this document. It establishes the foundation for understanding the subsequent analysis and presents the key questions that will be addressed.

Key points to cover:
• Background context and motivation
• Primary objectives and goals
• Scope and boundaries of the discussion
• Overview of methodology or approach`,
  },
  {
    trigger: '^2\\.?\\s*$',
    isRegex: true,
    type: 'section',
    category: 'Background',
    description:
      'I detected you\'re starting section "2." - Here\'s a structured background:',
    content: `Background

This section outlines the context and foundational information necessary to understand the subject matter. It provides the historical perspective and establishes the current state of knowledge in the field.

Key elements include:
• Historical development and evolution
• Current state of the field
• Relevant research and literature
• Key concepts and definitions
• Identified gaps or opportunities`,
  },
  {
    trigger: '^3\\.?\\s*$',
    isRegex: true,
    type: 'section',
    category: 'Methodology',
    description:
      'I detected you\'re starting section "3." - Here\'s a structured methodology:',
    content: `Methodology

This section describes the approach, methods, and procedures used in the analysis or implementation. It provides a clear roadmap of how the work was conducted and ensures reproducibility.

Components covered:
• Research approach and framework
• Data collection methods
• Analysis techniques and tools
• Quality assurance measures
• Limitations and constraints`,
  },
  {
    trigger: '^4\\.?\\s*$',
    isRegex: true,
    type: 'section',
    category: 'Results',
    description:
      'I detected you\'re starting section "4." - Here\'s a structured results template:',
    content: `Results

This section presents the findings, outcomes, and key data derived from the methodology. Results are presented objectively without interpretation, providing the foundation for subsequent analysis.

Key findings include:
• Primary outcomes and measurements
• Data analysis results
• Patterns and trends identified
• Unexpected findings or anomalies
• Statistical significance where applicable`,
  },
  // Topic keywords
  {
    trigger: 'meeting',
    type: 'topic',
    category: 'Meeting Documentation',
    description:
      'I detected content related to "meeting" - Here\'s a meeting template:',
    content: `Meeting Documentation

**Meeting Details:**
• Date: [Insert Date]
• Time: [Start Time] - [End Time]
• Location: [Physical Location / Virtual Platform]
• Meeting Type: [Planning / Review / Decision / Update]

**Attendees:**
• [Name] - [Title/Role]
• [Name] - [Title/Role]

**Agenda:**
1. Welcome and introductions
2. Review of previous action items
3. [Main Topic 1]
4. [Main Topic 2]
5. Next steps and action items
6. Closing remarks

**Action Items:**
• [Action] - [Owner] - [Due Date]`,
  },
  {
    trigger: 'project',
    type: 'topic',
    category: 'Project Planning',
    description:
      'I detected content related to "project" - Here\'s a project template:',
    content: `Project Overview

**Project Information:**
• Project Name: [Insert Project Name]
• Project Manager: [Name]
• Duration: [Start Date] - [End Date]
• Status: [Planning / Active / Completed]

**Team Members:**
• [Name] - [Role/Responsibility]
• [Name] - [Role/Responsibility]

**Project Objectives:**
• [Primary Objective 1]
• [Primary Objective 2]
• [Primary Objective 3]

**Key Deliverables:**
• [Deliverable 1] - [Due Date]
• [Deliverable 2] - [Due Date]

**Milestones:**
• [Milestone 1] - [Target Date]
• [Milestone 2] - [Target Date]`,
  },
  {
    trigger: 'report',
    type: 'topic',
    category: 'Report Structure',
    description:
      'I detected content related to "report" - Here\'s a report template:',
    content: `Report Structure

**Executive Summary**
[Brief overview of key findings and recommendations]

**1. Introduction**
• Purpose and scope of the report
• Background information
• Methodology overview

**2. Findings**
• Key data and observations
• Analysis and insights
• Supporting evidence

**3. Recommendations**
• Actionable next steps
• Priority ranking
• Timeline for implementation

**4. Conclusion**
• Summary of main points
• Future considerations`,
  },
  // Continuation words
  {
    trigger: 'furthermore',
    type: 'continuation',
    category: 'Addition',
    description: 'I detected you want to add more with "furthermore":',
    content:
      'Furthermore, it is important to consider the additional factors that may influence the outcome and contribute to a more comprehensive understanding of the situation.',
  },
  {
    trigger: 'however',
    type: 'continuation',
    category: 'Contrast',
    description: 'I detected you want to contrast with "however":',
    content:
      'However, there are several limitations and alternative perspectives that should be taken into account when interpreting these results and drawing conclusions.',
  },
  {
    trigger: 'therefore',
    type: 'continuation',
    category: 'Conclusion',
    description: 'I detected you want to conclude with "therefore":',
    content:
      'Therefore, based on the evidence presented and the analysis conducted, it can be concluded that the findings support the initial hypothesis and provide valuable insights.',
  },
];

/**
 * Find a matching suggestion pattern for the given text
 */
export function findSuggestionPattern(
  text: string,
  currentLine: string
): SimpleSuggestionPattern | null {
  logger.debug('findSuggestionPattern called', {
    textSnippet: text.slice(-100),
    currentLine,
  });

  for (const pattern of SUGGESTION_PATTERNS) {
    logger.debug('Testing pattern', {
      trigger: pattern.trigger,
      isRegex: pattern.isRegex,
      category: pattern.category,
    });

    if (pattern.isRegex) {
      // For regex patterns, test against current line (mainly for section numbers)
      const regex = new RegExp(pattern.trigger);
      const trimmedLine = currentLine.trim();
      const regexResult = regex.test(trimmedLine);
      logger.debug('Regex test result', {
        regex: regex.toString(),
        testString: trimmedLine,
        result: regexResult,
      });

      if (regexResult) {
        logger.debug('Regex match found', { pattern });
        return pattern;
      }
    } else {
      // For simple string patterns, check if text contains the trigger
      const textMatch = text
        .toLowerCase()
        .includes(pattern.trigger.toLowerCase());
      logger.debug('String pattern test', {
        trigger: pattern.trigger,
        textMatch,
      });

      if (textMatch) {
        logger.debug('String match found', { pattern });
        return pattern;
      }
    }
  }

  logger.debug('No suggestion pattern matched');
  return null;
}

export default SUGGESTION_PATTERNS;
// Author: Bin Lee (blee@filynai.com)
// Description: Supplies helper utilities for generating contextual content suggestions inside the editor.
