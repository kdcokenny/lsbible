/**
 * MCP tool implementations for LSBible.
 *
 * Provides 4 tools:
 * - get_verse: Fetch a single Bible verse
 * - get_passage: Fetch a range of verses
 * - get_chapter: Fetch an entire chapter
 * - search_bible: Full-text search across the Bible
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MemoryCacheProvider } from "../cache/memory.js";
import { LSBibleClient } from "../client.js";
import { BookName } from "../models.js";
import type {
  GetChapterOutput,
  GetPassageOutput,
  GetVerseOutput,
  SearchBibleOutput,
} from "./types.js";

/**
 * Register all tools with the MCP server.
 *
 * @param server - McpServer instance
 * @param client - Optional LSBibleClient instance (for custom cache configuration)
 */
export function registerTools(server: McpServer, client?: LSBibleClient): void {
  // Use provided client or create one with in-memory cache
  const apiClient =
    client ??
    new LSBibleClient({
      cache: {
        provider: new MemoryCacheProvider(),
      },
    });

  // Tool 1: get_verse - Fetch a single Bible verse
  server.registerTool(
    "get_verse",
    {
      title: "Get Bible Verse",
      description: "Fetch a single Bible verse by book, chapter, and verse",
      inputSchema: {
        book: z.nativeEnum(BookName).describe("Book name (e.g., John, Genesis)"),
        chapter: z.number().int().positive().describe("Chapter number"),
        verse: z.number().int().positive().describe("Verse number"),
      },
      outputSchema: {
        reference: z.object({
          book: z.string(),
          chapter: z.number(),
          verse: z.number(),
        }),
        text: z.string(),
        segments: z.array(
          z.object({
            text: z.string(),
            isRedLetter: z.boolean().optional(),
            isItalic: z.boolean().optional(),
            isSmallCaps: z.boolean().optional(),
            isBold: z.boolean().optional(),
          })
        ),
      },
    },
    async ({ book, chapter, verse }) => {
      try {
        const passage = await apiClient.getVerse(book, chapter, verse);
        const verseData = passage.verses[0];

        if (!verseData) {
          const output = {
            error: `No verse found for ${book} ${chapter}:${verse}`,
          };
          return {
            content: [{ type: "text", text: JSON.stringify(output) }],
            isError: true,
          };
        }

        const output: GetVerseOutput = {
          reference: {
            book: verseData.reference.bookName,
            chapter: verseData.reference.chapter,
            verse: verseData.reference.verse,
          },
          text: verseData.plainText,
          segments: verseData.segments,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output) }],
          structuredContent: output,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text", text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 2: get_passage - Fetch a range of verses
  server.registerTool(
    "get_passage",
    {
      title: "Get Bible Passage",
      description: "Fetch a range of verses (single or multi-chapter)",
      inputSchema: {
        fromBook: z.nativeEnum(BookName).describe("Starting book"),
        fromChapter: z.number().int().positive().describe("Starting chapter"),
        fromVerse: z.number().int().positive().describe("Starting verse"),
        toBook: z.nativeEnum(BookName).describe("Ending book"),
        toChapter: z.number().int().positive().describe("Ending chapter"),
        toVerse: z.number().int().positive().describe("Ending verse"),
      },
      outputSchema: {
        reference: z.object({
          from: z.object({
            book: z.string(),
            chapter: z.number(),
            verse: z.number(),
          }),
          to: z.object({
            book: z.string(),
            chapter: z.number(),
            verse: z.number(),
          }),
        }),
        verses: z.array(
          z.object({
            reference: z.object({
              book: z.string(),
              chapter: z.number(),
              verse: z.number(),
            }),
            text: z.string(),
            segments: z.array(
              z.object({
                text: z.string(),
                isRedLetter: z.boolean().optional(),
                isItalic: z.boolean().optional(),
                isSmallCaps: z.boolean().optional(),
                isBold: z.boolean().optional(),
              })
            ),
          })
        ),
      },
    },
    async ({ fromBook, fromChapter, fromVerse, toBook, toChapter, toVerse }) => {
      try {
        const passage = await apiClient.getPassage(
          fromBook,
          fromChapter,
          fromVerse,
          toBook,
          toChapter,
          toVerse
        );

        const output: GetPassageOutput = {
          reference: {
            from: {
              book: passage.fromRef.bookName,
              chapter: passage.fromRef.chapter,
              verse: passage.fromRef.verse,
            },
            to: {
              book: passage.toRef.bookName,
              chapter: passage.toRef.chapter,
              verse: passage.toRef.verse,
            },
          },
          verses: passage.verses.map((v) => ({
            reference: {
              book: v.reference.bookName,
              chapter: v.reference.chapter,
              verse: v.reference.verse,
            },
            text: v.plainText,
            segments: v.segments,
          })),
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output) }],
          structuredContent: output,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text", text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 3: get_chapter - Fetch an entire chapter
  server.registerTool(
    "get_chapter",
    {
      title: "Get Bible Chapter",
      description: "Fetch an entire chapter",
      inputSchema: {
        book: z.nativeEnum(BookName).describe("Book name"),
        chapter: z.number().int().positive().describe("Chapter number"),
      },
      outputSchema: {
        reference: z.object({
          book: z.string(),
          chapter: z.number(),
          verseCount: z.number(),
        }),
        verses: z.array(
          z.object({
            reference: z.object({
              book: z.string(),
              chapter: z.number(),
              verse: z.number(),
            }),
            text: z.string(),
            segments: z.array(
              z.object({
                text: z.string(),
                isRedLetter: z.boolean().optional(),
                isItalic: z.boolean().optional(),
                isSmallCaps: z.boolean().optional(),
                isBold: z.boolean().optional(),
              })
            ),
          })
        ),
      },
    },
    async ({ book, chapter }) => {
      try {
        const passage = await apiClient.getChapter(book, chapter);

        const output: GetChapterOutput = {
          reference: {
            book: passage.verses[0]?.reference.bookName ?? book,
            chapter,
            verseCount: passage.verses.length,
          },
          verses: passage.verses.map((v) => ({
            reference: {
              book: v.reference.bookName,
              chapter: v.reference.chapter,
              verse: v.reference.verse,
            },
            text: v.plainText,
            segments: v.segments,
          })),
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output) }],
          structuredContent: output,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text", text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 4: search_bible - Full-text search across the Bible
  server.registerTool(
    "search_bible",
    {
      title: "Search Bible",
      description: "Full-text search across the entire Bible",
      inputSchema: {
        query: z.string().describe("Search query text"),
        includeDistribution: z
          .boolean()
          .optional()
          .default(false)
          .describe("Include search result distribution by section and book"),
      },
      outputSchema: {
        query: z.string(),
        resultCount: z.number(),
        results: z.array(
          z.object({
            reference: z.object({
              book: z.string(),
              chapter: z.number(),
              verse: z.number(),
            }),
            text: z.string(),
            segments: z.array(
              z.object({
                text: z.string(),
                isRedLetter: z.boolean().optional(),
                isItalic: z.boolean().optional(),
                isSmallCaps: z.boolean().optional(),
                isBold: z.boolean().optional(),
              })
            ),
          })
        ),
        distribution: z
          .object({
            bySection: z.record(z.string(), z.number()),
            byBook: z.record(z.string(), z.number()),
          })
          .optional(),
      },
    },
    async ({ query, includeDistribution = false }) => {
      try {
        const searchResponse = await apiClient.search(query);

        // Build distribution if requested and available
        const distribution: SearchBibleOutput["distribution"] = includeDistribution
          ? {
              bySection: searchResponse.countsBySection ?? {},
              byBook: searchResponse.countsByBook ?? {},
            }
          : undefined;

        // Extract verse results from passages
        const results = searchResponse.passages.flatMap((passage) =>
          passage.verses.map((v) => ({
            reference: {
              book: v.reference.bookName,
              chapter: v.reference.chapter,
              verse: v.reference.verse,
            },
            text: v.plainText,
            segments: v.segments,
          }))
        );

        const output: SearchBibleOutput = {
          query,
          resultCount: searchResponse.matchCount,
          results,
          distribution,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output) }],
          structuredContent: output,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text", text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );
}
