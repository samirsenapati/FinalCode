type RateLimitState = {
  windowStartMs: number;
  count: number;
};

const STORAGE_KEY = 'finalcode:ai_rate_limit_v1';

export type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

export function checkAndIncrementRateLimit(config: RateLimitConfig): {
  allowed: boolean;
  retryAfterMs: number;
} {
  if (typeof window === 'undefined') return { allowed: true, retryAfterMs: 0 };

  const now = Date.now();
  let state: RateLimitState = { windowStartMs: now, count: 0 };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RateLimitState>;
      if (typeof parsed.windowStartMs === 'number' && typeof parsed.count === 'number') {
        state = { windowStartMs: parsed.windowStartMs, count: parsed.count };
      }
    }
  } catch {
    // ignore
  }

  // Reset window
  if (now - state.windowStartMs > config.windowMs) {
    state = { windowStartMs: now, count: 0 };
  }

  if (state.count >= config.maxRequests) {
    const retryAfterMs = config.windowMs - (now - state.windowStartMs);
    return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  state.count += 1;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  return { allowed: true, retryAfterMs: 0 };
}
