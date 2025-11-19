/**
 * Smart Suggestion System Configuration
 *
 * This file contains all trigger patterns, regex expressions, and corresponding
 * content templates for the intelligent writing assistant.
 */

export interface SuggestionTemplate {
  pattern: string | RegExp;
  type: 'section' | 'topic' | 'continuation' | 'structure';
  context: string;
  content: string;
  category: string;
}

export interface SuggestionConfig {
  sections: SuggestionTemplate[];
  topics: SuggestionTemplate[];
  continuations: SuggestionTemplate[];
  structures: SuggestionTemplate[];
}

export const SUGGESTION_CONFIG: SuggestionConfig = {
  // Section Number Patterns
  sections: [
    {
      pattern: /^1\.?\s*$/,
      type: 'section',
      category: 'Introduction',
      context:
        'Starting with section "1." - Here\'s a structured introduction template:',
      content: `Introduction

This section provides an overview of the main concepts and objectives that will be covered in this document. It establishes the foundation for understanding the subsequent analysis and presents the key questions that will be addressed.

Key points to cover:
• Background context and motivation
• Primary objectives and goals
• Scope and boundaries of the discussion
• Overview of methodology or approach`,
    },
    {
      pattern: /^2\.?\s*$/,
      type: 'section',
      category: 'Background',
      context:
        'Starting with section "2." - Here\'s a structured background template:',
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
      pattern: /^3\.?\s*$/,
      type: 'section',
      category: 'Methodology',
      context:
        'Starting with section "3." - Here\'s a structured methodology template:',
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
      pattern: /^4\.?\s*$/,
      type: 'section',
      category: 'Results',
      context:
        'Starting with section "4." - Here\'s a structured results template:',
      content: `Results

This section presents the findings, outcomes, and key data derived from the methodology. Results are presented objectively without interpretation, providing the foundation for subsequent analysis.

Key findings include:
• Primary outcomes and measurements
• Data analysis results
• Patterns and trends identified
• Unexpected findings or anomalies
• Statistical significance where applicable`,
    },
    {
      pattern: /^5\.?\s*$/,
      type: 'section',
      category: 'Discussion',
      context:
        'Starting with section "5." - Here\'s a structured discussion template:',
      content: `Discussion

This section analyzes and interprets the results, exploring their implications and significance. It connects the findings back to the original objectives and broader context.

Discussion points:
• Interpretation of key findings
• Implications and significance
• Comparison with existing knowledge
• Strengths and limitations
• Future research directions`,
    },
    {
      pattern: /^6\.?\s*$/,
      type: 'section',
      category: 'Conclusion',
      context:
        'Starting with section "6." - Here\'s a structured conclusion template:',
      content: `Conclusion

This section summarizes the key findings and their broader implications, providing final thoughts and recommendations. It ties together all elements of the work into a cohesive summary.

Conclusion elements:
• Summary of main findings
• Achievement of objectives
• Key contributions and insights
• Practical implications
• Recommendations for action
• Final thoughts and reflection`,
    },
    // Subsection patterns
    {
      pattern: /^(\d+)\.1\.?\s*$/,
      type: 'section',
      category: 'Subsection - Overview',
      context: "Starting a subsection - Here's an overview template:",
      content: `Overview

This subsection provides a detailed introduction to the main topic and its significance within the broader context. It serves as a roadmap for the following sections.

• Definition and scope
• Key components or elements
• Relationship to main topic
• Structure of following sections`,
    },
    {
      pattern: /^(\d+)\.2\.?\s*$/,
      type: 'section',
      category: 'Subsection - Details',
      context: "Starting a subsection - Here's a detailed analysis template:",
      content: `Detailed Analysis

This subsection provides an in-depth examination of specific aspects, offering detailed insights and comprehensive coverage of the topic.

• Comprehensive breakdown
• Technical specifications
• Detailed processes or procedures
• Supporting evidence and examples`,
    },
  ],

  // Topic Keywords
  topics: [
    {
      pattern: /\bmeetings?\b/i,
      type: 'topic',
      category: 'Meeting Documentation',
      context:
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

**Key Decisions:**
• [Decision 1]
• [Decision 2]

**Action Items:**
• [Action] - [Owner] - [Due Date]
• [Action] - [Owner] - [Due Date]`,
    },
    {
      pattern: /\bprojects?\b/i,
      type: 'topic',
      category: 'Project Planning',
      context:
        'I detected content related to "project" - Here\'s a project template:',
      content: `Project Overview

**Project Information:**
• Project Name: [Insert Project Name]
• Project Manager: [Name]
• Duration: [Start Date] - [End Date]
• Budget: [Amount]
• Status: [Planning / Active / On Hold / Completed]

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
• [Milestone 2] - [Target Date]

**Risks and Mitigation:**
• [Risk] - [Mitigation Strategy]`,
    },
    {
      pattern: /\breports?\b/i,
      type: 'topic',
      category: 'Report Structure',
      context:
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

**3. Analysis**
• Interpretation of findings
• Implications and significance
• Comparison with benchmarks

**4. Recommendations**
• Actionable next steps
• Priority ranking
• Resource requirements
• Timeline for implementation

**5. Conclusion**
• Summary of main points
• Final observations
• Future considerations

**Appendices**
• Supporting data
• Detailed methodologies
• Additional resources`,
    },
    {
      pattern: /\banalysis|analyses\b/i,
      type: 'topic',
      category: 'Analysis Framework',
      context:
        'I detected content related to "analysis" - Here\'s an analysis template:',
      content: `Analysis Framework

**Problem Statement**
[Clear definition of the issue or question being analyzed]

**Scope and Boundaries**
• What is included in this analysis
• What is excluded and why
• Time frame and limitations

**Data Sources**
• Primary data sources
• Secondary research materials
• Data collection methods
• Quality and reliability assessment

**Methodology**
• Analytical approach and framework
• Tools and techniques used
• Assumptions and constraints

**Key Findings**
• Primary insights and patterns
• Quantitative results
• Qualitative observations
• Significant correlations

**Implications**
• What the findings mean
• Impact on stakeholders
• Strategic considerations
• Recommended actions`,
    },
    {
      pattern: /\bresearch\b/i,
      type: 'topic',
      category: 'Research Design',
      context:
        'I detected content related to "research" - Here\'s a research template:',
      content: `Research Design

**Research Question**
[Clear, specific question that guides the research]

**Literature Review**
• Existing research and knowledge
• Key theories and frameworks
• Gaps identified in current understanding

**Research Methodology**
• Research approach (qualitative/quantitative/mixed)
• Data collection methods
• Sample size and selection criteria
• Ethical considerations

**Data Analysis Plan**
• Analysis techniques and tools
• Variables and measurements
• Statistical methods (if applicable)

**Expected Outcomes**
• Anticipated findings
• Contribution to knowledge
• Practical applications

**Timeline and Resources**
• Research phases and milestones
• Required resources and budget
• Potential risks and mitigation`,
    },
  ],

  // Continuation Words
  continuations: [
    {
      pattern: /\bfurthermore\b/i,
      type: 'continuation',
      category: 'Addition',
      context:
        'I detected you want to add more information with "furthermore":',
      content:
        'Furthermore, it is important to consider the additional factors that may influence the outcome and contribute to a more comprehensive understanding of the situation.',
    },
    {
      pattern: /\bhowever\b/i,
      type: 'continuation',
      category: 'Contrast',
      context: 'I detected you want to present a contrast with "however":',
      content:
        'However, there are several limitations and alternative perspectives that should be taken into account when interpreting these results and drawing conclusions.',
    },
    {
      pattern: /\btherefore\b/i,
      type: 'continuation',
      category: 'Conclusion',
      context: 'I detected you want to draw a conclusion with "therefore":',
      content:
        'Therefore, based on the evidence presented and the analysis conducted, it can be concluded that the findings support the initial hypothesis and provide valuable insights for future work.',
    },
    {
      pattern: /\badditionally\b/i,
      type: 'continuation',
      category: 'Addition',
      context:
        'I detected you want to add supplementary information with "additionally":',
      content:
        'Additionally, further research and investigation are needed to fully understand the implications of these findings and to explore potential applications in different contexts.',
    },
    {
      pattern: /\bmeanwhile\b/i,
      type: 'continuation',
      category: 'Parallel',
      context:
        'I detected you want to present parallel information with "meanwhile":',
      content:
        'Meanwhile, other developments in the field suggest that alternative approaches and methodologies may be worth exploring to complement the current findings.',
    },
    {
      pattern: /\bconsequently\b/i,
      type: 'continuation',
      category: 'Result',
      context: 'I detected you want to show a result with "consequently":',
      content:
        'Consequently, these findings have significant implications for policy makers, practitioners, and researchers working in related fields.',
    },
    {
      pattern: /\bnevertheless\b/i,
      type: 'continuation',
      category: 'Contrast',
      context:
        'I detected you want to acknowledge but contrast with "nevertheless":',
      content:
        'Nevertheless, despite these challenges and limitations, the research provides valuable insights that contribute to our understanding of the subject matter.',
    },
    {
      pattern: /\bin contrast\b/i,
      type: 'continuation',
      category: 'Contrast',
      context: 'I detected you want to show a contrast with "in contrast":',
      content:
        'In contrast to the previous findings, this analysis reveals different patterns and suggests alternative explanations for the observed phenomena.',
    },
  ],

  // Document Structures
  structures: [
    {
      pattern: /\bintroduction\b/i,
      type: 'structure',
      category: 'Document Opening',
      context:
        "I detected you're starting an introduction - Here's a structure template:",
      content: `Introduction

This document presents [brief description of the main topic or purpose]. The following sections provide a comprehensive examination of [key areas to be covered].

**Purpose and Objectives**
The primary purpose of this [document/report/analysis] is to [state main goal]. Specific objectives include:
• [Objective 1]
• [Objective 2]
• [Objective 3]

**Scope**
This work covers [define boundaries] while focusing specifically on [key areas]. The analysis spans [time period/geographic area/specific domain] and includes [key elements].

**Structure**
The remainder of this document is organized as follows:
• Section 2: [Brief description]
• Section 3: [Brief description]
• Section 4: [Brief description]`,
    },
    {
      pattern: /\bconclusion\b/i,
      type: 'structure',
      category: 'Document Closing',
      context:
        "I detected you're writing a conclusion - Here's a structure template:",
      content: `Conclusion

This [document/analysis/study] has examined [restate main topic] and provided insights into [key areas covered]. The findings contribute to our understanding of [broader field or implications].

**Key Findings**
The analysis revealed several important findings:
• [Key Finding 1]
• [Key Finding 2]  
• [Key Finding 3]

**Implications**
These results have significant implications for [stakeholders/field/practice]:
• [Implication 1]
• [Implication 2]

**Recommendations**
Based on the findings, the following recommendations are proposed:
• [Recommendation 1]
• [Recommendation 2]

**Future Work**
Future research should focus on [areas for future investigation] to further advance our understanding of [topic area].`,
    },
  ],
};

// Helper function to match text against patterns
export function findMatchingPattern(
  text: string,
  currentLine: string
): SuggestionTemplate | null {
  // Check all pattern categories
  const allPatterns = [
    ...SUGGESTION_CONFIG.sections,
    ...SUGGESTION_CONFIG.topics,
    ...SUGGESTION_CONFIG.continuations,
    ...SUGGESTION_CONFIG.structures,
  ];

  for (const template of allPatterns) {
    if (template.pattern instanceof RegExp) {
      if (
        template.type === 'section' &&
        template.pattern.test(currentLine.trim())
      ) {
        return template;
      } else if (
        template.type !== 'section' &&
        template.pattern.test(text.toLowerCase())
      ) {
        return template;
      }
    } else if (typeof template.pattern === 'string') {
      if (text.toLowerCase().includes(template.pattern.toLowerCase())) {
        return template;
      }
    }
  }

  return null;
}

// Export individual categories for direct access
export const SECTION_PATTERNS = SUGGESTION_CONFIG.sections;
export const TOPIC_PATTERNS = SUGGESTION_CONFIG.topics;
export const CONTINUATION_PATTERNS = SUGGESTION_CONFIG.continuations;
export const STRUCTURE_PATTERNS = SUGGESTION_CONFIG.structures;
// Author: Bin Lee (blee@filynai.com)
// Description: Defines the configuration for structured writing suggestions used throughout the editor.
