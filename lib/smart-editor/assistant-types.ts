export type AssistantCommandStatus = 'success' | 'info' | 'error';

export interface AssistantCommandResult {
  status: AssistantCommandStatus;
  message: string;
  content?: string;
  suggestions?: string[];
}

export interface AssistantCommandHint {
  command: string;
  description: string;
}

export interface AssistantCommandOptions {
  sectionHint?: string;
  rawInput?: string;
}

export interface AssistantContextSnapshot {
  sectionName?: string | null;
  documentTitle?: string | null;
}

export interface AssistantApi {
  runGapAnalysis?: () => Promise<AssistantCommandResult>;
  runSummary?: (options?: AssistantCommandOptions) => Promise<AssistantCommandResult>;
  listHints?: () => AssistantCommandHint[];
  getContext?: () => AssistantContextSnapshot;
  openModule?: (moduleName: string) => Promise<AssistantCommandResult>;
}
// Author: Bin Lee (blee@filynai.com)
// Description: Declares shared type definitions for the in-app assistant command system.
