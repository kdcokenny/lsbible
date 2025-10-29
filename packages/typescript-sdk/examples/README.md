# LSBible TypeScript SDK Examples

This directory contains example scripts demonstrating how to use the LSBible TypeScript SDK.

## Running Examples

All examples can be run directly with Bun:

```bash
# Run from the typescript-sdk directory
bun run examples/john-3-16.ts
bun run examples/quick-start.ts
```

Or with Node.js (requires building first):

```bash
# Build the SDK first
bun run build

# Then run with Node
node examples/john-3-16.ts
node examples/quick-start.ts
```

## Available Examples

### Basic Usage

#### 1. `john-3-16.ts` - Single Verse Example

Demonstrates fetching a single verse (John 3:16) and displays:
- Verse reference information
- Plain text content
- Text segments with formatting (red-letter, italic, bold, small-caps)
- Verse metadata (poetry/prose, chapter start, subheadings)

**Output:**
```
Reference: John 3:16
From: John 3:16
To: John 3:16
Single verse: true

Verse Number: 16
Plain Text: "For God so loved the world, that He gave His only begotten Son, that whoever believes in Him shall not perish, but have eternal life.

Text Segments:
  - ""For God so loved the world..." [red-letter]

Metadata:
  - Poetry: false
  - Prose: true
  ...
```

#### 2. `quick-start.ts` - Comprehensive Examples

Demonstrates all major SDK features:
1. **Get a single verse** - Fetch John 3:16
2. **Get a passage range** - Fetch John 3:16-18
3. **Get an entire chapter** - Fetch Psalm 23
4. **Search for text** - Search for the word "love" across the Bible
5. **Use string book names** - Use flexible string book names with validation

**Output:**
```
=== LSBible TypeScript SDK - Quick Start Examples ===

1️⃣  Getting John 3:16...
   Reference: John 3:16
   Text: "For God so loved the world...

2️⃣  Getting John 3:16-18...
   Got 3 verses
   Range: John 3:16 - John 3:18
...
```

### Caching

#### 3. `cache-memory.ts` - In-Memory Caching

Demonstrates using the built-in `MemoryCacheProvider`:
- Configuring cache with custom TTL values
- Observing cache hits vs cache misses
- Performance improvements from caching
- Manually clearing the cache

**Run with:**
```bash
bun run examples/cache-memory.ts
```

**Output:**
```
=== LSBible SDK - Memory Cache Example ===

1️⃣  First request (cache miss)...
   John 3:16: "For God so loved the world, that He gave His...
   ⏱️  Duration: 245ms
   📦 Cache size: 1 entries

2️⃣  Second request (cache hit)...
   John 3:16: "For God so loved the world, that He gave His...
   ⏱️  Duration: 2ms (243ms faster! ⚡)
   📦 Cache size: 1 entries
...
```

#### 4. `cache-redis.ts` - Redis Cache Provider

Full implementation of a custom Redis cache provider:
- Implementing the `CacheProvider` interface
- Using ioredis for Redis connections
- Error handling in cache operations
- Checking cache TTL in Redis

**Prerequisites:**
- Install ioredis: `npm install ioredis` or `bun add ioredis`
- Redis server running locally or remote connection

**Run with:**
```bash
# Start Redis (if needed)
docker run -d -p 6379:6379 redis:alpine

# Run example
bun run examples/cache-redis.ts
```

#### 5. `cache-custom.ts` - Custom Cache Provider Template

Educational example showing how to implement a custom cache provider:
- Complete `CacheProvider` interface implementation
- File-based cache as demonstration
- Best practices for error handling
- TTL management and expiration

Use this as a template for implementing:
- DynamoDB cache
- Memcached
- SQLite cache
- Or any other storage backend

**Run with:**
```bash
bun run examples/cache-custom.ts
```

## Key Features Demonstrated

### Type-Safe Book Names
```typescript
import { BookName } from "../src/index.js";

// Use enum for type safety and autocomplete
await client.getVerse(BookName.JOHN, 3, 16);

// Or use strings (validated at runtime)
await client.getVerse("john", 3, 16);
```

### Structured Data Access
```typescript
const passage = await client.getVerse(BookName.JOHN, 3, 16);

// Access verse metadata
console.log(passage.title);               // "John 3:16"
console.log(passage.fromRef.toString());  // "John 3:16"
console.log(passage.verseCount);          // 1
console.log(passage.isSingleVerse);       // true

// Access verse content
const verse = passage.verses[0];
console.log(verse.plainText);             // Full verse text
console.log(verse.isPoetry);              // false
console.log(verse.isProse);               // true
```

### Text Formatting
```typescript
// Access formatted segments
for (const segment of verse.segments) {
  console.log(segment.text);
  console.log(segment.isRedLetter);   // Jesus' words
  console.log(segment.isItalic);      // Translator additions
  console.log(segment.isSmallCaps);   // LORD/Yahweh
}
```

### Search with Metadata
```typescript
const results = await client.search("love");

console.log(results.passageCount);    // Number of passage results
console.log(results.matchCount);      // Total verse matches

// Search metadata (when available)
if (results.hasSearchMetadata) {
  console.log(results.totalCount);    // Total verses containing "love"
  console.log(results.countsByBook);  // Distribution by book
  console.log(results.countsBySection); // Distribution by section
}
```

## Error Handling

All examples include basic error handling:

```typescript
try {
  const passage = await client.getVerse(BookName.JOHN, 3, 16);
  // ... process passage
} catch (error) {
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  }
}
```

Common errors:
- `InvalidReferenceError` - Invalid book/chapter/verse combination
- `APIError` - Network or API errors
- `BuildIDError` - Failed to detect Next.js build ID

## Next Steps

- Read the main [README.md](../README.md) for full API documentation
- View [API Reference](../README.md#api-reference) for all available methods
- Check out the [tests](../tests/) directory for more usage examples
