/**
 * No-op cache provider that disables caching.
 *
 * Use this when you want to disable caching entirely.
 */

import type { CacheProvider } from "./interface.js";

/**
 * No-op cache provider.
 *
 * All get() calls return undefined (cache miss).
 * All set() calls do nothing.
 *
 * Use when you want to disable caching for testing,
 * debugging, or when caching isn't beneficial for your use case.
 *
 * @example
 * ```ts
 * import { LSBibleClient, NoopCacheProvider } from 'lsbible';
 *
 * const client = new LSBibleClient({
 *   cache: {
 *     provider: new NoopCacheProvider()
 *   }
 * });
 * ```
 */
export class NoopCacheProvider implements CacheProvider {
  async get<T>(_key: string): Promise<T | undefined> {
    return undefined;
  }

  async set<T>(_key: string, _value: T, _ttl: number): Promise<void> {
    // No-op
  }
}
