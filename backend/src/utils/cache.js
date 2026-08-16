/**
 * Simple in-memory cache with TTL (Time To Live).
 * Useful for reducing database pressure on high-frequency lookups.
 */
export class SimpleCache {
  constructor(defaultTtlSeconds = 60) {
    this.cache = new Map();
    this.ttl = defaultTtlSeconds * 1000;
  }


  set(key, value, ttlSeconds) {
    const expiresAt = Date.now() + (ttlSeconds ? ttlSeconds * 1000 : this.ttl);
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Helper to get or set from a resolver function
  async getOrSet(key, resolver, ttlSeconds) {
    const cached = this.get(key);
    if (cached !== null) return cached;

    const value = await resolver();
    this.set(key, value, ttlSeconds);
    return value;
  }
}

// Named caches for different purposes
export const authCache = new SimpleCache(300); // 5 minutes for user/auth status
export const companyCache = new SimpleCache(600); // 10 minutes for company/package settings
export const statsCache = new SimpleCache(60); // 1 minute for dashboard counts
