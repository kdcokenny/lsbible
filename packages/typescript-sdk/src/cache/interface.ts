/**
 * Cache provider interface for LSBible SDK.
 *
 * Allows users to implement custom caching strategies for different
 * deployment environments (Cloudflare Workers, Redis, in-memory, etc.)
 */

/**
 * Cache provider interface.
 *
 * Implement this interface to provide custom caching for the LSBible client.
 *
 * @example
 * ```ts
 * class RedisCacheProvider implements CacheProvider {
 *   async get<T>(key: string): Promise<T | undefined> {
 *     const value = await redis.get(key);
 *     return value ? JSON.parse(value) : undefined;
 *   }
 *
 *   async set<T>(key: string, value: T, ttl: number): Promise<void> {
 *     await redis.set(key, JSON.stringify(value), 'EX', ttl);
 *   }
 * }
 * ```
 */
export interface CacheProvider {
  /**
   * Get a value from the cache.
   *
   * @param key - Cache key
   * @returns Cached value or undefined if not found/expired
   */
  get<T>(key: string): Promise<T | undefined>;

  /**
   * Set a value in the cache.
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds
   */
  set<T>(key: string, value: T, ttl: number): Promise<void>;
}

/**
 * Cache configuration options.
 */
export interface CacheOptions {
  /**
   * Cache provider implementation.
   *
   * If not provided, caching is disabled.
   */
  provider?: CacheProvider;

  /**
   * Default TTL for cache entries (in seconds).
   *
   * Can be overridden per-operation.
   * @default 2592000 (30 days)
   */
  defaultTtl?: number;

  /**
   * Per-operation TTL overrides.
   */
  ttl?: {
    /** TTL for verse lookups */
    verse?: number;
    /** TTL for passage lookups */
    passage?: number;
    /** TTL for chapter lookups */
    chapter?: number;
    /** TTL for search queries */
    search?: number;
  };
}

/**
 * Recommended cache TTL values (in seconds).
 */
export const CacheTTL = {
  /** 1 month - for immutable Bible content (verses, passages, chapters) */
  BIBLE_CONTENT: 2_592_000,
  /** 1 week - for search results that may change with API updates */
  SEARCH_RESULTS: 604_800,
  /** 1 year - for static resources that never change */
  STATIC: 31_536_000,
} as const;
