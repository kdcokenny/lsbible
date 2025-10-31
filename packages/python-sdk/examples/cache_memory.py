"""Example: Using MemoryCacheProvider for in-memory caching

This example demonstrates:
- Configuring the client with MemoryCacheProvider
- Setting custom TTL values per operation type
- Observing cache hits on repeated requests
- Clearing the cache manually
"""

import asyncio
import time

from lsbible import BookName, CacheTTL, LSBibleClient, MemoryCacheProvider


async def main():
    print("=== LSBible SDK - Memory Cache Example ===\n")

    # Create a memory cache provider
    cache_provider = MemoryCacheProvider()

    # Initialize client with memory cache
    async with LSBibleClient(
        cache={
            "provider": cache_provider,
            "ttl": {
                "verse": CacheTTL.BIBLE_CONTENT,  # 30 days
                "passage": CacheTTL.BIBLE_CONTENT,  # 30 days
                "chapter": CacheTTL.BIBLE_CONTENT,  # 30 days
                "search": CacheTTL.SEARCH_RESULTS,  # 7 days
            },
        }
    ) as client:
        print("1️⃣  First request (cache miss)...")
        start1 = time.time()
        verse1 = await client.get_verse(BookName.JOHN, 3, 16)
        duration1 = (time.time() - start1) * 1000
        print(f"   {verse1.title}: {verse1.verses[0].plain_text[:50]}...")
        print(f"   ⏱️  Duration: {duration1:.0f}ms")
        print(f"   📦 Cache size: {cache_provider.size()} entries\n")

        print("2️⃣  Second request (cache hit)...")
        start2 = time.time()
        verse2 = await client.get_verse(BookName.JOHN, 3, 16)
        duration2 = (time.time() - start2) * 1000
        print(f"   {verse2.title}: {verse2.verses[0].plain_text[:50]}...")
        print(f"   ⏱️  Duration: {duration2:.0f}ms ({duration1 - duration2:.0f}ms faster! ⚡)")
        print(f"   📦 Cache size: {cache_provider.size()} entries\n")

        print("3️⃣  Fetching different verses...")
        await client.get_verse(BookName.ROMANS, 8, 28)
        await client.get_verse(BookName.PSALMS, 23, 1)
        await client.get_chapter(BookName.JOHN, 1)
        print(f"   📦 Cache size: {cache_provider.size()} entries\n")

        print("4️⃣  Clearing cache...")
        client.clear_cache()
        print(f"   📦 Cache size: {cache_provider.size()} entries\n")

        print("✅ Done!")


if __name__ == "__main__":
    asyncio.run(main())
