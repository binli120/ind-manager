// Author: Bin Lee (blee@filynai.com)
// Description: Provides heuristics to classify IND submission documents into CTD module sections.

interface ClassificationInput {
  title?: string;
  subject?: string;
  text?: string;
}

interface SectionRule {
  sectionCode: string;
  sectionTitle: string;
  keywords: string[];
  strongSignals?: string[];
}

export interface IndClassification {
  sectionCode: string | null;
  sectionTitle: string;
  confidence: number;
  matchedTerms: string[];
}

const SECTION_RULES: SectionRule[] = [
  {
    sectionCode: '2.3',
    sectionTitle: 'Quality Overall Summary',
    keywords: [
      'quality overall summary',
      'chemistry manufacturing and controls',
      'cmc',
      'drug substance',
      'drug product',
      'manufacturing process',
      'control strategy',
      'lot release',
      'stability data',
    ],
    strongSignals: ['module 2.3', 'quality module'],
  },
  {
    sectionCode: '2.4',
    sectionTitle: 'Nonclinical Overview',
    keywords: [
      'nonclinical overview',
      'pharmacology',
      'toxicology',
      'safety pharmacology',
      'repeat-dose',
      'noael',
      'glp',
      'animal model',
      'nonclinical program',
    ],
    strongSignals: ['module 2.4', 'nonclinical summary'],
  },
  {
    sectionCode: '2.5',
    sectionTitle: 'Clinical Overview',
    keywords: [
      'clinical overview',
      'efficacy summary',
      'safety summary',
      'benefit-risk',
      'clinical development',
      'patient population',
      'risk management plan',
      'clinical pharmacology',
    ],
    strongSignals: ['module 2.5', 'clinical summary'],
  },
  {
    sectionCode: '2.6',
    sectionTitle: 'Nonclinical Written Summaries',
    keywords: [
      'module 2.6',
      'pharmacology written summary',
      'toxicology written summary',
      'carcinogenicity',
      'genotoxicity',
      'reproductive toxicity',
      'nonclinical summary',
    ],
  },
  {
    sectionCode: '2.7',
    sectionTitle: 'Clinical Written Summaries',
    keywords: [
      'module 2.7',
      'clinical summary',
      'summary of clinical efficacy',
      'summary of clinical safety',
      'summary of biopharmaceutics',
      'summary of clinical pharmacology',
    ],
  },
];

const DEFAULT_CLASSIFICATION: IndClassification = {
  sectionCode: null,
  sectionTitle: 'Unclassified IND Document',
  confidence: 0,
  matchedTerms: [],
};

function normalise(value?: string): string {
  return value?.toLowerCase() ?? '';
}

function collectMatches(source: string, keywords: string[]): string[] {
  const matches: string[] = [];
  for (const keyword of keywords) {
    if (source.includes(keyword)) {
      matches.push(keyword);
    }
  }
  return matches;
}

function scoreRule(input: ClassificationInput, rule: SectionRule) {
  const title = normalise(input.title);
  const subject = normalise(input.subject);
  const textSnippet = normalise(input.text?.slice(0, 10000));

  const matches = new Set<string>();
  let score = 0;

  for (const keyword of rule.keywords) {
    const keywordLower = keyword.toLowerCase();
    if (title.includes(keywordLower)) {
      matches.add(keyword);
      score += 4;
    }
    if (subject.includes(keywordLower)) {
      matches.add(keyword);
      score += 2;
    }
    if (textSnippet.includes(keywordLower)) {
      matches.add(keyword);
      score += 1;
    }
  }

  if (rule.strongSignals) {
    const strongMatches = collectMatches(title + ' ' + subject, rule.strongSignals);
    strongMatches.forEach((term) => matches.add(term));
    score += strongMatches.length * 3;
  }

  return { score, matches: Array.from(matches) };
}

export function classifyIndDocument(input: ClassificationInput): IndClassification {
  let bestRule: SectionRule | null = null;
  let bestScore = 0;
  let bestMatches: string[] = [];

  for (const rule of SECTION_RULES) {
    const { score, matches } = scoreRule(input, rule);
    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
      bestMatches = matches;
    }
  }

  if (!bestRule || bestScore === 0) {
    return DEFAULT_CLASSIFICATION;
  }

  const confidence = Math.min(1, bestScore / 12);

  return {
    sectionCode: bestRule.sectionCode,
    sectionTitle: bestRule.sectionTitle,
    confidence,
    matchedTerms: bestMatches,
  };
}
