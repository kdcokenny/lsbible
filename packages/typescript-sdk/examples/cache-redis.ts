// @ts-nocheck
/**
 * Example: Custom Redis cache provider implementation
 *
 * This example demonstrates:
 * - Implementing the CacheProvider interface for Redis
 * - Using ioredis for Redis connections
 * - Configuring the client with a custom cache provider
 *
 * NOTE: This example requires Redis to be running and the ioredis package:
 *   npm install ioredis
 *   # or
 *   bun add ioredis
 *
 * Start Redis locally:
 *   docker run -d -p 6379:6379 redis:alpine
 *   # or
 *   brew install redis && brew services start redis
 */

import Redis from "ioredis";
import type { CacheProvider } from "../src/index.js";
import { BookName, LSBibleClient } from "../src/index.js";

/**
 * Redis cache provider implementation.
 *
 * Implements the CacheProvider interface to store cache entries in Redis
 * with automatic expiration using Redis TTL.
 */
class RedisCacheProvider implements CacheProvider {
  private redis: Redis; // Replace with: Redis

  constructor(redis: Redis /* Replace with: Redis */) {
    this.redis = redis;
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : undefined;
    } catch (error) {
      console.error(`Redis get error for key ${key}:`, error);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      // Store with expiration (EX = seconds)
      await this.redis.set(key, JSON.stringify(value), "EX", ttl);
    } catch (error) {
      console.error(`Redis set error for key ${key}:`, error);
    }
  }
}

async function main() {
  console.log("=== LSBible SDK - Redis Cache Example ===\n");

  // Initialize Redis client
  const redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    // Optional: configure connection retry strategy
    retryStrategy: (times) => {
      if (times > 3) {
        console.error("Redis connection failed after 3 retries");
        return null; // Stop retrying
      }
      return Math.min(times * 100, 2000); // Exponential backoff
    },
  });

  // Create cache provider
  const cacheProvider = new RedisCacheProvider(redis);

  // Initialize client with Redis cache
  const client = new LSBibleClient({
    cache: {
      provider: cacheProvider,
    },
  });

  try {
    console.log("1️⃣  Fetching John 3:16 (cache miss)...");
    const start1 = Date.now();
    const verse1 = await client.getVerse(BookName.JOHN, 3, 16);
    const duration1 = Date.now() - start1;
    console.log(`   ${verse1.title}: ${verse1.verses[0]?.plainText.substring(0, 50)}...`);
    console.log(`   ⏱️  Duration: ${duration1}ms\n`);

    console.log("2️⃣  Fetching John 3:16 again (cache hit)...");
    const start2 = Date.now();
    const verse2 = await client.getVerse(BookName.JOHN, 3, 16);
    const duration2 = Date.now() - start2;
    console.log(`   ${verse2.title}: ${verse2.verses[0]?.plainText.substring(0, 50)}...`);
    console.log(`   ⏱️  Duration: ${duration2}ms (${duration1 - duration2}ms faster!)\n`);

    console.log("3️⃣  Checking Redis cache...");
    const cacheKey = "verse:John 3:16";
    const ttl = await redis.ttl(cacheKey);
    console.log(`   Cache key: ${cacheKey}`);
    console.log(`   TTL remaining: ${ttl} seconds (~${Math.round(ttl / 86400)} days)\n`);

    console.log("✅ Done!");
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`);
    } else {
      console.error("❌ Unknown error occurred");
    }
  } finally {
    // Clean up Redis connection
    await redis.quit();
  }

  console.log("📝 This example requires Redis and ioredis to be installed.");
  console.log("   See comments in the file for setup instructions.");
}

main();
