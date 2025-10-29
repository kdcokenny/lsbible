/**
 * MCP prompt templates for LSBible.
 *
 * Provides 2 prompts:
 * - bible_study: Generate a structured Bible study guide
 * - cross_reference: Find related verses and themes
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Register all prompts with the MCP server.
 *
 * @param server - McpServer instance
 */
export function registerPrompts(server: McpServer): void {
  // Prompt 1: bible_study - Generate a structured Bible study guide
  server.registerPrompt(
    "bible_study",
    {
      title: "Bible Study Guide",
      description: "Generate a comprehensive Bible study guide for a passage",
      argsSchema: {
        passage: z.string().describe('Bible passage reference (e.g., "John 3:16-21")'),
        focusAreas: z
          .string()
          .optional()
          .describe(
            'Optional comma-separated areas to focus on (e.g., "context, application, cross-references")'
          ),
      },
    },
    (args) => {
      const { passage, focusAreas } = args as { passage: string; focusAreas?: string };
      const focusText = focusAreas ? `\n\nFocus areas: ${focusAreas}` : "";

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Create a comprehensive Bible study guide for ${passage}.

Include:
1. Historical and cultural context
2. Key themes and theological insights
3. Practical applications for modern readers
4. Discussion questions
5. Cross-references to related passages${focusText}`,
            },
          },
        ],
      };
    }
  );

  // Prompt 2: cross_reference - Find related verses and themes
  server.registerPrompt(
    "cross_reference",
    {
      title: "Find Cross References",
      description: "Find verses related to a specific verse",
      argsSchema: {
        verse: z.string().describe('Bible verse reference (e.g., "Romans 8:28")'),
        maxResults: z.string().optional().describe("Maximum number of results (default: 10)"),
      },
    },
    (args) => {
      const { verse, maxResults: maxResultsStr } = args as { verse: string; maxResults?: string };
      const maxResults = maxResultsStr ? Number.parseInt(maxResultsStr, 10) : 10;
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Find up to ${maxResults} Bible verses that are thematically related to ${verse}.

For each related verse:
1. Explain the thematic connection
2. Note any parallel language or concepts
3. Highlight complementary or contrasting perspectives`,
            },
          },
        ],
      };
    }
  );
}
