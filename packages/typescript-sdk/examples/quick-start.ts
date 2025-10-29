/**
 * LSBible TypeScript SDK - Quick Start Examples
 *
 * This example demonstrates the main features of the SDK:
 * - Getting a single verse
 * - Getting a passage range
 * - Getting an entire chapter
 * - Searching for text
 */

import { BookName, LSBibleClient } from "../src/index.js";

async function main() {
  // Initialize client
  const client = new LSBibleClient();

  console.log("=== LSBible TypeScript SDK - Quick Start Examples ===\n");

  try {
    // Example 1: Get a single verse
    console.log("1️⃣  Getting John 3:16...");
    const verse = await client.getVerse(BookName.JOHN, 3, 16);
    console.log(`   Reference: ${verse.title}`);
    console.log(`   Text: ${verse.verses[0]?.plainText}`);
    console.log();

    // Example 2: Get a passage range
    console.log("2️⃣  Getting John 3:16-18...");
    const passage = await client.getPassage(BookName.JOHN, 3, 16, BookName.JOHN, 3, 18);
    console.log(`   Got ${passage.verseCount} verses`);
    console.log(`   Range: ${passage.fromRef.toString()} - ${passage.toRef.toString()}`);
    console.log();

    // Example 3: Get an entire chapter
    console.log("3️⃣  Getting Psalm 23 (entire chapter)...");
    const chapter = await client.getChapter(BookName.PSALMS, 23);
    console.log(`   Psalm 23 has ${chapter.verseCount} verses`);
    console.log(`   First verse: ${chapter.verses[0]?.plainText}`);
    console.log();

    // Example 4: Search for text
    console.log("4️⃣  Searching for 'love'...");
    const results = await client.search("love");
    console.log(`   Found ${results.passageCount} passages`);
    console.log(`   Total matches: ${results.matchCount}`);

    if (results.hasSearchMetadata) {
      console.log(`   Total verses in Bible with 'love': ${results.totalCount}`);
      console.log(`   Filtered results: ${results.filteredCount}`);
    }

    // Show first few results
    console.log("\n   First 3 results:");
    for (const result of results.passages.slice(0, 3)) {
      console.log(`   - ${result.title}: ${result.verses[0]?.plainText.substring(0, 80)}...`);
    }
    console.log();

    // Example 5: Using string book names (with validation)
    console.log("5️⃣  Using string book names (with validation)...");
    const verseFromString = await client.getVerse("john", 1, 1);
    console.log(`   Reference: ${verseFromString.title}`);
    console.log(`   Text: ${verseFromString.verses[0]?.plainText.substring(0, 80)}...`);
    console.log();

    console.log("✅ All examples completed successfully!");
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n❌ Error: ${error.message}`);
    } else {
      console.error("\n❌ Unknown error occurred");
    }
    process.exit(1);
  }
}

main();
