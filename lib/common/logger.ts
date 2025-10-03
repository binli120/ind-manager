/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
  module?: string;
}

const LEVELS: LogLevel[] = ["debug", "info", "warn", "error"];

// Read log level from environment variable (default to 'info')
const globalLevel: LogLevel =
  (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === "development" ? "debug" : "info");

function shouldLog(level: LogLevel) {
  return LEVELS.indexOf(level) >= LEVELS.indexOf(globalLevel);
}

function getTime() {
  return new Date().toISOString();
}

function format(module: string, level: LogLevel, ...args: any[]) {
  return [`[${getTime()}] [${module}] [${level.toUpperCase()}]`, ...args];
}

export function createLogger(options: LoggerOptions = {}) {
  const module = options.module || "app";

  return {
    debug: (...args: any[]) => {
      if (shouldLog("debug"))
        console.debug(...format(module, "debug", ...args));
    },
    info: (...args: any[]) => {
      if (shouldLog("info")) console.info(...format(module, "info", ...args));
    },
    warn: (...args: any[]) => {
      if (shouldLog("warn")) console.warn(...format(module, "warn", ...args));
    },
    error: (...args: any[]) => {
      if (shouldLog("error"))
        console.error(...format(module, "error", ...args));
    },
  };
}
