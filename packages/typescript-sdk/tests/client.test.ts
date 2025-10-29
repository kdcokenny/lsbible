import { beforeEach, describe, expect, it, mock } from "bun:test";
import { MemoryCacheProvider } from "../src/cache/memory.js";
import { LSBibleClient } from "../src/client.js";
import { APIError, BuildIDError, InvalidReferenceError } from "../src/exceptions.js";
import { BookName } from "../src/models.js";

// Mock fetch globally
const mockFetch = mock(() => Promise.resolve({} as Response));
// @ts-expect-error - Mock function for testing doesn't match full fetch signature
global.fetch = mockFetch;

describe("LSBibleClient", () => {
  let client: LSBibleClient;

  beforeEach(() => {
    client = new LSBibleClient(); // No caching in tests
    mockFetch.mockReset();
  });

  describe("constructor", () => {
    it("should create client with default options", () => {
      const defaultClient = new LSBibleClient();
      expect(defaultClient).toBeInstanceOf(LSBibleClient);
    });

    it("should create client with custom options", () => {
      const customClient = new LSBibleClient({
        timeout: 60,
        buildId: "test-build-id",
        headers: { "Custom-Header": "value" },
      });
      expect(customClient).toBeInstanceOf(LSBibleClient);
    });
  });

  describe("getBuildId", () => {
    it("should extract build ID from homepage HTML", async () => {
      const homepageHtml = `
        <!DOCTYPE html>
        <html>
          <body>
            <script id="__NEXT_DATA__" type="application/json">
              {"buildId":"test-build-123","props":{}}
            </script>
          </body>
        </html>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => homepageHtml,
      } as unknown as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pageProps: {
            passages: [
              {
                from: { bn: 43, cn: 3, vn: 16 },
                to: { bn: 43, cn: 3, vn: 16 },
                title: "John 3:16",
                passageHtml: `
                  <span class="verse" data-key="43-003-016">
                    <small data-verse="16"><span>16 </span></small>
                    <span class="prose">For God so loved the world</span>
                  </span>
                `,
              },
            ],
            searchMatchCount: 0,
            duration: 1,
            start: Date.now(),
          },
        }),
      } as unknown as Response);

      await client.search("John 3:16");

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect((mockFetch.mock.calls[0] as unknown[])?.[0]).toBe("https://read.lsbible.org");
    });

    it("should use fallback regex if __NEXT_DATA__ not found", async () => {
      const homepageHtml = `
        <!DOCTYPE html>
        <html>
          <body>
            <script src="/_next/data/fallback-build-456/index.json"></script>
          </body>
        </html>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => homepageHtml,
      } as unknown as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pageProps: {
            passages: [],
            searchMatchCount: 0,
            duration: 1,
            start: Date.now(),
          },
        }),
      } as unknown as Response);

      await client.search("test");

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should throw BuildIDError if build ID cannot be determined", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "<html><body>No build ID here</body></html>",
      } as unknown as Response);

      expect(client.search("test")).rejects.toThrow(BuildIDError);
    });

    it("should throw BuildIDError on homepage fetch failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      expect(client.search("test")).rejects.toThrow(BuildIDError);
    });
  });

  describe("search", () => {
    beforeEach(() => {
      // Mock homepage fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '{"buildId":"test-build"}',
      } as unknown as Response);
    });

    it("should perform text search and return results", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pageProps: {
            query: "love",
            initialItems: [
              {
                key: "43-003-016",
                html: "For God so <b>loved</b> the world",
              },
            ],
            totalCount: 1,
            filteredCount: 1,
            countsByBook: { "43": 1 },
            countsBySection: { "6": 1 },
            duration: 5,
            start: Date.now(),
          },
        }),
      } as unknown as Response);

      const result = await client.search("love");

      expect(result.query).toBe("love");
      expect(result.passageCount).toBe(1);
      expect(result.hasSearchMetadata).toBe(true);
      expect(result.totalCount).toBe(1);
      expect(result.passages[0]?.fromRef.bookNumber).toBe(43);
    });

    it("should handle verse reference lookups", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pageProps: {
            query: "John 3:16",
            passages: [
              {
                from: { bn: 43, cn: 3, vn: 16 },
                to: { bn: 43, cn: 3, vn: 16 },
                title: "John 3:16",
                passageHtml: `
                  <span class="verse" data-key="43-003-016">
                    <small data-verse="16"><span>16 </span></small>
                    <span class="prose">For God so loved the world</span>
                  </span>
                `,
              },
            ],
            searchMatchCount: 0,
            duration: 1,
            start: Date.now(),
          },
        }),
      } as unknown as Response);

      const result = await client.search("John 3:16");

      expect(result.query).toBe("John 3:16");
      expect(result.passageCount).toBe(1);
      expect(result.hasSearchMetadata).toBe(false);
      expect(result.passages[0]?.verses).toHaveLength(1);
    });

    it("should use cache for repeated queries", async () => {
      // Create client with cache provider
      const cacheClient = new LSBibleClient({
        cache: { provider: new MemoryCacheProvider() },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          pageProps: {
            passages: [],
            searchMatchCount: 0,
            duration: 1,
            start: Date.now(),
          },
        }),
      } as unknown as Response);

      await cacheClient.search("test");
      await cacheClient.search("test");

      // Should only fetch homepage once and API once (second call uses cache)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should throw APIError on HTTP error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as unknown as Response);

      expect(client.search("test")).rejects.toThrow(APIError);
    });

    it("should throw APIError on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      expect(client.search("test")).rejects.toThrow(APIError);
    });
  });

  describe("getVerse", () => {
    beforeEach(() => {
      // Mock homepage fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '{"buildId":"test-build"}',
      } as unknown as Response);
    });

    it("should get a verse with BookName enum", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pageProps: {
            passages: [
              {
                from: { bn: 43, cn: 3, vn: 16 },
                to: { bn: 43, cn: 3, vn: 16 },
                title: "John 3:16",
                passageHtml: `
                  <span class="verse" data-key="43-003-016">
                    <small data-verse="16"><span>16 </span></small>
                    <span class="prose">For God so loved the world</span>
                  </span>
                `,
              },
            ],
            searchMatchCount: 0,
            duration: 1,
            start: Date.now(),
          },
        }),
      } as unknown as Response);

      const passage = await client.getVerse(BookName.JOHN, 3, 16);

      expect(passage.fromRef.bookNumber).toBe(43);
      expect(passage.fromRef.chapter).toBe(3);
      expect(passage.fromRef.verse).toBe(16);
      expect(passage.isSingleVerse).toBe(true);
    });

    it("should get a verse with string book name", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pageProps: {
            passages: [
              {
                from: { bn: 43, cn: 3, vn: 16 },
                to: { bn: 43, cn: 3, vn: 16 },
                title: "John 3:16",
                passageHtml: `<span class="verse" data-key="43-003-016"></span>`,
              },
            ],
            searchMatchCount: 0,
            duration: 1,
            start: Date.now(),
          },
        }),
      } as unknown as Response);

      const passage = await client.getVerse("John", 3, 16);

      expect(passage.fromRef.bookNumber).toBe(43);
    });

    it("should throw InvalidReferenceError for invalid book", async () => {
      expect(client.getVerse("NotABook", 1, 1)).rejects.toThrow(InvalidReferenceError);
    });

    it("should throw InvalidReferenceError for invalid chapter", async () => {
      // John only has 21 chapters
      expect(client.getVerse(BookName.JOHN, 99, 1)).rejects.toThrow(InvalidReferenceError);
    });

    it("should throw InvalidReferenceError for invalid verse", async () => {
      // John 3 only has 36 verses
      expect(client.getVerse(BookName.JOHN, 3, 999)).rejects.toThrow(InvalidReferenceError);
    });

    it("should throw APIError when no passages returned", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pageProps: {
            passages: [],
            searchMatchCount: 0,
            duration: 1,
            start: Date.now(),
          },
        }),
      } as unknown as Response);

      expect(client.getVerse(BookName.JOHN, 3, 16)).rejects.toThrow(APIError);
    });
  });

  describe("getPassage", () => {
    it("should get passage from same chapter", async () => {
      // Mock homepage fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '{"buildId":"test-build"}',
      } as unknown as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pageProps: {
            passages: [
              {
                from: { bn: 43, cn: 3, vn: 16 },
                to: { bn: 43, cn: 3, vn: 18 },
                title: "John 3:16-18",
                passageHtml: `
                  <span class="verse" data-key="43-003-016"></span>
                  <span class="verse" data-key="43-003-017"></span>
                  <span class="verse" data-key="43-003-018"></span>
                `,
              },
            ],
            searchMatchCount: 0,
            duration: 1,
            start: Date.now(),
          },
        }),
      } as unknown as Response);

      const passage = await client.getPassage(BookName.JOHN, 3, 16, BookName.JOHN, 3, 18);

      expect(passage.fromRef.verse).toBe(16);
      expect(passage.toRef.verse).toBe(18);
      expect(passage.isSingleVerse).toBe(false);
    });

    it("should get passage from different chapters", async () => {
      // Mock homepage fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '{"buildId":"test-build"}',
      } as unknown as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pageProps: {
            passages: [
              {
                from: { bn: 43, cn: 3, vn: 16 },
                to: { bn: 43, cn: 4, vn: 2 },
                title: "John 3:16-4:2",
                passageHtml: `<span class="verse" data-key="43-003-016"></span>`,
              },
            ],
            searchMatchCount: 0,
            duration: 1,
            start: Date.now(),
          },
        }),
      } as unknown as Response);

      const passage = await client.getPassage(BookName.JOHN, 3, 16, BookName.JOHN, 4, 2);

      expect(passage.fromRef.chapter).toBe(3);
      expect(passage.toRef.chapter).toBe(4);
    });

    it("should get passage from different books", async () => {
      // Mock homepage fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '{"buildId":"test-build"}',
      } as unknown as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pageProps: {
            passages: [
              {
                from: { bn: 40, cn: 28, vn: 20 },
                to: { bn: 41, cn: 1, vn: 1 },
                title: "Matthew 28:20-Mark 1:1",
                passageHtml: `<span class="verse" data-key="40-028-020"></span>`,
              },
            ],
            searchMatchCount: 0,
            duration: 1,
            start: Date.now(),
          },
        }),
      } as unknown as Response);

      const passage = await client.getPassage(BookName.MATTHEW, 28, 20, BookName.MARK, 1, 1);

      expect(passage.fromRef.bookNumber).toBe(40);
      expect(passage.toRef.bookNumber).toBe(41);
    });

    it("should validate both references", async () => {
      // Invalid from reference
      expect(client.getPassage(BookName.JOHN, 99, 1, BookName.JOHN, 3, 16)).rejects.toThrow(
        InvalidReferenceError
      );

      // Invalid to reference
      expect(client.getPassage(BookName.JOHN, 3, 16, BookName.JOHN, 99, 1)).rejects.toThrow(
        InvalidReferenceError
      );
    });
  });

  describe("getChapter", () => {
    it("should get entire chapter", async () => {
      // Mock homepage fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '{"buildId":"test-build"}',
      } as unknown as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pageProps: {
            passages: [
              {
                from: { bn: 19, cn: 23, vn: 1 },
                to: { bn: 19, cn: 23, vn: 6 },
                title: "Psalm 23",
                passageHtml: `
                  <span class="verse" data-key="19-023-001"></span>
                  <span class="verse" data-key="19-023-002"></span>
                  <span class="verse" data-key="19-023-003"></span>
                  <span class="verse" data-key="19-023-004"></span>
                  <span class="verse" data-key="19-023-005"></span>
                  <span class="verse" data-key="19-023-006"></span>
                `,
              },
            ],
            searchMatchCount: 0,
            duration: 1,
            start: Date.now(),
          },
        }),
      } as unknown as Response);

      const passage = await client.getChapter(BookName.PSALMS, 23);

      expect(passage.fromRef.chapter).toBe(23);
      expect(passage.toRef.chapter).toBe(23);
      expect(passage.verses.length).toBeGreaterThan(0);
    });

    it("should throw for invalid chapter", async () => {
      // John only has 21 chapters
      expect(client.getChapter(BookName.JOHN, 99)).rejects.toThrow(APIError);
    });

    it("should throw for chapter less than 1", async () => {
      expect(client.getChapter(BookName.JOHN, 0)).rejects.toThrow(APIError);
    });
  });
});
