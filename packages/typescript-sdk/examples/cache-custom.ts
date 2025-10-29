/**
 * Example: Creating a custom cache provider
 *
 * This example demonstrates:
 * - The CacheProvider interface contract
 * - Implementing a simple file-based cache as an example
 * - Best practices for error handling in cache providers
 *
 * This serves as a template for implementing custom cache backends like:
 * - Redis
 * - Memcached
 * - DynamoDB
 * - SQLite
 * - File system
 * - Or any other storage system
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { CacheProvider } from "../src/index.js";
import { BookName, LSBibleClient } from "../src/index.js";

/**
 * Example: File-based cache provider
 *
 * This is a simple implementation that stores cache entries as JSON files.
 * NOT recommended for production, but demonstrates the CacheProvider interface.
 */
class FileCacheProvider implements CacheProvider {
  private cacheDir: string;

  constructor(cacheDir: string = ".cache") {
    this.cacheDir = cacheDir;
  }

  /**
   * Initialize cache directory
   */
  async init(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create cache directory:", error);
    }
  }

  /**
   * Get a value from the cache
   *
   * Implementation notes:
   * - Must return undefined if key doesn't exist
   * - Must handle expired entries (check TTL)
   * - Should handle errors gracefully (return undefined)
   * - Must parse/deserialize the stored value
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const filePath = this.getFilePath(key);
      const content = await fs.readFile(filePath, "utf-8");
      const entry = JSON.parse(content);

      // Check if expired
      if (entry.expires && Date.now() > entry.expires) {
        // Delete expired entry
        await fs.unlink(filePath).catch(() => {});
        return undefined;
      }

      return entry.data;
    } catch (error) {
      // File doesn't exist or other error - return undefined
      return undefined;
    }
  }

  /**
   * Set a value in the cache
   *
   * Implementation notes:
   * - ttl is in seconds (convert to your storage format if needed)
   * - Should handle errors gracefully (don't throw)
   * - Must serialize the value appropriately
   * - Should be async even if your storage is synchronous
   */
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      const filePath = this.getFilePath(key);
      const entry = {
        data: value,
        expires: Date.now() + ttl * 1000, // Convert seconds to milliseconds
        createdAt: Date.now(),
      };

      await fs.writeFile(filePath, JSON.stringify(entry, null, 2), "utf-8");
    } catch (error) {
      console.error(`Failed to set cache for key ${key}:`, error);
    }
  }

  /**
   * Get file path for a cache key
   * Encodes the key to make it filesystem-safe
   */
  private getFilePath(key: string): string {
    // Simple encoding: replace special chars with underscores
    const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, "_");
    return path.join(this.cacheDir, `${safeKey}.json`);
  }

  /**
   * Optional: Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      await Promise.all(
        files.map(file =>
          fs.unlink(path.join(this.cacheDir, file)).catch(() => {})
        )
      );
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  }
}

async function main() {
  console.log("=== LSBible SDK - Custom Cache Provider Example ===\n");

  try {
    // Create and initialize custom cache provider
    const cacheProvider = new FileCacheProvider(".cache");
    await cacheProvider.init();

    // Initialize client with custom cache
    const client = new LSBibleClient({
      cache: {
        provider: cacheProvider,
        ttl: {
          verse: 3600,    // 1 hour for demonstration
          passage: 3600,
          chapter: 3600,
          search: 1800,   // 30 minutes
        }
      }
    });

    console.log("1️⃣  Fetching John 3:16 (will be cached to .cache/ directory)...");
    const verse1 = await client.getVerse(BookName.JOHN, 3, 16);
    console.log(`   ${verse1.title}: ${verse1.verses[0]?.plainText.substring(0, 50)}...\n`);

    console.log("2️⃣  Fetching John 3:16 again (reading from cache file)...");
    const verse2 = await client.getVerse(BookName.JOHN, 3, 16);
    console.log(`   ${verse2.title}: ${verse2.verses[0]?.plainText.substring(0, 50)}...\n`);

    console.log("3️⃣  Cache files created:");
    const files = await fs.readdir(".cache");
    for (const file of files) {
      console.log(`   📄 .cache/${file}`);
    }

    console.log("\n✅ Done!");
    console.log("\n💡 Key takeaways for implementing CacheProvider:");
    console.log("   1. Implement get<T>() - return undefined on miss/error");
    console.log("   2. Implement set<T>() - handle errors gracefully");
    console.log("   3. TTL is in seconds - convert as needed");
    console.log("   4. Serialize/deserialize data appropriately");
    console.log("   5. Handle errors without throwing");
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`);
    } else {
      console.error("❌ Unknown error occurred");
    }
    process.exit(1);
  }
}

main();
