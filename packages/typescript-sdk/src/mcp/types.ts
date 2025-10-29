/**
 * MCP-specific types and interfaces for LSBible server.
 */

import type { BookName, TextSegment } from "../models.js";

/**
 * MCP Tool input for get_verse
 */
export interface GetVerseInput {
  book: BookName;
  chapter: number;
  verse: number;
}

/**
 * MCP Tool output for get_verse
 */
export interface GetVerseOutput {
  [x: string]: unknown;
  reference: {
    book: string;
    chapter: number;
    verse: number;
  };
  text: string;
  segments: TextSegment[];
}

/**
 * MCP Tool input for get_passage
 */
export interface GetPassageInput {
  fromBook: BookName;
  fromChapter: number;
  fromVerse: number;
  toBook: BookName;
  toChapter: number;
  toVerse: number;
}

/**
 * MCP Tool output for get_passage
 */
export interface GetPassageOutput {
  [x: string]: unknown;
  reference: {
    from: { book: string; chapter: number; verse: number };
    to: { book: string; chapter: number; verse: number };
  };
  verses: Array<{
    reference: { book: string; chapter: number; verse: number };
    text: string;
    segments: TextSegment[];
  }>;
}

/**
 * MCP Tool input for get_chapter
 */
export interface GetChapterInput {
  book: BookName;
  chapter: number;
}

/**
 * MCP Tool output for get_chapter
 */
export interface GetChapterOutput {
  [x: string]: unknown;
  reference: {
    book: string;
    chapter: number;
    verseCount: number;
  };
  verses: Array<{
    reference: { book: string; chapter: number; verse: number };
    text: string;
    segments: TextSegment[];
  }>;
}

/**
 * MCP Tool input for search_bible
 */
export interface SearchBibleInput {
  query: string;
  includeDistribution?: boolean;
}

/**
 * MCP Tool output for search_bible
 */
export interface SearchBibleOutput {
  [x: string]: unknown;
  query: string;
  resultCount: number;
  results: Array<{
    reference: { book: string; chapter: number; verse: number };
    text: string;
    segments: TextSegment[];
  }>;
  distribution?:
    | {
        bySection: Record<string, number>;
        byBook: Record<string, number>;
      }
    | undefined;
}

/**
 * Cache options
 */
export interface CacheOptions {
  /** Time-to-live in seconds */
  ttl?: number;
  /** Whether to use cache */
  useCache?: boolean;
}

/**
 * Book info for resources
 */
export interface BookResourceInfo {
  name: string;
  testament: string;
  chapters: number;
  verses: number;
}

/**
 * Book structure resource
 */
export interface BookStructureResource {
  uri: string;
  book: string;
  testament: string;
  totalChapters: number;
  totalVerses: number;
  chapters: Array<{
    chapter: number;
    verses: number;
  }>;
}
