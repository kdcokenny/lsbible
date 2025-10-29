/**
 * MCP resource handlers for LSBible.
 *
 * Provides 2 resources:
 * - bible://books (static): List all 66 books of the Bible
 * - bible://structure/{book} (dynamic): Get chapter/verse structure for a specific book
 */

import { type McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BIBLE_STRUCTURE, type BookInfo } from "../books.js";
import { BookName } from "../models.js";
import type { BookResourceInfo, BookStructureResource } from "./types.js";

/**
 * Register all resources with the MCP server.
 *
 * @param server - McpServer instance
 */
export function registerResources(server: McpServer): void {
  // Resource 1: bible://books - Static resource listing all books
  server.registerResource(
    "books",
    "bible://books",
    {
      title: "Bible Books",
      description: "List of all 66 books in the Bible",
      mimeType: "application/json",
    },
    async (uri) => {
      const books: BookResourceInfo[] = Object.values(BIBLE_STRUCTURE).map(
        (bookInfo: BookInfo) => ({
          name: bookInfo.name,
          testament: bookInfo.testament,
          chapters: bookInfo.chapters,
          verses: bookInfo.verses.reduce((sum, count) => sum + count, 0),
        })
      );

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(books, null, 2),
          },
        ],
      };
    }
  );

  // Resource 2: bible://structure/{book} - Dynamic resource with completion
  server.registerResource(
    "structure",
    new ResourceTemplate("bible://structure/{book}", {
      list: undefined,
      complete: {
        book: (value: string) => {
          // Return book names that match the partial input
          return Object.values(BookName)
            .filter((bookName) => bookName.toLowerCase().startsWith(value.toLowerCase()))
            .slice(0, 10);
        },
      },
    }),
    {
      title: "Bible Book Structure",
      description: "Chapter and verse counts for a specific book",
      mimeType: "application/json",
    },
    async (uri, { book }) => {
      // Normalize book name for lookup
      const bookName = book as string;

      // Find the book in BIBLE_STRUCTURE by name
      const bookEntry = Object.values(BIBLE_STRUCTURE).find(
        (b) => b.name.toLowerCase() === bookName.toLowerCase()
      );

      if (!bookEntry) {
        throw new Error(`Unknown book: ${bookName}`);
      }

      const data: BookStructureResource = {
        uri: uri.href,
        book: bookEntry.name,
        testament: bookEntry.testament,
        totalChapters: bookEntry.chapters,
        totalVerses: bookEntry.verses.reduce((sum, verses) => sum + verses, 0),
        chapters: bookEntry.verses.map((verses, index) => ({
          chapter: index + 1,
          verses,
        })),
      };

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );
}
