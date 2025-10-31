/**
 * LSBible API client.
 */

import { BIBLE_STRUCTURE } from "./books.js";
import { type CacheOptions, type CacheProvider, CacheTTL } from "./cache/interface.js";
import { APIError, BuildIDError } from "./exceptions.js";
import {
  type BookName,
  type Passage,
  type SearchResponse,
  type TextSegment,
  createPassage,
  createSearchResponse,
  createVerseContent,
  createVerseReference,
} from "./models.js";
import { parsePassageHtml, parseSearchResultHtml } from "./parser.js";
import { getBookNumber, normalizeBookName, validateReference } from "./validators.js";

/** Client configuration options */
export interface LSBibleClientOptions {
  /** Request timeout in seconds (default: 30) */
  timeout?: number;
  /** Optional build ID (auto-detected if not provided) */
  buildId?: string;
  /** Optional custom headers */
  headers?: Record<string, string>;
  /** Optional cache configuration */
  cache?: CacheOptions;
}

/**
 * Get SDK version for User-Agent header.
 */
function getSdkVersion(): string {
  // In production, this would be replaced by the actual version
  // For now, return a placeholder
  return "0.1.0";
}

/**
 * Build User-Agent string for SDK requests.
 *
 * Format: lsbible-typescript/VERSION (Runtime; +https://github.com/kdcokenny/lsbible)
 */
function getUserAgent(): string {
  const version = getSdkVersion();
  // Detect runtime safely using 'in' operator
  const runtime = "Bun" in globalThis ? "Bun" : "Deno" in globalThis ? "Deno" : "Node.js";
  return `lsbible-typescript/${version} (${runtime}; +https://github.com/kdcokenny/lsbible)`;
}

/**
 * Client for interacting with the LSBible API.
 *
 * @example
 * ```ts
 * const client = new LSBibleClient();
 *
 * // Get a single verse
 * const verse = await client.getVerse(BookName.JOHN, 3, 16);
 *
 * // Search for text
 * const results = await client.search("love");
 * ```
 */
export class LSBibleClient {
  private static readonly BASE_URL = "https://read.lsbible.org";

  private cacheProvider: CacheProvider | undefined;
  private cacheTtls: Required<NonNullable<CacheOptions["ttl"]>>;
  private timeout: number;
  private buildId: string | undefined;
  private buildIdFetched: boolean;
  private headers: Record<string, string>;

  /**
   * Create a new LSBible client.
   *
   * @param options - Client configuration options
   */
  constructor(options: LSBibleClientOptions = {}) {
    this.cacheProvider = options.cache?.provider ?? undefined;
    this.cacheTtls = {
      verse: options.cache?.ttl?.verse ?? CacheTTL.BIBLE_CONTENT,
      passage: options.cache?.ttl?.passage ?? CacheTTL.BIBLE_CONTENT,
      chapter: options.cache?.ttl?.chapter ?? CacheTTL.BIBLE_CONTENT,
      search: options.cache?.ttl?.search ?? CacheTTL.SEARCH_RESULTS,
    };
    this.timeout = (options.timeout ?? 30) * 1000; // Convert to milliseconds
    this.buildId = options.buildId;
    this.buildIdFetched = options.buildId !== undefined;

    // Build default headers
    this.headers = {
      "User-Agent": getUserAgent(),
      Accept: "*/*",
      ...options.headers,
    };
  }

  /**
   * Get the Next.js build ID.
   *
   * Strategies:
   * 1. Use cached/provided build ID
   * 2. Extract from homepage HTML (__NEXT_DATA__ script)
   * 3. Try to find it in script tags
   *
   * @throws BuildIDError if build ID cannot be determined
   */
  private async getBuildId(): Promise<string> {
    if (this.buildId && this.buildIdFetched) {
      return this.buildId;
    }

    // Try to extract from homepage
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(LSBibleClient.BASE_URL, {
        signal: controller.signal,
        headers: this.headers,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Look for __NEXT_DATA__ script tag
      const buildIdMatch = html.match(/"buildId":"([^"]+)"/);
      if (buildIdMatch?.[1]) {
        this.buildId = buildIdMatch[1];
        this.buildIdFetched = true;
        return this.buildId;
      }

      // Fallback: Try to find build ID in any script tag
      const scriptMatch = html.match(/\/_next\/data\/([^/]+)\//);
      if (scriptMatch?.[1]) {
        this.buildId = scriptMatch[1];
        this.buildIdFetched = true;
        return this.buildId;
      }
    } catch (error) {
      throw new BuildIDError(
        `Failed to fetch build ID: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    throw new BuildIDError("Could not determine build ID from homepage");
  }

  /**
   * Cache wrapper for async operations.
   *
   * @param key - Cache key
   * @param ttl - Time to live in seconds
   * @param fetcher - Function to fetch fresh data
   * @returns Cached or fresh data
   */
  private async withCache<T>(key: string, ttl: number, fetcher: () => Promise<T>): Promise<T> {
    // If no cache provider, just fetch
    if (!this.cacheProvider) {
      return fetcher();
    }

    // Try to get from cache
    const cached = await this.cacheProvider.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetcher();

    // Store in cache
    await this.cacheProvider.set(key, data, ttl);

    return data;
  }

  /**
   * Make a request to the LSBible API.
   *
   * @param query - Search query or verse reference
   * @returns API response JSON
   * @throws APIError if request fails
   */
  private async makeRequest(query: string): Promise<unknown> {
    // Get build ID
    const buildId = await this.getBuildId();

    // Construct URL
    const url = new URL(`${LSBibleClient.BASE_URL}/_next/data/${buildId}/index.json`);
    url.searchParams.set("q", query);

    // Make request
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          ...this.headers,
          referer: `${LSBibleClient.BASE_URL}/`,
          "x-nextjs-data": "1",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new APIError(
          `API request failed with status ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        `API request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Detect if response is from text search or Bible reference lookup.
   *
   * Text searches have initialItems array with metadata.
   * Bible reference lookups have passages array with full HTML.
   */
  private isTextSearch(pageProps: Record<string, unknown>): boolean {
    return "initialItems" in pageProps && "totalCount" in pageProps;
  }

  /**
   * Parse text search results from initialItems format.
   */
  private parseSearchResults(pageProps: Record<string, unknown>, query: string): SearchResponse {
    const passages: Passage[] = [];
    const initialItems = (pageProps.initialItems as Array<Record<string, unknown>>) ?? [];

    // Parse each search result item
    for (const item of initialItems) {
      // Parse the key (e.g., "43-003-016" -> John 3:16)
      const key = item.key as string;
      const parts = key.split("-");
      if (parts.length !== 3) continue;

      const bookNumber = Number.parseInt(parts[0] ?? "0", 10);
      const chapter = Number.parseInt(parts[1] ?? "0", 10);
      const verse = Number.parseInt(parts[2] ?? "0", 10);

      // Create verse reference
      const verseRef = createVerseReference({ bookNumber, chapter, verse });

      // Parse HTML snippet to plain text
      const htmlSnippet = (item.html as string) ?? "";
      const plainText = parseSearchResultHtml(htmlSnippet);

      // Create a minimal VerseContent
      const segment: TextSegment = {
        text: plainText,
        isRedLetter: false,
        isItalic: false,
        isBold: false,
        isSmallCaps: false,
      };
      const verseContent = createVerseContent({
        reference: verseRef,
        verseNumber: verse,
        segments: [segment],
        hasSubheading: false,
        subheadingText: null,
        isPoetry: false,
        isProse: false,
        chapterStart: false,
      });

      // Create a single-verse passage
      passages.push(
        createPassage({
          fromRef: verseRef,
          toRef: verseRef,
          title: verseRef.toString(),
          verses: [verseContent],
        })
      );
    }

    // Extract metadata
    const totalCount = (pageProps.totalCount as number) ?? 0;
    const filteredCount = (pageProps.filteredCount as number) ?? 0;
    const countsByBook = pageProps.countsByBook as Record<string, number> | undefined;
    const countsBySection = pageProps.countsBySection as Record<string, number> | undefined;

    return createSearchResponse({
      query,
      matchCount: totalCount,
      passages,
      durationMs: (pageProps.duration as number) ?? 0,
      timestamp: (pageProps.start as number) ?? 0,
      totalCount,
      filteredCount,
      countsByBook,
      countsBySection,
    });
  }

  /**
   * Parse Bible reference lookup results from passages format.
   */
  private parseReferenceResults(pageProps: Record<string, unknown>, query: string): SearchResponse {
    const passages: Passage[] = [];
    const passagesData = (pageProps.passages as Array<Record<string, unknown>>) ?? [];

    for (const passageData of passagesData) {
      const fromData = passageData.from as Record<string, number>;
      const toData = passageData.to as Record<string, number>;

      const fromRef = createVerseReference({
        bookNumber: fromData.bn ?? 0,
        chapter: fromData.cn ?? 0,
        verse: fromData.vn ?? 0,
      });

      const toRef = createVerseReference({
        bookNumber: toData.bn ?? 0,
        chapter: toData.cn ?? 0,
        verse: toData.vn ?? 0,
      });

      // Parse HTML to get verse content
      const passageHtml = (passageData.passageHtml as string) ?? "";
      const verses = parsePassageHtml(passageHtml);

      passages.push(
        createPassage({
          fromRef,
          toRef,
          title: (passageData.title as string) ?? "",
          verses,
        })
      );
    }

    return createSearchResponse({
      query,
      matchCount: (pageProps.searchMatchCount as number) ?? 0,
      passages,
      durationMs: (pageProps.duration as number) ?? 0,
      timestamp: (pageProps.start as number) ?? 0,
    });
  }

  /**
   * Parse API response into SearchResponse.
   */
  private parseResponse(data: unknown, query: string): SearchResponse {
    const responseData = data as Record<string, unknown>;
    const pageProps = (responseData.pageProps as Record<string, unknown>) ?? {};

    if (this.isTextSearch(pageProps)) {
      return this.parseSearchResults(pageProps, query);
    }
    return this.parseReferenceResults(pageProps, query);
  }

  /**
   * Search for passages containing text.
   *
   * @param query - Search text (e.g., "love", "faith")
   * @returns SearchResponse with structured passage data
   * @throws APIError if API request fails
   */
  async search(query: string): Promise<SearchResponse> {
    return this.withCache(`search:${query}`, this.cacheTtls.search, async () => {
      const data = await this.makeRequest(query);
      return this.parseResponse(data, query);
    });
  }

  /**
   * Get a specific verse with validated parameters.
   *
   * @param book - Book name as enum or string
   * @param chapter - Chapter number (validated against book)
   * @param verse - Verse number (validated against chapter)
   * @returns Single Passage containing the verse
   * @throws InvalidReferenceError if book/chapter/verse combination is invalid
   * @throws APIError if API request fails
   *
   * @example
   * ```ts
   * // Using enum (recommended - type-safe with autocomplete)
   * const passage = await client.getVerse(BookName.JOHN, 3, 16);
   *
   * // Using string (validated at runtime)
   * const passage2 = await client.getVerse("John", 3, 16);
   * ```
   */
  async getVerse(book: BookName | string, chapter: number, verse: number): Promise<Passage> {
    // Validate reference
    validateReference(book, chapter, verse);

    // Construct query
    const bookName = normalizeBookName(book);
    const query = `${bookName} ${chapter}:${verse}`;

    return this.withCache(`verse:${query}`, this.cacheTtls.verse, async () => {
      // Make request
      const response = await this.search(query);

      // Return first passage (should be only one for single verse)
      if (response.passages.length === 0) {
        throw new APIError(`No passage found for ${query}`);
      }

      const passage = response.passages[0];
      if (!passage) {
        throw new APIError(`No passage found for ${query}`);
      }

      return passage;
    });
  }

  /**
   * Get a passage spanning multiple verses.
   *
   * @param fromBook - Starting book
   * @param fromChapter - Starting chapter
   * @param fromVerse - Starting verse
   * @param toBook - Ending book
   * @param toChapter - Ending chapter
   * @param toVerse - Ending verse
   * @returns Passage containing all verses in range
   * @throws InvalidReferenceError if any reference is invalid
   * @throws APIError if API request fails
   *
   * @example
   * ```ts
   * // Get John 3:16-18
   * const passage = await client.getPassage(
   *   BookName.JOHN, 3, 16,
   *   BookName.JOHN, 3, 18
   * );
   * ```
   */
  async getPassage(
    fromBook: BookName | string,
    fromChapter: number,
    fromVerse: number,
    toBook: BookName | string,
    toChapter: number,
    toVerse: number
  ): Promise<Passage> {
    // Validate references
    const fromRef = validateReference(fromBook, fromChapter, fromVerse);
    const toRef = validateReference(toBook, toChapter, toVerse);

    // Construct query
    const fromBookName = normalizeBookName(fromBook);
    const toBookName = normalizeBookName(toBook);

    let query: string;
    if (fromRef.bookNumber === toRef.bookNumber) {
      // Same book
      if (fromChapter === toChapter) {
        // Same chapter
        query = `${fromBookName} ${fromChapter}:${fromVerse}-${toVerse}`;
      } else {
        // Different chapters
        query = `${fromBookName} ${fromChapter}:${fromVerse}-${toChapter}:${toVerse}`;
      }
    } else {
      // Different books
      query = `${fromBookName} ${fromChapter}:${fromVerse}-${toBookName} ${toChapter}:${toVerse}`;
    }

    return this.withCache(`passage:${query}`, this.cacheTtls.passage, async () => {
      // Make request
      const response = await this.search(query);

      // Return first passage
      if (response.passages.length === 0) {
        throw new APIError(`No passage found for ${query}`);
      }

      const passage = response.passages[0];
      if (!passage) {
        throw new APIError(`No passage found for ${query}`);
      }

      return passage;
    });
  }

  /**
   * Get an entire chapter.
   *
   * @param book - Book name
   * @param chapter - Chapter number
   * @returns Passage containing all verses in the chapter
   * @throws InvalidReferenceError if book/chapter is invalid
   * @throws APIError if API request fails
   *
   * @example
   * ```ts
   * // Get all of John chapter 3
   * const passage = await client.getChapter(BookName.JOHN, 3);
   * ```
   */
  async getChapter(book: BookName | string, chapter: number): Promise<Passage> {
    // Validate book and chapter exist
    const bookNumber = getBookNumber(book);
    const bookInfo = BIBLE_STRUCTURE[bookNumber];

    if (!bookInfo) {
      throw new APIError(`Invalid book number: ${bookNumber}`);
    }

    const maxChapter = bookInfo.chapters;
    if (chapter < 1 || chapter > maxChapter) {
      const bookName = normalizeBookName(book);
      throw new APIError(
        `${bookName} only has ${maxChapter} chapters, but chapter ${chapter} was requested`
      );
    }

    // Construct query
    const bookName = normalizeBookName(book);
    const query = `${bookName} ${chapter}`;

    return this.withCache(`chapter:${query}`, this.cacheTtls.chapter, async () => {
      // Make request
      const response = await this.search(query);

      // Return first passage
      if (response.passages.length === 0) {
        throw new APIError(`No passage found for ${query}`);
      }

      const passage = response.passages[0];
      if (!passage) {
        throw new APIError(`No passage found for ${query}`);
      }

      return passage;
    });
  }

  /**
   * Clear all cached data.
   *
   * This method calls the cache provider's clear method if one is configured.
   * If the cache provider doesn't implement a clear method, this is a no-op.
   *
   * @example
   * ```ts
   * const client = new LSBibleClient({
   *   cache: { provider: new MemoryCacheProvider() }
   * });
   *
   * // Clear all cached data
   * client.clearCache();
   * ```
   */
  clearCache(): void {
    if (this.cacheProvider && "clear" in this.cacheProvider) {
      (this.cacheProvider as { clear(): void }).clear();
    }
  }
}
