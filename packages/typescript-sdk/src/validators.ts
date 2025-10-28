/**
 * Validators for Bible references and book names.
 */

import { BIBLE_STRUCTURE, BOOK_NUMBERS } from "./books.js";
import { InvalidReferenceError } from "./exceptions.js";
import { BookName, type VerseReference, createVerseReference } from "./models.js";

/**
 * Normalize book name for API calls.
 *
 * @param book - BookName enum or string
 * @returns Normalized book name string
 * @throws InvalidReferenceError if book name is invalid
 *
 * @example
 * ```ts
 * normalizeBookName(BookName.JOHN)  // "John"
 * normalizeBookName("john")         // "John"
 * normalizeBookName("1 john")       // "1 John"
 * ```
 */
export function normalizeBookName(book: BookName | string): string {
  if (typeof book === "string" && Object.values(BookName).includes(book as BookName)) {
    // It's already a valid BookName value
    return book;
  }

  if (typeof book !== "string") {
    throw new InvalidReferenceError(`Invalid book type: ${typeof book}`);
  }

  // Normalize string input
  const bookStr = book.trim();
  const bookLower = bookStr.toLowerCase();

  // Try direct lookup
  if (bookLower in BOOK_NUMBERS) {
    const bookNum = BOOK_NUMBERS[bookLower];
    if (bookNum) {
      return BIBLE_STRUCTURE[bookNum]?.name ?? book;
    }
  }

  // Try fuzzy matching (handle "1John" vs "1 John", "1john" vs "1 John")
  const normalized = bookLower.split(/\s+/).join(" ");
  if (normalized in BOOK_NUMBERS) {
    const bookNum = BOOK_NUMBERS[normalized];
    if (bookNum) {
      return BIBLE_STRUCTURE[bookNum]?.name ?? book;
    }
  }

  // Try adding space after leading digit (e.g., "1john" -> "1 john")
  if (/^\d/.test(bookLower)) {
    const spaced = bookLower.replace(/^(\d+)([a-z])/, "$1 $2");
    if (spaced in BOOK_NUMBERS) {
      const bookNum = BOOK_NUMBERS[spaced];
      if (bookNum) {
        return BIBLE_STRUCTURE[bookNum]?.name ?? book;
      }
    }
  }

  throw new InvalidReferenceError(`Unknown book: ${book}`);
}

/**
 * Get book number from book name.
 *
 * @param book - BookName enum or string
 * @returns Book number (1-66)
 * @throws InvalidReferenceError if book name is invalid
 */
export function getBookNumber(book: BookName | string): number {
  const normalized = normalizeBookName(book);
  const bookNum = BOOK_NUMBERS[normalized.toLowerCase()];
  if (!bookNum) {
    throw new InvalidReferenceError(`Unknown book: ${book}`);
  }
  return bookNum;
}

/**
 * Validate and create a VerseReference.
 *
 * @param book - Book name
 * @param chapter - Chapter number
 * @param verse - Verse number
 * @returns Validated VerseReference object
 * @throws InvalidReferenceError if reference is invalid
 */
export function validateReference(
  book: BookName | string,
  chapter: number,
  verse: number
): VerseReference {
  try {
    const bookNumber = getBookNumber(book);

    // Create VerseReference (Zod validates chapter/verse)
    return createVerseReference({
      bookNumber,
      chapter,
      verse,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new InvalidReferenceError(error.message);
    }
    throw error;
  }
}
