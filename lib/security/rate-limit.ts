export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

export interface RateLimiter {
  check(key: string): Promise<RateLimitDecision>;
}

/**
 * Demo-only limiter. Replace this adapter with a durable, shared implementation
 * (for example Upstash or a database-backed counter) before public API launch.
 */
export class DemoRateLimiter implements RateLimiter {
  private readonly attempts = new Map<string, number[]>();

  constructor(
    private readonly limits: Record<string, number> = {},
    private readonly periodMs = 60 * 60 * 1000
  ) {}

  async check(key: string): Promise<RateLimitDecision> {
    const tool = key.split(":").at(-1) || key;
    const limit = this.limits[tool] || 60;
    const now = Date.now();
    const recent = (this.attempts.get(key) || []).filter((time) => now - time < this.periodMs);
    if (recent.length >= limit) {
      const retryAfterSeconds = Math.ceil((this.periodMs - (now - (recent[0] || now))) / 1000);
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }
    recent.push(now);
    this.attempts.set(key, recent);
    return { allowed: true, remaining: limit - recent.length };
  }
}
