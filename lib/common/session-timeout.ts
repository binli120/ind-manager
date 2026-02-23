// Author: Bin Lee
// Email: binlee120@gmail.com

import { parsePositiveNumber } from '@/lib/common/number';

export type SessionTimeoutConfig = {
  idleTimeoutMinutes: number;
  idleTimeoutMs: number;
  warningSeconds: number;
  warningTimeoutMs: number;
};

const DEFAULT_IDLE_TIMEOUT_MINUTES = 30;
const DEFAULT_WARNING_SECONDS = 60;

export const resolveSessionTimeoutConfig = (
  env: Record<string, string | undefined> = process.env,
): SessionTimeoutConfig => {
  const idleTimeoutMinutes = parsePositiveNumber(
    env.NEXT_PUBLIC_SESSION_IDLE_TIMEOUT_MINUTES,
    DEFAULT_IDLE_TIMEOUT_MINUTES,
  );

  const idleTimeoutMs = idleTimeoutMinutes * 60 * 1000;
  const rawWarningSeconds = parsePositiveNumber(
    env.NEXT_PUBLIC_SESSION_WARNING_SECONDS,
    DEFAULT_WARNING_SECONDS,
  );

  const warningSeconds = Math.min(
    rawWarningSeconds,
    Math.max(1, Math.floor(idleTimeoutMs / 1000)),
  );

  return {
    idleTimeoutMinutes,
    idleTimeoutMs,
    warningSeconds,
    warningTimeoutMs: Math.max(0, idleTimeoutMs - warningSeconds * 1000),
  };
};

export const SESSION_TIMEOUT_CONFIG = resolveSessionTimeoutConfig();

