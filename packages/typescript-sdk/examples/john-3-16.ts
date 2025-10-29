/**
 * Example: Get John 3:16 using the LSBible TypeScript SDK
 *
 * This example demonstrates:
 * - Creating an LSBible client
 * - Fetching a single verse
 * - Accessing verse metadata and text
 */

import { BookName, LSBibleClient } from "../src/index.js";

async function main() {
  // Initialize client
  const client = new LSBibleClient();

  console.log("Fetching John 3:16...\n");

  try {
    // Get a single verse
    const passage = await client.getVerse(BookName.JOHN, 3, 16);

    // Display reference
    console.log(`Reference: ${passage.title}`);
    console.log(`From: ${passage.fromRef.toString()}`);
    console.log(`To: ${passage.toRef.toString()}`);
    console.log(`Single verse: ${passage.isSingleVerse}`);
    console.log();

    // Display verse content
    const verse = passage.verses[0];
    if (verse) {
      console.log(`Verse Number: ${verse.verseNumber}`);
      console.log(`Plain Text: ${verse.plainText}`);
      console.log();

      // Display segments with formatting
      console.log("Text Segments:");
      for (const segment of verse.segments) {
        const formatting = [];
        if (segment.isRedLetter) formatting.push("red-letter");
        if (segment.isItalic) formatting.push("italic");
        if (segment.isBold) formatting.push("bold");
        if (segment.isSmallCaps) formatting.push("small-caps");

        const formatStr = formatting.length > 0 ? ` [${formatting.join(", ")}]` : "";
        console.log(`  - "${segment.text}"${formatStr}`);
      }
      console.log();

      // Display metadata
      console.log("Metadata:");
      console.log(`  - Poetry: ${verse.isPoetry}`);
      console.log(`  - Prose: ${verse.isProse}`);
      console.log(`  - Chapter Start: ${verse.chapterStart}`);
      console.log(`  - Has Subheading: ${verse.hasSubheading}`);
    }

    console.log("\n✅ Done!");
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
