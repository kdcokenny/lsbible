/**
 * HTML parser for LSBible passages.
 */

import { parseHTML } from "linkedom";
import {
  type TextSegment,
  type VerseContent,
  createVerseContent,
  createVerseReference,
} from "./models.js";

// Type aliases for linkedom DOM elements
type DOMElement = ReturnType<typeof parseHTML>["document"]["body"];
type DOMNode = ReturnType<typeof parseHTML>["document"]["body"]["childNodes"][number];
type DOMDocument = ReturnType<typeof parseHTML>["document"];

/**
 * Parse search result HTML snippet into plain text.
 *
 * Search results include HTML snippets with <b> tags highlighting
 * matched terms. This function strips the tags but preserves the text.
 *
 * @param html - HTML snippet from search results (e.g., "For God so <b>loved</b> the world")
 * @returns Plain text with highlighting removed (e.g., "For God so loved the world")
 */
export function parseSearchResultHtml(html: string): string {
  // Wrap in proper HTML structure for linkedom to parse correctly
  const { document } = parseHTML(`<!DOCTYPE html><html><body>${html}</body></html>`);
  // Get text content, which automatically strips tags but preserves text
  return document.body.textContent?.trim() ?? "";
}

/**
 * Parse passageHtml into structured verse objects.
 *
 * Extracts:
 * - Verse references from data-key attributes
 * - Verse numbers from data-verse attributes
 * - Text formatting (red-letter, italic, bold)
 * - Subheadings and chapter markers
 * - Poetry vs prose structure
 *
 * @param html - The passageHtml string from API
 * @returns List of VerseContent objects
 */
export function parsePassageHtml(html: string): VerseContent[] {
  // Wrap in proper HTML structure for linkedom to parse correctly
  const { document } = parseHTML(`<!DOCTYPE html><html><body>${html}</body></html>`);
  const verses: VerseContent[] = [];

  const verseSpans = document.querySelectorAll("span.verse");
  for (const verseSpan of verseSpans) {
    const verse = parseVerse(verseSpan as DOMElement, document);
    verses.push(verse);
  }

  return verses;
}

/**
 * Parse a single verse span into VerseContent.
 */
function parseVerse(verseSpan: DOMElement, _document: DOMDocument): VerseContent {
  // Extract verse reference from data-key attribute
  const dataKey = verseSpan.getAttribute("data-key");
  if (!dataKey) {
    throw new Error("Verse span missing data-key attribute");
  }
  const reference = parseVerseReference(dataKey);

  // Extract verse number
  const verseNumElem = verseSpan.querySelector("small[data-verse]");
  let verseNumber: number;
  if (verseNumElem) {
    verseNumber = Number.parseInt(verseNumElem.getAttribute("data-verse") ?? "0", 10);
  } else {
    // First verses lack <small> tag - fallback to data-key reference
    verseNumber = reference.verse;
  }

  // Check for subheading
  let hasSubheading = false;
  let subheadingText: string | null = null;
  const prevSibling = verseSpan.previousElementSibling;
  if (prevSibling?.classList.contains("subhead")) {
    hasSubheading = true;
    subheadingText = prevSibling.textContent?.trim() ?? null;
  }

  // Check for poetry vs prose
  let currentNode: DOMElement | null = verseSpan;
  let isPoetry = false;
  while (currentNode) {
    if (currentNode.classList?.contains("poetry")) {
      isPoetry = true;
      break;
    }
    currentNode = currentNode.parentElement as DOMElement | null;
  }

  const isProse = verseSpan.querySelector(".prose") !== null;

  // Check if chapter start (first verses have element with class "chapter-number")
  const chapterStart = verseSpan.querySelector(".chapter-number") !== null;

  // Extract text segments
  const segments = extractSegments(verseSpan);

  return createVerseContent({
    reference,
    verseNumber,
    segments,
    hasSubheading,
    subheadingText,
    isPoetry,
    isProse,
    chapterStart,
  });
}

/**
 * Parse data-key attribute into VerseReference.
 * Format: "43-003-016" (book-chapter-verse)
 */
function parseVerseReference(dataKey: string) {
  const parts = dataKey.split("-");
  if (parts.length !== 3) {
    throw new Error(`Invalid data-key format: ${dataKey}`);
  }

  const bookNumber = Number.parseInt(parts[0] ?? "0", 10);
  const chapter = Number.parseInt(parts[1] ?? "0", 10);
  const verse = Number.parseInt(parts[2] ?? "0", 10);

  return createVerseReference({ bookNumber, chapter, verse });
}

/**
 * Extract text segments with formatting metadata.
 */
function extractSegments(element: DOMElement): TextSegment[] {
  const segments: TextSegment[] = [];

  // Remove verse number element to avoid including it in text
  for (const smallElem of element.querySelectorAll("small[data-verse]")) {
    smallElem.remove();
  }

  // Remove chapter number elements
  for (const chapterElem of element.querySelectorAll(".chapter-number")) {
    chapterElem.remove();
  }

  // Remove subheading elements
  for (const subheadElem of element.querySelectorAll(".subhead")) {
    subheadElem.remove();
  }

  // Process remaining text and formatting
  extractTextNodes(element, segments);

  return segments;
}

/**
 * Recursively extract text nodes with formatting.
 */
function extractTextNodes(node: DOMNode, segments: TextSegment[]): void {
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      // Text node
      const text = child.textContent?.trim();
      if (!text) continue;

      // Determine formatting based on parent elements
      let isRedLetter = false;
      let isItalic = false;
      let isBold = false;
      let isSmallCaps = false;

      let parent = child.parentElement;
      while (parent) {
        if (parent.classList.contains("red-letter")) {
          isRedLetter = true;
        }
        if (parent.tagName === "I" || parent.classList.contains("italic")) {
          isItalic = true;
        }
        if (parent.tagName === "B" || parent.classList.contains("bold")) {
          isBold = true;
        }
        if (parent.classList.contains("small-caps")) {
          isSmallCaps = true;
        }
        parent = parent.parentElement;
      }

      segments.push({
        text,
        isRedLetter,
        isItalic,
        isBold,
        isSmallCaps,
      });
    } else if (child.nodeType === 1) {
      // Element node - recurse
      extractTextNodes(child, segments);
    }
  }
}
