/**
 * Cloudflare Cache API provider for LSBible MCP server.
 *
 * Uses Cloudflare's edge cache for fast, distributed caching.
 */

import type { CacheProvider } from "lsbible";

/**
 * Cloudflare Cache API provider.
 *
 * Provides edge caching using Cloudflare's Cache API.
 * - Per-datacenter caching (not globally replicated)
 * - Respects Cache-Control headers
 * - Automatic eviction based on TTL
 *
 * @example
 * ```ts
 * import { LSBibleClient } from 'lsbible';
 * import { CloudflareCacheProvider } from './cache/cloudflare.js';
 *
 * const client = new LSBibleClient({
 *   cache: {
 *     provider: new CloudflareCacheProvider()
 *   }
 * });
 * ```
 */
export class CloudflareCacheProvider implements CacheProvider {
  /**
   * Generate a cache URL from a cache key.
   *
   * Uses a Worker-local hostname to avoid DNS lookups.
   *
   * @param key - Cache key
   * @returns Cache URL
   */
  private getCacheUrl(key: string): URL {
    return new URL(`https://cache-internal/${encodeURIComponent(key)}`);
  }

  /**
   * Simple hash function for ETag generation.
   *
   * @param key - Cache key to hash
   * @returns Hash string in base36
   */
  private hashKey(key: string): string {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const cache = caches.default;
      const cacheUrl = this.getCacheUrl(key);
      const cacheRequest = new Request(cacheUrl.href, { method: "GET" });

      const cached = await cache.match(cacheRequest);
      if (cached) {
        console.info(`[Cache] HIT (Cloudflare): ${key}`);
        return (await cached.json()) as T;
      }

      console.info(`[Cache] MISS (Cloudflare): ${key}`);
      return undefined;
    } catch (error) {
      console.warn("[Cache] Get failed:", error);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      const cache = caches.default;
      const cacheUrl = this.getCacheUrl(key);
      const cacheRequest = new Request(cacheUrl.href, { method: "GET" });

      const response = new Response(JSON.stringify(value), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": `public, max-age=${ttl}`,
          ETag: `"${this.hashKey(key)}"`,
          "Last-Modified": new Date().toUTCString(),
        },
      });

      await cache.put(cacheRequest, response.clone());
      console.info(`[Cache] STORED (Cloudflare): ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.warn("[Cache] Put failed:", error);
    }
  }
}
