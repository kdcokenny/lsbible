/**
 * Zod schemas and TypeScript types for LSBible API data structures.
 *
 * Provides runtime validation and type inference for all API responses.
 */

import { z } from "zod";
import { BIBLE_STRUCTURE, BOOK_NAMES } from "./books.js";

/**
 * Enumeration of all 66 Bible books for type-safe API calls.
 */
export enum BookName {
  // Old Testament
  GENESIS = "Genesis",
  EXODUS = "Exodus",
  LEVITICUS = "Leviticus",
  NUMBERS = "Numbers",
  DEUTERONOMY = "Deuteronomy",
  JOSHUA = "Joshua",
  JUDGES = "Judges",
  RUTH = "Ruth",
  SAMUEL_1 = "1 Samuel",
  SAMUEL_2 = "2 Samuel",
  KINGS_1 = "1 Kings",
  KINGS_2 = "2 Kings",
  CHRONICLES_1 = "1 Chronicles",
  CHRONICLES_2 = "2 Chronicles",
  EZRA = "Ezra",
  NEHEMIAH = "Nehemiah",
  ESTHER = "Esther",
  JOB = "Job",
  PSALMS = "Psalms",
  PROVERBS = "Proverbs",
  ECCLESIASTES = "Ecclesiastes",
  SONG_OF_SONGS = "Song of Songs",
  ISAIAH = "Isaiah",
  JEREMIAH = "Jeremiah",
  LAMENTATIONS = "Lamentations",
  EZEKIEL = "Ezekiel",
  DANIEL = "Daniel",
  HOSEA = "Hosea",
  JOEL = "Joel",
  AMOS = "Amos",
  OBADIAH = "Obadiah",
  JONAH = "Jonah",
  MICAH = "Micah",
  NAHUM = "Nahum",
  HABAKKUK = "Habakkuk",
  ZEPHANIAH = "Zephaniah",
  HAGGAI = "Haggai",
  ZECHARIAH = "Zechariah",
  MALACHI = "Malachi",
  // New Testament
  MATTHEW = "Matthew",
  MARK = "Mark",
  LUKE = "Luke",
  JOHN = "John",
  ACTS = "Acts",
  ROMANS = "Romans",
  CORINTHIANS_1 = "1 Corinthians",
  CORINTHIANS_2 = "2 Corinthians",
  GALATIANS = "Galatians",
  EPHESIANS = "Ephesians",
  PHILIPPIANS = "Philippians",
  COLOSSIANS = "Colossians",
  THESSALONIANS_1 = "1 Thessalonians",
  THESSALONIANS_2 = "2 Thessalonians",
  TIMOTHY_1 = "1 Timothy",
  TIMOTHY_2 = "2 Timothy",
  TITUS = "Titus",
  PHILEMON = "Philemon",
  HEBREWS = "Hebrews",
  JAMES = "James",
  PETER_1 = "1 Peter",
  PETER_2 = "2 Peter",
  JOHN_1 = "1 John",
  JOHN_2 = "2 John",
  JOHN_3 = "3 John",
  JUDE = "Jude",
  REVELATION = "Revelation",
}

/**
 * Zod schema for VerseReference with validation.
 *
 * Validates that:
 * - Book number is 1-66
 * - Chapter exists in the book
 * - Verse exists in the chapter
 */
export const VerseReferenceSchema = z
  .object({
    bookNumber: z.number().int().min(1).max(66),
    chapter: z.number().int().min(1),
    verse: z.number().int().min(1),
  })
  .refine(
    (data) => {
      const bookInfo = BIBLE_STRUCTURE[data.bookNumber];
      if (!bookInfo) return false;
      return data.chapter <= bookInfo.chapters;
    },
    (data) => {
      const bookInfo = BIBLE_STRUCTURE[data.bookNumber];
      const bookName = BOOK_NAMES[data.bookNumber];
      return {
        message: `${bookName} only has ${bookInfo?.chapters} chapters, but chapter ${data.chapter} was requested`,
        path: ["chapter"],
      };
    }
  )
  .refine(
    (data) => {
      const bookInfo = BIBLE_STRUCTURE[data.bookNumber];
      if (!bookInfo) return false;
      const maxVerse = bookInfo.verses[data.chapter - 1];
      if (!maxVerse) return false;
      return data.verse <= maxVerse;
    },
    (data) => {
      const bookInfo = BIBLE_STRUCTURE[data.bookNumber];
      const bookName = BOOK_NAMES[data.bookNumber];
      const maxVerse = bookInfo?.verses[data.chapter - 1];
      return {
        message: `${bookName} ${data.chapter} only has ${maxVerse} verses, but verse ${data.verse} was requested`,
        path: ["verse"],
      };
    }
  );

/** Type for VerseReference inferred from Zod schema */
export type VerseReference = z.infer<typeof VerseReferenceSchema> & {
  /** Get the book name from the book number */
  readonly bookName: BookName;
  /** String representation (e.g., "John 3:16") */
  toString(): string;
};

/**
 * Create a VerseReference with computed properties.
 */
export function createVerseReference(data: z.infer<typeof VerseReferenceSchema>): VerseReference {
  const validated = VerseReferenceSchema.parse(data);
  return {
    ...validated,
    get bookName(): BookName {
      return (
        BookName[BOOK_NAMES[this.bookNumber] as keyof typeof BookName] ||
        (BOOK_NAMES[this.bookNumber] as BookName)
      );
    },
    toString(): string {
      return `${BOOK_NAMES[this.bookNumber]} ${this.chapter}:${this.verse}`;
    },
  };
}

/**
 * Zod schema for TextSegment.
 */
export const TextSegmentSchema = z.object({
  text: z.string(),
  isRedLetter: z.boolean().default(false), // Words of Jesus in red
  isItalic: z.boolean().default(false), // Italicized text (clarifications)
  isBold: z.boolean().default(false), // Bold text
  isSmallCaps: z.boolean().default(false), // LORD (Yahweh) in small caps
});

/** Type for TextSegment */
export type TextSegment = z.infer<typeof TextSegmentSchema>;

/**
 * Zod schema for VerseContent.
 */
export const VerseContentSchema = z.object({
  reference: VerseReferenceSchema,
  verseNumber: z.number().int().min(1),
  segments: z.array(TextSegmentSchema),
  hasSubheading: z.boolean().default(false),
  subheadingText: z.string().nullable().default(null),
  isPoetry: z.boolean().default(false),
  isProse: z.boolean().default(false),
  chapterStart: z.boolean().default(false), // First verse of chapter
});

/** Type for VerseContent with computed properties */
export type VerseContent = Omit<z.infer<typeof VerseContentSchema>, "reference"> & {
  reference: VerseReference;
  /** Get plain text without formatting */
  readonly plainText: string;
  /** Get text with simple formatting markers */
  readonly formattedText: string;
};

/**
 * Create a VerseContent with computed properties.
 */
export function createVerseContent(data: z.infer<typeof VerseContentSchema>): VerseContent {
  const validated = VerseContentSchema.parse(data);
  const reference = createVerseReference(validated.reference);

  return {
    ...validated,
    reference,
    get plainText(): string {
      return this.segments.map((seg) => seg.text).join(" ");
    },
    get formattedText(): string {
      const parts = this.segments.map((seg) => {
        let text = seg.text;
        if (seg.isItalic) text = `[${text}]`;
        if (seg.isRedLetter) text = `"${text}"`;
        return text;
      });
      return parts.join(" ");
    },
  };
}

/**
 * Zod schema for Passage.
 */
export const PassageSchema = z.object({
  fromRef: VerseReferenceSchema,
  toRef: VerseReferenceSchema,
  title: z.string(),
  verses: z.array(VerseContentSchema),
});

/** Type for Passage with computed properties */
export type Passage = Omit<z.infer<typeof PassageSchema>, "fromRef" | "toRef" | "verses"> & {
  fromRef: VerseReference;
  toRef: VerseReference;
  verses: VerseContent[];
  /** Check if this passage is a single verse */
  readonly isSingleVerse: boolean;
  /** Get the number of verses in this passage */
  readonly verseCount: number;
};

/**
 * Create a Passage with computed properties.
 */
export function createPassage(data: z.infer<typeof PassageSchema>): Passage {
  const validated = PassageSchema.parse(data);
  const fromRef = createVerseReference(validated.fromRef);
  const toRef = createVerseReference(validated.toRef);
  const verses = validated.verses.map((v) => createVerseContent(v));

  return {
    ...validated,
    fromRef,
    toRef,
    verses,
    get isSingleVerse(): boolean {
      return (
        this.fromRef.bookNumber === this.toRef.bookNumber &&
        this.fromRef.chapter === this.toRef.chapter &&
        this.fromRef.verse === this.toRef.verse
      );
    },
    get verseCount(): number {
      return this.verses.length;
    },
  };
}

/**
 * Zod schema for SearchResponse.
 *
 * For text searches, includes rich metadata about result distribution across
 * Bible sections and books. For Bible reference lookups, these fields are undefined.
 */
export const SearchResponseSchema = z.object({
  query: z.string(),
  matchCount: z.number().int().min(0),
  passages: z.array(PassageSchema),
  durationMs: z.number().int().min(0),
  timestamp: z.number().int(),
  // Optional metadata for text searches
  totalCount: z.number().int().min(0).optional(),
  filteredCount: z.number().int().min(0).optional(),
  countsByBook: z.record(z.string(), z.number()).optional(),
  countsBySection: z.record(z.string(), z.number()).optional(),
});

/** Type for SearchResponse with computed properties */
export type SearchResponse = Omit<z.infer<typeof SearchResponseSchema>, "passages"> & {
  passages: Passage[];
  /** Get the number of passages returned */
  readonly passageCount: number;
  /** Get total number of verses across all passages */
  readonly totalVerses: number;
  /** Check if this response includes search distribution metadata */
  readonly hasSearchMetadata: boolean;
};

/**
 * Create a SearchResponse with computed properties.
 */
export function createSearchResponse(data: z.infer<typeof SearchResponseSchema>): SearchResponse {
  const validated = SearchResponseSchema.parse(data);
  const passages = validated.passages.map((p) => createPassage(p));

  return {
    ...validated,
    passages,
    get passageCount(): number {
      return this.passages.length;
    },
    get totalVerses(): number {
      return this.passages.reduce((sum, p) => sum + p.verseCount, 0);
    },
    get hasSearchMetadata(): boolean {
      return this.totalCount !== undefined;
    },
  };
}
