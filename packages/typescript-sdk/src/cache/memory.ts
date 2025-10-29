/**
 * In-memory cache provider for local development and testing.
 *
 * Stores cache entries in a Map with TTL support. Cache is not
 * shared across processes or requests.
 */

import type { CacheProvider } from "./interface.js";

interface CacheEntry<T> {
  data: T;
  expires: number;
}

/**
 * In-memory cache provider using Map.
 *
 * Suitable for:
 * - Local development
 * - Testing
 * - Single-process applications
 * - MCP stdio servers
 *
 * Not suitable for:
 * - Multi-process applications
 * - Cloudflare Workers (use CloudflareCacheProvider)
 * - Production high-traffic servers (use Redis/Memcached)
 *
 * @example
 * ```ts
 * import { LSBibleClient, MemoryCacheProvider } from 'lsbible';
 *
 * const client = new LSBibleClient({
 *   cache: {
 *     provider: new MemoryCacheProvider()
 *   }
 * });
 * ```
 */
export class MemoryCacheProvider implements CacheProvider {
  private cache = new Map<string, CacheEntry<unknown>>();

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    const expires = Date.now() + ttl * 1000;
    this.cache.set(key, { data: value, expires });
  }

  /**
   * Clear all cache entries.
   *
   * Useful for testing or manual cache invalidation.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the number of entries in the cache.
   *
   * Includes expired entries that haven't been accessed yet.
   */
  size(): number {
    return this.cache.size;
  }
}
