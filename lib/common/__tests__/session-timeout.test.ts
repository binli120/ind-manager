// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { resolveSessionTimeoutConfig } from '@/lib/common/session-timeout';

describe('resolveSessionTimeoutConfig', () => {
  it('uses defaults when env values are missing', () => {
    const config = resolveSessionTimeoutConfig({});

    expect(config).toEqual({
      idleTimeoutMinutes: 30,
      idleTimeoutMs: 1800000,
      warningSeconds: 60,
      warningTimeoutMs: 1740000,
    });
  });

  it('applies custom env values', () => {
    const config = resolveSessionTimeoutConfig({
      NEXT_PUBLIC_SESSION_IDLE_TIMEOUT_MINUTES: '10',
      NEXT_PUBLIC_SESSION_WARNING_SECONDS: '30',
    });

    expect(config).toEqual({
      idleTimeoutMinutes: 10,
      idleTimeoutMs: 600000,
      warningSeconds: 30,
      warningTimeoutMs: 570000,
    });
  });

  it('caps warning seconds to idle timeout range', () => {
    const config = resolveSessionTimeoutConfig({
      NEXT_PUBLIC_SESSION_IDLE_TIMEOUT_MINUTES: '1',
      NEXT_PUBLIC_SESSION_WARNING_SECONDS: '9999',
    });

    expect(config.warningSeconds).toBe(60);
    expect(config.warningTimeoutMs).toBe(0);
  });
});

