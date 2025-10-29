/**
 * LSBible MCP Server factory function.
 *
 * Creates a configured MCP server with all tools, resources, and prompts.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPrompts } from "./prompts.js";
import { registerResources } from "./resources.js";
import { registerTools } from "./tools.js";

/**
 * Create and configure an LSBible MCP server.
 *
 * The server exposes:
 * - 4 tools: get_verse, get_passage, get_chapter, search_bible
 * - 2 resources: bible://books, bible://structure/{book}
 * - 2 prompts: bible_study, cross_reference
 *
 * @returns Configured McpServer instance
 *
 * @example
 * ```ts
 * // For stdio transport (local)
 * const server = createLSBibleMCPServer();
 * const transport = new StdioServerTransport();
 * await server.connect(transport);
 * ```
 *
 * @example
 * ```ts
 * // For HTTP transport (Cloudflare Workers)
 * const server = createLSBibleMCPServer();
 * const transport = new StreamableHTTPServerTransport(...);
 * await server.connect(transport);
 * ```
 */
export function createLSBibleMCPServer(): McpServer {
  const server = new McpServer({
    name: "lsbible",
    version: "0.1.0",
  });

  // Register all capabilities
  registerTools(server);
  registerResources(server);
  registerPrompts(server);

  return server;
}
