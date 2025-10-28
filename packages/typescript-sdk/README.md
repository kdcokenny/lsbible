# LSBible SDK for TypeScript

Structured, type-safe Bible API client for the Legacy Standard Bible (LSB).

## Features

- **100% Type-Safe** - Full TypeScript support with Zod validation
- **Structured Parameters** - No string parsing! Use `client.getVerse(BookName.JOHN, 3, 16)`
- **Complete Validation** - All 66 books with chapter/verse validation
- **Rich Formatting** - Preserves red-letter text, italics, bold, small-caps
- **Built-in Caching** - Configurable TTL-based response cache
- **Modern Runtime Support** - Works with Node.js 18+, Bun, and Deno

## Installation

```bash
# Using npm
npm install lsbible

# Using pnpm
pnpm add lsbible

# Using bun
bun add lsbible
```

## Quick Start

```typescript
import { LSBibleClient, BookName } from "lsbible";

const client = new LSBibleClient();

// Get a single verse (type-safe with enum)
const verse = await client.getVerse(BookName.JOHN, 3, 16);
console.log(verse.verses[0].plainText);
// Output: "For God so loved the world, that He gave His only Son..."

// Get a passage range
const passage = await client.getPassage(
  BookName.JOHN, 3, 16,
  BookName.JOHN, 3, 18
);
console.log(`Got ${passage.verseCount} verses`);

// Get an entire chapter
const chapter = await client.getChapter(BookName.PSALMS, 23);
console.log(`Psalm 23 has ${chapter.verseCount} verses`);

// Search for text
const results = await client.search("love");
console.log(`Found ${results.matchCount} matches in ${results.passageCount} passages`);
```

## Design Philosophy

### Structured Parameters Over String Parsing

This SDK prioritizes explicit, structured parameters over string-based references:

```typescript
// ✅ GOOD - Structured, type-safe, validated
client.getVerse(BookName.JOHN, 3, 16);

// ❌ AVOID - String parsing (error-prone, less type-safe)
client.getVerse("John 3:16"); // NOT SUPPORTED
```

**Why Structured Parameters?**

1. **Type Safety** - IDE autocomplete for all 66 books
2. **Early Validation** - Catch errors before API calls
3. **No Parsing Ambiguity** - Clear, explicit parameters
4. **Better Testing** - Easy to generate test cases programmatically
5. **Language Agnostic** - Works consistently across all SDKs

## API Reference

### LSBibleClient

```typescript
import { LSBibleClient } from "lsbible";

const client = new LSBibleClient({
  cacheTtl: 3600,    // Cache TTL in seconds (default: 3600)
  timeout: 30,       // Request timeout in seconds (default: 30)
  buildId: undefined, // Optional build ID (auto-detected if not provided)
  headers: {},       // Optional custom headers
});
```

### Methods

#### `getVerse(book, chapter, verse)`

Get a specific verse with validated parameters.

```typescript
// Using enum (recommended)
const verse = await client.getVerse(BookName.JOHN, 3, 16);

// Using string (validated at runtime)
const verse = await client.getVerse("John", 3, 16);

// Access structured data
for (const v of verse.verses) {
  console.log(`${v.reference.toString()}: ${v.plainText}`);

  // Access formatting
  for (const segment of v.segments) {
    if (segment.isRedLetter) {
      console.log(`Jesus said: "${segment.text}"`);
    }
  }
}
```

#### `getPassage(fromBook, fromChapter, fromVerse, toBook, toChapter, toVerse)`

Get a passage spanning multiple verses.

```typescript
// Get John 3:16-18
const passage = await client.getPassage(
  BookName.JOHN, 3, 16,
  BookName.JOHN, 3, 18
);

console.log(`Title: ${passage.title}`);
console.log(`Verses: ${passage.verseCount}`);
console.log(`Single verse? ${passage.isSingleVerse}`);
```

#### `getChapter(book, chapter)`

Get an entire chapter.

```typescript
// Get all of Psalm 23
const chapter = await client.getChapter(BookName.PSALMS, 23);

console.log(`Psalm 23 has ${chapter.verseCount} verses`);

for (const verse of chapter.verses) {
  console.log(`  ${verse.verseNumber}. ${verse.plainText}`);
}
```

#### `search(query)`

Search for passages containing text.

```typescript
const results = await client.search("love");

console.log(`Found ${results.matchCount} matches`);
console.log(`Passages: ${results.passageCount}`);
console.log(`Total verses: ${results.totalVerses}`);

// Search results include metadata (for text searches)
if (results.hasSearchMetadata) {
  console.log(`Total results: ${results.totalCount}`);
  console.log(`Filtered: ${results.filteredCount}`);
  console.log(`By book:`, results.countsByBook);
}

// Iterate through results
for (const passage of results.passages) {
  console.log(`\n${passage.title}`);
  for (const verse of passage.verses) {
    console.log(`  ${verse.plainText}`);
  }
}
```

#### `clearCache()`

Clear the response cache.

```typescript
client.clearCache();
```

## Type System

### BookName Enum

All 66 Bible books available as enum values:

```typescript
import { BookName } from "lsbible";

// Old Testament
BookName.GENESIS
BookName.EXODUS
// ... through ...
BookName.MALACHI

// New Testament
BookName.MATTHEW
BookName.MARK
// ... through ...
BookName.REVELATION
```

### VerseReference

```typescript
interface VerseReference {
  bookNumber: number;      // 1-66
  chapter: number;         // Validated against book
  verse: number;           // Validated against chapter
  readonly bookName: BookName;   // Computed property
  toString(): string;      // e.g., "John 3:16"
}
```

### TextSegment

```typescript
interface TextSegment {
  text: string;
  isRedLetter: boolean;    // Words of Jesus
  isItalic: boolean;       // Italicized clarifications
  isBold: boolean;         // Bold text
  isSmallCaps: boolean;    // LORD (Yahweh)
}
```

### VerseContent

```typescript
interface VerseContent {
  reference: VerseReference;
  verseNumber: number;
  segments: TextSegment[];
  hasSubheading: boolean;
  subheadingText: string | null;
  isPoetry: boolean;
  isProse: boolean;
  chapterStart: boolean;
  readonly plainText: string;      // Computed property
  readonly formattedText: string;  // Computed property
}
```

### Passage

```typescript
interface Passage {
  fromRef: VerseReference;
  toRef: VerseReference;
  title: string;
  verses: VerseContent[];
  readonly isSingleVerse: boolean;  // Computed property
  readonly verseCount: number;      // Computed property
}
```

### SearchResponse

```typescript
interface SearchResponse {
  query: string;
  matchCount: number;
  passages: Passage[];
  durationMs: number;
  timestamp: number;

  // Optional (for text searches only)
  totalCount?: number;
  filteredCount?: number;
  countsByBook?: Record<string, number>;
  countsBySection?: Record<string, number>;

  // Computed properties
  readonly passageCount: number;
  readonly totalVerses: number;
  readonly hasSearchMetadata: boolean;
}
```

## Error Handling

```typescript
import { LSBibleClient, BookName, InvalidReferenceError, APIError } from "lsbible";

const client = new LSBibleClient();

try {
  // Invalid chapter (John only has 21 chapters)
  await client.getVerse(BookName.JOHN, 99, 1);
} catch (error) {
  if (error instanceof InvalidReferenceError) {
    console.error(`Invalid reference: ${error.message}`);
    // Output: "John only has 21 chapters, but chapter 99 was requested"
  }
}

try {
  // Invalid verse (John 3 only has 36 verses)
  await client.getVerse(BookName.JOHN, 3, 999);
} catch (error) {
  if (error instanceof InvalidReferenceError) {
    console.error(`Invalid reference: ${error.message}`);
    // Output: "John 3 only has 36 verses, but verse 999 was requested"
  }
}

try {
  // Invalid book name
  await client.getVerse("NotABook", 1, 1);
} catch (error) {
  if (error instanceof InvalidReferenceError) {
    console.error(`Invalid reference: ${error.message}`);
    // Output: "Unknown book: NotABook"
  }
}

try {
  // API failure
  await client.search("something");
} catch (error) {
  if (error instanceof APIError) {
    console.error(`API error: ${error.message}`);
  }
}
```

## Bible Structure Data

The SDK includes complete validation data for all 66 books:

- **Old Testament:** 39 books (Genesis through Malachi)
- **New Testament:** 27 books (Matthew through Revelation)
- **Total:** 1,189 chapters, 31,102 verses

```typescript
import { BIBLE_STRUCTURE, BOOK_NAMES, BOOK_NUMBERS } from "lsbible";

// Get book info
const johnInfo = BIBLE_STRUCTURE[43];
console.log(johnInfo.name);        // "John"
console.log(johnInfo.chapters);    // 21
console.log(johnInfo.verses[2]);   // Chapter 3 has 36 verses

// Lookup book number
const bookNum = BOOK_NUMBERS["john"];  // 43

// Lookup book name
const bookName = BOOK_NAMES[43];  // "John"
```

## Runtime Support

The SDK is designed to work across modern JavaScript runtimes:

- **Node.js** 18.0.0 or higher (native fetch support)
- **Bun** (optimized build performance)
- **Deno** (works out of the box)

## Examples

### Example 1: Display a Verse with Formatting

```typescript
import { LSBibleClient, BookName } from "lsbible";

const client = new LSBibleClient();
const verse = await client.getVerse(BookName.JOHN, 3, 16);

for (const v of verse.verses) {
  console.log(`\n${v.reference.toString()}\n`);

  for (const segment of v.segments) {
    let text = segment.text;
    if (segment.isRedLetter) text = `\x1b[31m${text}\x1b[0m`; // Red
    if (segment.isItalic) text = `\x1b[3m${text}\x1b[0m`;     // Italic
    if (segment.isSmallCaps) text = text.toUpperCase();      // Small caps -> uppercase
    process.stdout.write(text + " ");
  }
  console.log("\n");
}
```

### Example 2: Find All Occurrences of a Word

```typescript
import { LSBibleClient } from "lsbible";

const client = new LSBibleClient();
const results = await client.search("faith");

console.log(`Found "${results.query}" ${results.matchCount} times\n`);

for (const passage of results.passages) {
  for (const verse of passage.verses) {
    console.log(`${verse.reference.toString()}: ${verse.plainText}`);
  }
}
```

### Example 3: Read an Entire Book

```typescript
import { LSBibleClient, BookName, BIBLE_STRUCTURE } from "lsbible";

const client = new LSBibleClient();
const bookNum = 57; // Philemon
const bookInfo = BIBLE_STRUCTURE[bookNum];

console.log(`Reading ${bookInfo.name}\n`);

for (let chapter = 1; chapter <= bookInfo.chapters; chapter++) {
  const passage = await client.getChapter(BookName.PHILEMON, chapter);

  console.log(`\nChapter ${chapter}\n`);

  for (const verse of passage.verses) {
    console.log(`${verse.verseNumber}. ${verse.plainText}`);
  }
}
```

## Contributing

This SDK is part of the LSBible monorepo. Contributions are welcome!

See the main repository for contribution guidelines: https://github.com/kdcokenny/lsbible

## License

MIT License - See LICENSE file for details.

## Related

- [Python SDK](../python-sdk) - Official Python implementation
- [API Documentation](../../.specs/SPEC.md) - Complete SDK specification
- [LSBible Website](https://read.lsbible.org) - Read the Legacy Standard Bible online
