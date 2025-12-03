'use client';

// Author: Bin Lee (blee@filynai.com)
// Description: Implements the assistant chat UI with command parsing for workspace automations.

import {
  Bot,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Send,
  User,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import type {
  AssistantApi,
  AssistantCommandHint,
  AssistantCommandResult,
} from '@/lib/smart-editor/assistant-types';

interface ChatInterfaceProps {
  selectedDocument: string | null;
  documentTitle?: string | null;
  sectionName?: string | null;
  assistantApi?: AssistantApi;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  status?: AssistantCommandResult['status'];
}

const deriveSectionCode = (sectionName?: string | null): string | null => {
  const match = sectionName?.match(/\s*([0-9]+\.[0-9]+)/);
  return match ? match[1] : null;
};

const buildDefaultHints = (sectionName?: string | null): AssistantCommandHint[] => {
  const code = deriveSectionCode(sectionName) ?? 'current section';
  return [
    {
      command: 'gap analyze',
      description: 'Run a gap analysis on the active document section.',
    },
    {
      command: deriveSectionCode(sectionName) ? `summary ${code}` : 'summary',
      description: `Generate a structured summary for ${sectionName ?? 'the active section'}.`,
    },
    {
      command: 'help',
      description: 'List the available assistant commands.',
    },
  ];
};

const buildWelcomeContent = (
  sectionName?: string | null,
  documentTitle?: string | null,
  hints: AssistantCommandHint[] = []
): string => {
  const sectionLine = sectionName
    ? `Current section: ${sectionName}.`
    : 'Select a section to unlock more targeted commands.';
  const docLine = documentTitle ? `Focused document: ${documentTitle}.` : '';
  const hintLines = hints
    .slice(0, 3)
    .map((hint) => `• ${hint.command} — ${hint.description}`)
    .join('\n');

  const lines = [
    "Hi! I'm your workspace assistant.",
    sectionLine,
    docLine,
    hintLines ? '\nTry commands like:\n' + hintLines : '',
    '\nType "help" to see everything I can do.',
  ].filter(Boolean);

  return lines.join('\n');
};

const createAssistantMessage = (
  content: string,
  status: AssistantCommandResult['status'] = 'info',
  suggestions: string[] = []
): ChatMessage => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  type: 'assistant',
  content,
  timestamp: new Date(),
  suggestions,
  status,
});

const getMessageBubbleClasses = (message: ChatMessage): string => {
  if (message.type === 'user') {
    return 'bg-secondary text-secondary-foreground ml-3 max-w-[85%]';
  }

  if (message.status === 'error') {
    return 'bg-destructive/10 border border-destructive/40 text-destructive-foreground';
  }

  if (message.status === 'success') {
    return 'bg-emerald-50 border border-emerald-300 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100';
  }

  return 'bg-muted text-foreground';
};

export function ChatInterface({
  selectedDocument,
  documentTitle,
  sectionName,
  assistantApi,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const hints = buildDefaultHints(sectionName);
    return [
      createAssistantMessage(
        buildWelcomeContent(sectionName, documentTitle, hints),
        'info',
        hints.map((hint) => hint.command)
      ),
    ];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const getHints = useCallback((): AssistantCommandHint[] => {
    const dynamicHints = assistantApi?.listHints?.();
    if (dynamicHints && dynamicHints.length > 0) {
      return dynamicHints;
    }
    return buildDefaultHints(sectionName);
  }, [assistantApi, sectionName]);

  const currentHints = useMemo(() => getHints(), [getHints]);
  const baseSuggestions = useMemo(
    () => currentHints.map((hint) => hint.command),
    [currentHints]
  );

  useEffect(() => {
    setMessages((prev) => {
      const hasUserMessages = prev.some((message) => message.type === 'user');
      if (hasUserMessages) {
        return prev;
      }

      const welcomeContent = buildWelcomeContent(sectionName, documentTitle, currentHints);
      const suggestions = baseSuggestions;

      if (prev.length === 0) {
        return [createAssistantMessage(welcomeContent, 'info', suggestions)];
      }

      const [first, ...rest] = prev;
      if (first.type !== 'assistant') {
        return prev;
      }

      if (
        first.content === welcomeContent &&
        (first.suggestions?.join('|') ?? '') === suggestions.join('|')
      ) {
        return prev;
      }

      const updatedFirst: ChatMessage = {
        ...first,
        id: 'welcome',
        content: welcomeContent,
        suggestions,
      };

      return [updatedFirst, ...rest];
    });
  }, [baseSuggestions, currentHints, documentTitle, sectionName]);

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  }, []);

  const processAssistantInput = useCallback(
    async (rawInput: string): Promise<ChatMessage> => {
      const trimmed = rawInput.trim();
      const normalized = trimmed.toLowerCase();
      const hints = getHints();
      const defaultSuggestions = hints.map((hint) => hint.command);

      const buildFromResult = (result: AssistantCommandResult) => {
        const suggestions =
          result.suggestions && result.suggestions.length > 0
            ? result.suggestions
            : defaultSuggestions;
        const body = result.content
          ? `${result.message}\n\n${result.content}`
          : result.message;
        return createAssistantMessage(body, result.status, suggestions);
      };

      if (!trimmed) {
        return createAssistantMessage('Say something and I will help.', 'info', defaultSuggestions);
      }

      if (!assistantApi) {
        const content = [
          "I'm getting the editor ready. Try again in a moment.",
          '',
          buildWelcomeContent(sectionName, documentTitle, hints),
        ]
          .filter(Boolean)
          .join('\n');
        return createAssistantMessage(content, 'info', defaultSuggestions);
      }

      if (normalized === 'help' || normalized === 'commands' || normalized === 'menu') {
        const helpLines = hints.map((hint) => `• ${hint.command} — ${hint.description}`);
        const content = ['Here are the commands I can run:', ...helpLines].join('\n');
        return createAssistantMessage(content, 'info', defaultSuggestions);
      }

      const gapMatch = normalized.match(/\bgap(\s+(analysis|analyse|analyze))?\b/);
      if (gapMatch) {
        if (!assistantApi.runGapAnalysis) {
          return createAssistantMessage(
            'Gap analysis is not available in this workspace view.',
            'info',
            defaultSuggestions
          );
        }
        try {
          const outcome = await assistantApi.runGapAnalysis();
          return buildFromResult(outcome);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Gap analysis command failed.';
          return createAssistantMessage(message, 'error', defaultSuggestions);
        }
      }

      const summaryDetected = normalized.match(/\b(summary|summarize|summarise)\b/);
      if (summaryDetected) {
        if (!assistantApi.runSummary) {
          return createAssistantMessage(
            'Summary generation is not available in this workspace view.',
            'info',
            defaultSuggestions
          );
        }

        const sectionHintMatch = normalized.match(/\b([0-9]+\.[0-9]+)\b/);
        const sectionHint = sectionHintMatch?.[1];

        try {
          const outcome = await assistantApi.runSummary({
            sectionHint,
            rawInput: trimmed,
          });
          return buildFromResult(outcome);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Summary command failed.';
          return createAssistantMessage(message, 'error', defaultSuggestions);
        }
      }

      const openMatch = normalized.match(/^open\s+(.+)/);
      if (openMatch) {
        const moduleName = openMatch[1].trim();
        if (assistantApi.openModule) {
          const result = await assistantApi.openModule(moduleName);
          return buildFromResult(result);
        }
        const message = "Module navigation unavailable."
        return createAssistantMessage(message, "error");
      }

      if (assistantApi.getContext) {
        const context = assistantApi.getContext();
        const contextLine = context?.sectionName
          ? `You're working in ${context.sectionName}.`
          : 'Open a section to unlock more commands.';
        const content = [
          'I respond to workspace commands like:',
          ...hints.map((hint) => `• ${hint.command}`),
          '',
          contextLine,
          'Type "help" to see the list again.',
        ].join('\n');
        return createAssistantMessage(content, 'info', defaultSuggestions);
      }

      const fallbackContent = [
        'I respond to workspace commands such as:',
        ...hints.map((hint) => `• ${hint.command}`),
        '',
        'Type "help" to see the list again.',
      ].join('\n');
      return createAssistantMessage(fallbackContent, 'info', defaultSuggestions);
    },
    [assistantApi, documentTitle, getHints, sectionName]
  );

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;

    const trimmed = inputValue.trim();
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const assistantMessage = await processAssistantInput(trimmed);
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong while processing that command.';
      setMessages((prev) => [...prev, createAssistantMessage(message, 'error')]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, processAssistantInput]);

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        void handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInputValue(suggestion);
  }, []);

  return (
    <div
      className={`flex flex-col transition-all duration-300 ease-in-out shadow-lg ${
        isExpanded ? 'h-96' : 'h-20'
      }`}
    >
      <div
        className='border-b border-border px-4 py-2 bg-card cursor-pointer hover:bg-muted/50 transition-colors flex-shrink-0'
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3 flex-1'>
            <div className='w-8 h-8 bg-primary rounded-full flex items-center justify-center'>
              <Bot className='h-4 w-4 text-primary-foreground' />
            </div>
            <div className='flex-1'>
              <h3 className='text-sm font-medium text-foreground'>
                AI Assistant
              </h3>
              <p className='text-xs text-muted-foreground'>
                {isExpanded
                  ? 'Click to collapse'
                  : 'Ask questions or send commands'}
              </p>
            </div>
            <div className='flex items-center gap-2'>
              {selectedDocument && (
                <Badge variant='secondary' className='text-xs'>
                  6 sources
                </Badge>
              )}
              {!isExpanded && messages.length > 1 && (
                <Badge variant='outline' className='text-xs'>
                  {messages.length - 1} messages
                </Badge>
              )}
              <Button
                variant='ghost'
                size='sm'
                className='hover:bg-background h-7 w-7 p-0'
              >
                {isExpanded ? (
                  <ChevronDown className='h-4 w-4' />
                ) : (
                  <ChevronUp className='h-4 w-4' />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <ScrollArea className='flex-1 max-h-80 bg-background/50'>
          <div className='p-4 space-y-4'>
            {messages.map((message: ChatMessage) => (
              <div key={message.id} className='flex gap-3'>
                <Avatar className='w-7 h-7 flex-shrink-0'>
                  <AvatarFallback
                    className={
                      message.type === 'user' ? 'bg-secondary' : 'bg-primary'
                    }
                  >
                    {message.type === 'user' ? (
                      <User className='h-3 w-3' />
                    ) : (
                      <Bot className='h-3 w-3 text-primary-foreground' />
                    )}
                  </AvatarFallback>
                </Avatar>

                <div className='flex-1 space-y-1'>
                  <div className='flex items-center gap-2'>
                    <span className='text-xs font-medium text-foreground'>
                      {message.type === 'user' ? 'You' : 'Assistant'}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${getMessageBubbleClasses(
                      message
                    )}`}
                  >
                    {message.content}
                  </div>

                  {message.suggestions && (
                    <div className='space-y-2 mt-3'>
                      <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                        <Lightbulb className='h-3 w-3' />
                        <span>Suggestions:</span>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        {message.suggestions.map(
                          (suggestion: string, index: number) => (
                            <Button
                              key={index}
                              variant='outline'
                              size='sm'
                              className='text-xs h-auto py-1.5 px-3 bg-background hover:bg-secondary transition-colors'
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className='flex gap-3'>
                <Avatar className='w-7 h-7 flex-shrink-0'>
                  <AvatarFallback className='bg-primary'>
                    <Bot className='h-3 w-3 text-primary-foreground' />
                  </AvatarFallback>
                </Avatar>
                <div className='flex-1'>
                  <div className='bg-muted p-3 rounded-lg'>
                    <div className='flex items-center gap-1'>
                      <div className='w-1.5 h-1.5 bg-primary rounded-full animate-bounce' />
                      <div
                        className='w-1.5 h-1.5 bg-primary rounded-full animate-bounce'
                        style={{ animationDelay: '0.1s' }}
                      />
                      <div
                        className='w-1.5 h-1.5 bg-primary rounded-full animate-bounce'
                        style={{ animationDelay: '0.2s' }}
                      />
                      <span className='text-sm text-muted-foreground ml-2'>
                        Thinking...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Chat Input - Always visible */}
      <div className='border-t border-border p-4 bg-card flex-shrink-0'>
        <div className='flex gap-2'>
          <div className='flex-1'>
            <Input
              value={inputValue}
              onChange={handleInputChange}
              placeholder={
                isExpanded
                  ? 'Ask a question or send a command...'
                  : 'Ask AI anything...'
              }
              onKeyDown={handleInputKeyDown}
              className='bg-background text-sm h-9 border-border focus:ring-2 focus:ring-primary/20'
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size='sm'
            className='bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 min-w-[2.5rem]'
          >
            <Send className='h-3 w-3' />
          </Button>
        </div>
      </div>
    </div>
  );
}
