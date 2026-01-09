// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import { createLogger } from "@/lib/common/logger";

export function useLogger(moduleName: string) {
  return createLogger({ module: moduleName });
}
