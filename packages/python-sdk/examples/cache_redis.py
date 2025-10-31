"""Example: Custom Redis cache provider implementation

This example demonstrates:
- Implementing the CacheProvider protocol for Redis
- Using redis-py with async support
- Configuring the client with a custom cache provider

NOTE: This example requires Redis to be running and the redis package:
  pip install redis[asyncio]
  # or
  poetry add redis[asyncio]

Start Redis locally:
  docker run -d -p 6379:6379 redis:alpine
  # or
  brew install redis && brew services start redis
"""

import asyncio
import json
from typing import Any

# Uncomment after installing redis[asyncio]:
# import redis.asyncio as redis


class RedisCacheProvider:
    """Redis cache provider implementation.

    Implements the CacheProvider protocol to store cache entries in Redis
    with automatic expiration using Redis TTL.
    """

    def __init__(self, redis_client: Any):  # Replace Any with redis.Redis after installing
        self.redis = redis_client

    async def get(self, key: str) -> Any | None:
        try:
            value = await self.redis.get(key)
            return json.loads(value) if value else None
        except Exception as error:
            print(f"Redis get error for key {key}: {error}")
            return None

    async def set(self, key: str, value: Any, ttl: int) -> None:
        try:
            # Store with expiration (ex = seconds)
            await self.redis.set(key, json.dumps(value), ex=ttl)
        except Exception as error:
            print(f"Redis set error for key {key}: {error}")


async def main():
    print("=== LSBible SDK - Redis Cache Example ===\n")

    # NOTE: Uncomment after installing redis[asyncio] and starting Redis
    """
    # Initialize Redis client
    redis_client = redis.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", "6379")),
        password=os.getenv("REDIS_PASSWORD"),
        decode_responses=True,
        # Optional: configure connection retry strategy
        retry_on_timeout=True,
        socket_connect_timeout=5,
    )

    # Create cache provider
    cache_provider = RedisCacheProvider(redis_client)

    # Initialize client with Redis cache
    async with LSBibleClient(
        cache={"provider": cache_provider}
    ) as client:
        print("1️⃣  Fetching John 3:16 (cache miss)...")
        import time
        start1 = time.time()
        verse1 = await client.get_verse(BookName.JOHN, 3, 16)
        duration1 = (time.time() - start1) * 1000
        print(f"   {verse1.title}: {verse1.verses[0].plain_text[:50]}...")
        print(f"   ⏱️  Duration: {duration1:.0f}ms\n")

        print("2️⃣  Fetching John 3:16 again (cache hit)...")
        start2 = time.time()
        verse2 = await client.get_verse(BookName.JOHN, 3, 16)
        duration2 = (time.time() - start2) * 1000
        print(f"   {verse2.title}: {verse2.verses[0].plain_text[:50]}...")
        print(f"   ⏱️  Duration: {duration2:.0f}ms ({duration1 - duration2:.0f}ms faster!)\n")

        print("3️⃣  Checking Redis cache...")
        cache_key = "verse:John 3:16"
        ttl = await redis_client.ttl(cache_key)
        print(f"   Cache key: {cache_key}")
        print(f"   TTL remaining: {ttl} seconds (~{round(ttl / 86400)} days)\n")

        print("✅ Done!")

    # Clean up Redis connection
    await redis_client.close()
    """

    print("📝 This example requires Redis and redis[asyncio] to be installed.")
    print("   See comments in the file for setup instructions.")


if __name__ == "__main__":
    asyncio.run(main())
