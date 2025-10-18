import { createLogger } from "@/lib/common/logger";

export function useLogger(moduleName: string) {
  return createLogger({ module: moduleName });
}
