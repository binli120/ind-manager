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

function format(module: string, level: LogLevel, ...args: unknown[]) {
  return [`[${getTime()}] [${module}] [${level.toUpperCase()}]`, ...args];
}

export function createLogger(options: LoggerOptions = {}) {
  const moduleName = options.module || "app";

  return {
    debug: (...args: unknown[]) => {
      if (shouldLog("debug"))
        console.debug(...format(moduleName, "debug", ...args));
    },
    info: (...args: unknown[]) => {
      if (shouldLog("info")) console.info(...format(moduleName, "info", ...args));
    },
    warn: (...args: unknown[]) => {
      if (shouldLog("warn")) console.warn(...format(moduleName, "warn", ...args));
    },
    error: (...args: unknown[]) => {
      if (shouldLog("error"))
        console.error(...format(moduleName, "error", ...args));
    },
  };
}
