import { describe, expect, it } from "bun:test";
import {
  BIBLE_STRUCTURE,
  BOOK_NAMES,
  BOOK_NUMBERS,
  BibleSection,
  SECTION_NAMES,
  Testament,
} from "../src/books.js";

describe("Books", () => {
  describe("BIBLE_STRUCTURE", () => {
    it("should contain all 66 books", () => {
      expect(Object.keys(BIBLE_STRUCTURE)).toHaveLength(66);
    });

    it("should have correct structure for Genesis", () => {
      const genesis = BIBLE_STRUCTURE[1];
      expect(genesis?.number).toBe(1);
      expect(genesis?.name).toBe("Genesis");
      expect(genesis?.testament).toBe(Testament.OLD_TESTAMENT);
      expect(genesis?.chapters).toBe(50);
      expect(genesis?.verses).toHaveLength(50);
      expect(genesis?.verses[0]).toBe(31); // Genesis 1 has 31 verses
    });

    it("should have correct structure for John", () => {
      const john = BIBLE_STRUCTURE[43];
      expect(john?.number).toBe(43);
      expect(john?.name).toBe("John");
      expect(john?.testament).toBe(Testament.NEW_TESTAMENT);
      expect(john?.chapters).toBe(21);
      expect(john?.verses).toHaveLength(21);
      expect(john?.verses[2]).toBe(36); // John 3 has 36 verses
    });

    it("should have correct structure for Revelation", () => {
      const revelation = BIBLE_STRUCTURE[66];
      expect(revelation?.number).toBe(66);
      expect(revelation?.name).toBe("Revelation");
      expect(revelation?.testament).toBe(Testament.NEW_TESTAMENT);
      expect(revelation?.chapters).toBe(22);
      expect(revelation?.verses).toHaveLength(22);
    });

    it("should have 39 Old Testament books", () => {
      const otBooks = Object.values(BIBLE_STRUCTURE).filter(
        (book) => book.testament === Testament.OLD_TESTAMENT
      );
      expect(otBooks).toHaveLength(39);
    });

    it("should have 27 New Testament books", () => {
      const ntBooks = Object.values(BIBLE_STRUCTURE).filter(
        (book) => book.testament === Testament.NEW_TESTAMENT
      );
      expect(ntBooks).toHaveLength(27);
    });

    it("should have correct total verse counts", () => {
      const totalVerses = Object.values(BIBLE_STRUCTURE).reduce(
        (sum, book) => sum + book.verses.reduce((a, b) => a + b, 0),
        0
      );
      expect(totalVerses).toBe(31102); // Total verses in the Bible
    });
  });

  describe("BOOK_NAMES", () => {
    it("should map book numbers to names", () => {
      expect(BOOK_NAMES[1]).toBe("Genesis");
      expect(BOOK_NAMES[43]).toBe("John");
      expect(BOOK_NAMES[66]).toBe("Revelation");
    });

    it("should contain 66 entries", () => {
      expect(Object.keys(BOOK_NAMES)).toHaveLength(66);
    });
  });

  describe("BOOK_NUMBERS", () => {
    it("should map book names to numbers (lowercase)", () => {
      expect(BOOK_NUMBERS.genesis).toBe(1);
      expect(BOOK_NUMBERS.john).toBe(43);
      expect(BOOK_NUMBERS.revelation).toBe(66);
    });

    it("should handle numbered books", () => {
      expect(BOOK_NUMBERS["1 samuel"]).toBe(9);
      expect(BOOK_NUMBERS["1 corinthians"]).toBe(46);
      expect(BOOK_NUMBERS["1 john"]).toBe(62);
    });

    it("should contain 66 entries", () => {
      expect(Object.keys(BOOK_NUMBERS)).toHaveLength(66);
    });
  });

  describe("Testament enum", () => {
    it("should have OLD_TESTAMENT value", () => {
      expect(Testament.OLD_TESTAMENT as string).toBe("OT");
    });

    it("should have NEW_TESTAMENT value", () => {
      expect(Testament.NEW_TESTAMENT as string).toBe("NT");
    });
  });

  describe("BibleSection enum", () => {
    it("should have all section values", () => {
      expect(BibleSection.PENTATEUCH as string).toBe("Pentateuch");
      expect(BibleSection.HISTORY as string).toBe("History");
      expect(BibleSection.WISDOM_AND_POETRY as string).toBe("Wisdom and Poetry");
      expect(BibleSection.MAJOR_PROPHETS as string).toBe("Major Prophets");
      expect(BibleSection.MINOR_PROPHETS as string).toBe("Minor Prophets");
      expect(BibleSection.GOSPELS_AND_ACTS as string).toBe("Gospels and Acts");
      expect(BibleSection.PAULINE_EPISTLES as string).toBe("Pauline Epistles");
      expect(BibleSection.GENERAL_EPISTLES as string).toBe("General Epistles");
    });
  });

  describe("SECTION_NAMES", () => {
    it("should map section numbers to names", () => {
      expect(SECTION_NAMES[1]).toBe(BibleSection.PENTATEUCH);
      expect(SECTION_NAMES[6]).toBe(BibleSection.GOSPELS_AND_ACTS);
      expect(SECTION_NAMES[8]).toBe(BibleSection.GENERAL_EPISTLES);
    });
  });
});
