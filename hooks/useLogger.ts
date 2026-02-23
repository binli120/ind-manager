// Author: Bin Lee
// Email: binlee120@gmail.com
import { createLogger } from "@/lib/common/logger";

export function useLogger(moduleName: string) {
  return createLogger({ module: moduleName });
}
