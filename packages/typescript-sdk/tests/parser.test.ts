import { describe, expect, it } from "bun:test";
import { parsePassageHtml, parseSearchResultHtml } from "../src/parser.js";

describe("Parser", () => {
  describe("parseSearchResultHtml", () => {
    it("should strip HTML tags from search results", () => {
      const html = "For God so <b>loved</b> the world";
      const result = parseSearchResultHtml(html);
      expect(result).toBe("For God so loved the world");
    });

    it("should handle plain text", () => {
      const html = "For God so loved the world";
      const result = parseSearchResultHtml(html);
      expect(result).toBe("For God so loved the world");
    });

    it("should handle multiple tags", () => {
      const html = "<span>For <b>God</b> so <i>loved</i> the world</span>";
      const result = parseSearchResultHtml(html);
      expect(result).toBe("For God so loved the world");
    });

    it("should handle empty string", () => {
      const result = parseSearchResultHtml("");
      expect(result).toBe("");
    });

    it("should handle nested tags", () => {
      const html = "<div><span>For <b>God</b> so loved</span> the world</div>";
      const result = parseSearchResultHtml(html);
      expect(result).toBe("For God so loved the world");
    });
  });

  describe("parsePassageHtml", () => {
    it("should parse simple verse HTML", () => {
      const html = `
        <span class="verse" data-key="43-003-016">
          <small data-verse="16"><span>16 </span></small>
          <span class="prose">For God so loved the world</span>
        </span>
      `;

      const verses = parsePassageHtml(html);
      expect(verses).toHaveLength(1);

      const verse = verses[0];
      expect(verse?.reference.bookNumber).toBe(43);
      expect(verse?.reference.chapter).toBe(3);
      expect(verse?.reference.verse).toBe(16);
      expect(verse?.verseNumber).toBe(16);
      expect(verse?.segments.length).toBeGreaterThan(0);
      expect(verse?.plainText).toContain("For God so loved the world");
    });

    it("should parse red-letter text (words of Jesus)", () => {
      const html = `
        <span class="verse" data-key="43-003-016">
          <small data-verse="16"><span>16 </span></small>
          <span class="prose">
            <span class="red-letter">For God so loved the world</span>
          </span>
        </span>
      `;

      const verses = parsePassageHtml(html);
      const verse = verses[0];

      const redLetterSegment = verse?.segments.find((seg) => seg.isRedLetter);
      expect(redLetterSegment).toBeDefined();
      expect(redLetterSegment?.text).toContain("For God so loved the world");
    });

    it("should parse italic text", () => {
      const html = `
        <span class="verse" data-key="43-001-001">
          <small data-verse="1"><span>1 </span></small>
          <span class="prose">
            In the beginning was <i>the Word</i>
          </span>
        </span>
      `;

      const verses = parsePassageHtml(html);
      const verse = verses[0];

      const italicSegment = verse?.segments.find((seg) => seg.isItalic);
      expect(italicSegment).toBeDefined();
      expect(italicSegment?.text).toContain("the Word");
    });

    it("should detect poetry structure", () => {
      const html = `
        <p class="poetry">
          <span class="verse" data-key="19-023-001">
            <small data-verse="1"><span>1 </span></small>
            <span>The LORD is my shepherd</span>
          </span>
        </p>
      `;

      const verses = parsePassageHtml(html);
      const verse = verses[0];

      expect(verse?.isPoetry).toBe(true);
    });

    it("should detect prose structure", () => {
      const html = `
        <span class="verse" data-key="43-003-016">
          <small data-verse="16"><span>16 </span></small>
          <span class="prose">For God so loved the world</span>
        </span>
      `;

      const verses = parsePassageHtml(html);
      const verse = verses[0];

      expect(verse?.isProse).toBe(true);
    });

    it("should detect chapter start", () => {
      const html = `
        <span class="verse" data-key="43-003-001">
          <h2 class="chapter-number">Chapter 3</h2>
          <small data-verse="1"><span>1 </span></small>
          <span class="prose">Text here</span>
        </span>
      `;

      const verses = parsePassageHtml(html);
      const verse = verses[0];

      expect(verse?.chapterStart).toBe(true);
    });

    it("should parse multiple verses", () => {
      const html = `
        <span class="verse" data-key="43-003-016">
          <small data-verse="16"><span>16 </span></small>
          <span class="prose">First verse</span>
        </span>
        <span class="verse" data-key="43-003-017">
          <small data-verse="17"><span>17 </span></small>
          <span class="prose">Second verse</span>
        </span>
      `;

      const verses = parsePassageHtml(html);
      expect(verses).toHaveLength(2);

      expect(verses[0]?.reference.verse).toBe(16);
      expect(verses[1]?.reference.verse).toBe(17);
    });

    it("should handle verses without verse number element", () => {
      const html = `
        <span class="verse" data-key="43-003-001">
          <span class="prose">First verse of chapter</span>
        </span>
      `;

      const verses = parsePassageHtml(html);
      expect(verses).toHaveLength(1);

      const verse = verses[0];
      expect(verse?.verseNumber).toBe(1);
    });

    it("should handle empty HTML", () => {
      const verses = parsePassageHtml("");
      expect(verses).toHaveLength(0);
    });

    it("should parse complex formatting", () => {
      const html = `
        <span class="verse" data-key="43-003-016">
          <small data-verse="16"><span>16 </span></small>
          <span class="prose">
            For <span class="small-caps">God</span> so
            <span class="red-letter">loved</span> the <i>world</i>
          </span>
        </span>
      `;

      const verses = parsePassageHtml(html);
      const verse = verses[0];

      expect(verse?.segments.some((seg) => seg.isSmallCaps)).toBe(true);
      expect(verse?.segments.some((seg) => seg.isRedLetter)).toBe(true);
      expect(verse?.segments.some((seg) => seg.isItalic)).toBe(true);
    });
  });
});
