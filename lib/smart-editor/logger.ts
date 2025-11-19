export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  module?: string;
  level?: LogLevel;
}

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveLogLevel(explicit?: LogLevel): LogLevel {
  if (explicit) return explicit;

  if (typeof process !== 'undefined') {
    const envLevel =
      (process.env.NEXT_PUBLIC_LOG_LEVEL || process.env.LOG_LEVEL) as
        | LogLevel
        | undefined;

    if (envLevel && LEVEL_ORDER[envLevel]) {
      return envLevel;
    }
  }

  return 'info';
}

function shouldLog(currentLevel: LogLevel, targetLevel: LogLevel): boolean {
  return LEVEL_ORDER[targetLevel] >= LEVEL_ORDER[currentLevel];
}

function formatPrefix(moduleName?: string): string {
  return moduleName ? `[${moduleName}]` : '[App]';
}

export function createLogger(
  moduleOrOptions?: string | LoggerOptions
): Logger {
  const options: LoggerOptions =
    typeof moduleOrOptions === 'string'
      ? { module: moduleOrOptions }
      : moduleOrOptions || {};

  const moduleName = options.module;
  const activeLevel = resolveLogLevel(options.level);
  const prefix = formatPrefix(moduleName);

  const log = (target: LogLevel, consoleMethod: keyof Console) =>
    (...args: unknown[]) => {
      if (!shouldLog(activeLevel, target)) {
        return;
      }

      const method = console[consoleMethod] || console.log;
      method(prefix, ...args);
    };

  return {
    debug: log('debug', 'debug'),
    info: log('info', 'info'),
    warn: log('warn', 'warn'),
    error: log('error', 'error'),
  };
}

export type { Logger };
// Author: Bin Lee (blee@filynai.com)
// Description: Wraps console logging with leveled helpers for consistent application diagnostics.
