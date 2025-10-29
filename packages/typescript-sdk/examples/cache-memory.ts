/**
 * Example: Using MemoryCacheProvider for in-memory caching
 *
 * This example demonstrates:
 * - Configuring the client with MemoryCacheProvider
 * - Setting custom TTL values per operation type
 * - Observing cache hits on repeated requests
 * - Clearing the cache manually
 */

import { BookName, CacheTTL, LSBibleClient, MemoryCacheProvider } from "../src/index.js";

async function main() {
  console.log("=== LSBible SDK - Memory Cache Example ===\n");

  // Create a memory cache provider
  const cacheProvider = new MemoryCacheProvider();

  // Initialize client with memory cache
  const client = new LSBibleClient({
    cache: {
      provider: cacheProvider,
      ttl: {
        verse: CacheTTL.BIBLE_CONTENT,   // 30 days
        passage: CacheTTL.BIBLE_CONTENT, // 30 days
        chapter: CacheTTL.BIBLE_CONTENT, // 30 days
        search: CacheTTL.SEARCH_RESULTS, // 7 days
      }
    }
  });

  try {
    console.log("1️⃣  First request (cache miss)...");
    const start1 = Date.now();
    const verse1 = await client.getVerse(BookName.JOHN, 3, 16);
    const duration1 = Date.now() - start1;
    console.log(`   ${verse1.title}: ${verse1.verses[0]?.plainText.substring(0, 50)}...`);
    console.log(`   ⏱️  Duration: ${duration1}ms`);
    console.log(`   📦 Cache size: ${cacheProvider.size()} entries\n`);

    console.log("2️⃣  Second request (cache hit)...");
    const start2 = Date.now();
    const verse2 = await client.getVerse(BookName.JOHN, 3, 16);
    const duration2 = Date.now() - start2;
    console.log(`   ${verse2.title}: ${verse2.verses[0]?.plainText.substring(0, 50)}...`);
    console.log(`   ⏱️  Duration: ${duration2}ms (${duration1 - duration2}ms faster! ⚡)`);
    console.log(`   📦 Cache size: ${cacheProvider.size()} entries\n`);

    console.log("3️⃣  Fetching different verses...");
    await client.getVerse(BookName.ROMANS, 8, 28);
    await client.getVerse(BookName.PSALMS, 23, 1);
    await client.getChapter(BookName.JOHN, 1);
    console.log(`   📦 Cache size: ${cacheProvider.size()} entries\n`);

    console.log("4️⃣  Clearing cache...");
    client.clearCache();
    console.log(`   📦 Cache size: ${cacheProvider.size()} entries\n`);

    console.log("✅ Done!");
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
