import { describe, expect, it } from "bun:test";
import { BookName, VerseReferenceSchema, createVerseReference } from "../src/models.js";

describe("Models", () => {
  describe("BookName enum", () => {
    it("should have all 66 books", () => {
      const bookNames = Object.values(BookName);
      expect(bookNames).toHaveLength(66);
    });

    it("should have correct Old Testament books", () => {
      expect(BookName.GENESIS as string).toBe("Genesis");
      expect(BookName.EXODUS as string).toBe("Exodus");
      expect(BookName.MALACHI as string).toBe("Malachi");
    });

    it("should have correct New Testament books", () => {
      expect(BookName.MATTHEW as string).toBe("Matthew");
      expect(BookName.JOHN as string).toBe("John");
      expect(BookName.REVELATION as string).toBe("Revelation");
    });

    it("should have numbered books", () => {
      expect(BookName.SAMUEL_1 as string).toBe("1 Samuel");
      expect(BookName.CORINTHIANS_1 as string).toBe("1 Corinthians");
      expect(BookName.JOHN_1 as string).toBe("1 John");
    });
  });

  describe("VerseReferenceSchema", () => {
    it("should validate correct verse references", () => {
      const result = VerseReferenceSchema.safeParse({
        bookNumber: 43,
        chapter: 3,
        verse: 16,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.bookNumber).toBe(43);
        expect(result.data.chapter).toBe(3);
        expect(result.data.verse).toBe(16);
      }
    });

    it("should reject book number less than 1", () => {
      const result = VerseReferenceSchema.safeParse({
        bookNumber: 0,
        chapter: 1,
        verse: 1,
      });

      expect(result.success).toBe(false);
    });

    it("should reject book number greater than 66", () => {
      const result = VerseReferenceSchema.safeParse({
        bookNumber: 67,
        chapter: 1,
        verse: 1,
      });

      expect(result.success).toBe(false);
    });

    it("should reject chapter less than 1", () => {
      const result = VerseReferenceSchema.safeParse({
        bookNumber: 43,
        chapter: 0,
        verse: 1,
      });

      expect(result.success).toBe(false);
    });

    it("should reject verse less than 1", () => {
      const result = VerseReferenceSchema.safeParse({
        bookNumber: 43,
        chapter: 3,
        verse: 0,
      });

      expect(result.success).toBe(false);
    });

    it("should reject chapter exceeding book's chapters", () => {
      // John only has 21 chapters
      const result = VerseReferenceSchema.safeParse({
        bookNumber: 43,
        chapter: 22,
        verse: 1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("only has 21 chapters");
      }
    });

    it("should reject verse exceeding chapter's verses", () => {
      // John 3 only has 36 verses
      const result = VerseReferenceSchema.safeParse({
        bookNumber: 43,
        chapter: 3,
        verse: 37,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("only has 36 verses");
      }
    });

    it("should validate edge cases", () => {
      // First verse of Bible (Genesis 1:1)
      expect(
        VerseReferenceSchema.safeParse({
          bookNumber: 1,
          chapter: 1,
          verse: 1,
        }).success
      ).toBe(true);

      // Last verse of Bible (Revelation 22:21)
      expect(
        VerseReferenceSchema.safeParse({
          bookNumber: 66,
          chapter: 22,
          verse: 21,
        }).success
      ).toBe(true);

      // Longest chapter (Psalm 119 with 176 verses)
      expect(
        VerseReferenceSchema.safeParse({
          bookNumber: 19,
          chapter: 119,
          verse: 176,
        }).success
      ).toBe(true);

      // Single-chapter book (Obadiah 1:21)
      expect(
        VerseReferenceSchema.safeParse({
          bookNumber: 31,
          chapter: 1,
          verse: 21,
        }).success
      ).toBe(true);
    });
  });

  describe("createVerseReference", () => {
    it("should create VerseReference with computed properties", () => {
      const ref = createVerseReference({
        bookNumber: 43,
        chapter: 3,
        verse: 16,
      });

      expect(ref.bookNumber).toBe(43);
      expect(ref.chapter).toBe(3);
      expect(ref.verse).toBe(16);
      expect(ref.bookName as string).toBe("John");
      expect(ref.toString()).toBe("John 3:16");
    });

    it("should throw on invalid data", () => {
      expect(() =>
        createVerseReference({
          bookNumber: 43,
          chapter: 99,
          verse: 1,
        })
      ).toThrow();
    });

    it("should handle all books correctly", () => {
      const genesis = createVerseReference({ bookNumber: 1, chapter: 1, verse: 1 });
      expect(genesis.bookName as string).toBe("Genesis");
      expect(genesis.toString()).toBe("Genesis 1:1");

      const revelation = createVerseReference({ bookNumber: 66, chapter: 22, verse: 21 });
      expect(revelation.bookName as string).toBe("Revelation");
      expect(revelation.toString()).toBe("Revelation 22:21");
    });
  });
});
