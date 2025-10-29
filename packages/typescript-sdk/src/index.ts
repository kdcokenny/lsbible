/**
 * LSBible SDK - Structured, type-safe Bible API client for TypeScript.
 *
 * @packageDocumentation
 */

// Client
export { LSBibleClient, type LSBibleClientOptions } from "./client.js";

// Cache providers and types
export { type CacheProvider, type CacheOptions, CacheTTL } from "./cache/interface.js";
export { MemoryCacheProvider } from "./cache/memory.js";
export { NoopCacheProvider } from "./cache/noop.js";

// Models and types
export {
  BookName,
  type VerseReference,
  type TextSegment,
  type VerseContent,
  type Passage,
  type SearchResponse,
} from "./models.js";

// Books data
export {
  Testament,
  BibleSection,
  type BookInfo,
  BIBLE_STRUCTURE,
  BOOK_NAMES,
  BOOK_NUMBERS,
} from "./books.js";

// Exceptions
export { LSBibleError, InvalidReferenceError, APIError, BuildIDError } from "./exceptions.js";
