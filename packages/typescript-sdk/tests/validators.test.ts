import { describe, expect, it } from "bun:test";
import { InvalidReferenceError } from "../src/exceptions.js";
import { BookName } from "../src/models.js";
import { getBookNumber, normalizeBookName, validateReference } from "../src/validators.js";

describe("Validators", () => {
  describe("Book validators", () => {
    describe("normalizeBookName", () => {
      it("should accept BookName enum values", () => {
        expect(normalizeBookName(BookName.JOHN)).toBe("John");
        expect(normalizeBookName(BookName.GENESIS)).toBe("Genesis");
        expect(normalizeBookName(BookName.REVELATION)).toBe("Revelation");
      });

      it("should normalize lowercase strings", () => {
        expect(normalizeBookName("john")).toBe("John");
        expect(normalizeBookName("genesis")).toBe("Genesis");
        expect(normalizeBookName("revelation")).toBe("Revelation");
      });

      it("should normalize mixed case strings", () => {
        expect(normalizeBookName("JoHn")).toBe("John");
        expect(normalizeBookName("GENESIS")).toBe("Genesis");
      });

      it("should handle numbered books", () => {
        expect(normalizeBookName("1 samuel")).toBe("1 Samuel");
        expect(normalizeBookName("1 corinthians")).toBe("1 Corinthians");
        expect(normalizeBookName("1 john")).toBe("1 John");
      });

      it("should handle numbered books without space", () => {
        expect(normalizeBookName("1samuel")).toBe("1 Samuel");
        expect(normalizeBookName("1corinthians")).toBe("1 Corinthians");
        expect(normalizeBookName("1john")).toBe("1 John");
      });

      it("should handle extra whitespace", () => {
        expect(normalizeBookName("  john  ")).toBe("John");
        expect(normalizeBookName("1  samuel")).toBe("1 Samuel");
      });

      it("should throw InvalidReferenceError for unknown books", () => {
        expect(() => normalizeBookName("NotABook")).toThrow(InvalidReferenceError);
        expect(() => normalizeBookName("")).toThrow(InvalidReferenceError);
        expect(() => normalizeBookName("123")).toThrow(InvalidReferenceError);
      });
    });

    describe("getBookNumber", () => {
      it("should return correct book numbers for enum values", () => {
        expect(getBookNumber(BookName.GENESIS)).toBe(1);
        expect(getBookNumber(BookName.JOHN)).toBe(43);
        expect(getBookNumber(BookName.REVELATION)).toBe(66);
      });

      it("should return correct book numbers for string values", () => {
        expect(getBookNumber("Genesis")).toBe(1);
        expect(getBookNumber("john")).toBe(43);
        expect(getBookNumber("REVELATION")).toBe(66);
      });

      it("should handle numbered books", () => {
        expect(getBookNumber("1 Samuel")).toBe(9);
        expect(getBookNumber("2 samuel")).toBe(10);
        expect(getBookNumber("1 Corinthians")).toBe(46);
      });

      it("should throw InvalidReferenceError for unknown books", () => {
        expect(() => getBookNumber("NotABook")).toThrow(InvalidReferenceError);
      });
    });
  });

  describe("Reference validator", () => {
    describe("validateReference", () => {
      it("should validate correct references with enum", () => {
        const ref = validateReference(BookName.JOHN, 3, 16);
        expect(ref.bookNumber).toBe(43);
        expect(ref.chapter).toBe(3);
        expect(ref.verse).toBe(16);
      });

      it("should validate correct references with string", () => {
        const ref = validateReference("John", 3, 16);
        expect(ref.bookNumber).toBe(43);
        expect(ref.chapter).toBe(3);
        expect(ref.verse).toBe(16);
      });

      it("should throw for invalid book name", () => {
        expect(() => validateReference("NotABook", 1, 1)).toThrow(InvalidReferenceError);
      });

      it("should throw for chapter exceeding book's chapters", () => {
        // John only has 21 chapters
        expect(() => validateReference(BookName.JOHN, 22, 1)).toThrow(InvalidReferenceError);
        expect(() => validateReference(BookName.JOHN, 99, 1)).toThrow(InvalidReferenceError);
      });

      it("should throw for verse exceeding chapter's verses", () => {
        // John 3 only has 36 verses
        expect(() => validateReference(BookName.JOHN, 3, 37)).toThrow(InvalidReferenceError);
        expect(() => validateReference(BookName.JOHN, 3, 999)).toThrow(InvalidReferenceError);
      });

      it("should throw for chapter less than 1", () => {
        expect(() => validateReference(BookName.JOHN, 0, 1)).toThrow();
        expect(() => validateReference(BookName.JOHN, -1, 1)).toThrow();
      });

      it("should throw for verse less than 1", () => {
        expect(() => validateReference(BookName.JOHN, 1, 0)).toThrow();
        expect(() => validateReference(BookName.JOHN, 1, -1)).toThrow();
      });

      it("should validate single-chapter books", () => {
        // Obadiah has 1 chapter with 21 verses
        const ref = validateReference(BookName.OBADIAH, 1, 21);
        expect(ref.bookNumber).toBe(31);
        expect(ref.chapter).toBe(1);
        expect(ref.verse).toBe(21);
      });

      it("should validate last verse of longest chapter", () => {
        // Psalm 119 has 176 verses (longest chapter)
        const ref = validateReference(BookName.PSALMS, 119, 176);
        expect(ref.bookNumber).toBe(19);
        expect(ref.chapter).toBe(119);
        expect(ref.verse).toBe(176);
      });

      it("should validate numbered books", () => {
        const ref1 = validateReference("1 John", 5, 21);
        expect(ref1.bookNumber).toBe(62);

        const ref2 = validateReference("2 Corinthians", 13, 14);
        expect(ref2.bookNumber).toBe(47);
      });
    });
  });
});
