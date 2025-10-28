/**
 * TTL-based response cache for LSBible API.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Simple in-memory cache with time-to-live support.
 */
export class ResponseCache {
  private cache: Map<string, CacheEntry<unknown>>;
  private ttl: number;

  /**
   * Create a new ResponseCache.
   *
   * @param ttl - Time-to-live in seconds (default: 3600)
   */
  constructor(ttl = 3600) {
    this.cache = new Map();
    this.ttl = ttl * 1000; // Convert to milliseconds
  }

  /**
   * Get a value from the cache.
   *
   * @param key - Cache key
   * @returns Cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Set a value in the cache.
   *
   * @param key - Cache key
   * @param value - Value to cache
   */
  set<T>(key: string, value: T): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttl,
    });
  }

  /**
   * Clear all cached values.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries from the cache.
   *
   * This is called automatically during get operations,
   * but can be called manually for cleanup.
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get the number of cached entries (including expired ones).
   */
  get size(): number {
    return this.cache.size;
  }
}
