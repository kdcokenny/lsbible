"""Example: Creating a custom cache provider

This example demonstrates:
- The CacheProvider protocol contract
- Implementing a simple file-based cache as an example
- Best practices for error handling in cache providers

This serves as a template for implementing custom cache backends like:
- Redis
- Memcached
- DynamoDB
- SQLite
- File system
- Or any other storage system
"""

import asyncio
import json
import time
from pathlib import Path
from typing import Any

from lsbible import BookName, LSBibleClient


class FileCacheProvider:
    """Example: File-based cache provider

    This is a simple implementation that stores cache entries as JSON files.
    NOT recommended for production, but demonstrates the CacheProvider protocol.
    """

    def __init__(self, cache_dir: str = ".cache"):
        self.cache_dir = Path(cache_dir)

    async def init(self) -> None:
        """Initialize cache directory"""
        try:
            self.cache_dir.mkdir(parents=True, exist_ok=True)
        except Exception as error:
            print(f"Failed to create cache directory: {error}")

    async def get(self, key: str) -> Any | None:
        """Get a value from the cache

        Implementation notes:
        - Must return None if key doesn't exist
        - Must handle expired entries (check TTL)
        - Should handle errors gracefully (return None)
        - Must parse/deserialize the stored value
        """
        try:
            file_path = self._get_file_path(key)
            content = file_path.read_text()
            entry = json.loads(content)

            # Check if expired
            if entry.get("expires") and time.time() * 1000 > entry["expires"]:
                # Delete expired entry
                try:
                    file_path.unlink()
                except Exception:
                    pass
                return None

            return entry["data"]
        except Exception:
            # File doesn't exist or other error - return None
            return None

    async def set(self, key: str, value: Any, ttl: int) -> None:
        """Set a value in the cache

        Implementation notes:
        - ttl is in seconds (convert to your storage format if needed)
        - Should handle errors gracefully (don't throw)
        - Must serialize the value appropriately
        - Should be async even if your storage is synchronous
        """
        try:
            file_path = self._get_file_path(key)
            entry = {
                "data": value,
                "expires": time.time() * 1000 + ttl * 1000,  # Convert seconds to milliseconds
                "createdAt": time.time() * 1000,
            }

            file_path.write_text(json.dumps(entry, indent=2))
        except Exception as error:
            print(f"Failed to set cache for key {key}: {error}")

    def _get_file_path(self, key: str) -> Path:
        """Get file path for a cache key
        Encodes the key to make it filesystem-safe
        """
        # Simple encoding: replace special chars with underscores
        safe_key = "".join(c if c.isalnum() or c in "-_" else "_" for c in key)
        return self.cache_dir / f"{safe_key}.json"

    async def clear(self) -> None:
        """Optional: Clear all cache entries"""
        try:
            for file in self.cache_dir.glob("*.json"):
                try:
                    file.unlink()
                except Exception:
                    pass
        except Exception as error:
            print(f"Failed to clear cache: {error}")


async def main():
    print("=== LSBible SDK - Custom Cache Provider Example ===\n")

    # Create and initialize custom cache provider
    cache_provider = FileCacheProvider(".cache")
    await cache_provider.init()

    # Initialize client with custom cache
    async with LSBibleClient(
        cache={
            "provider": cache_provider,
            "ttl": {
                "verse": 3600,  # 1 hour for demonstration
                "passage": 3600,
                "chapter": 3600,
                "search": 1800,  # 30 minutes
            },
        }
    ) as client:
        print("1️⃣  Fetching John 3:16 (will be cached to .cache/ directory)...")
        verse1 = await client.get_verse(BookName.JOHN, 3, 16)
        print(f"   {verse1.title}: {verse1.verses[0].plain_text[:50]}...\n")

        print("2️⃣  Fetching John 3:16 again (reading from cache file)...")
        verse2 = await client.get_verse(BookName.JOHN, 3, 16)
        print(f"   {verse2.title}: {verse2.verses[0].plain_text[:50]}...\n")

        print("3️⃣  Cache files created:")
        for file in Path(".cache").glob("*.json"):
            print(f"   📄 .cache/{file.name}")

        print("\n✅ Done!")
        print("\n💡 Key takeaways for implementing CacheProvider:")
        print("   1. Implement async get() - return None on miss/error")
        print("   2. Implement async set() - handle errors gracefully")
        print("   3. TTL is in seconds - convert as needed")
        print("   4. Serialize/deserialize data appropriately")
        print("   5. Handle errors without throwing")


if __name__ == "__main__":
    asyncio.run(main())
