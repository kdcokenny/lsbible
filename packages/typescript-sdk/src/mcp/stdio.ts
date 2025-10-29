#!/usr/bin/env node
/**
 * LSBible MCP Server stdio entry point.
 *
 * This script starts the MCP server with stdio transport for local integration.
 * Use this for Claude Desktop, Cursor, or other local MCP clients.
 *
 * Usage:
 *   bun dist/mcp/stdio.js
 *   node dist/mcp/stdio.js
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLSBibleMCPServer } from "./server.js";

async function main() {
  const server = createLSBibleMCPServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Log to stderr (stdio transport uses stdout for JSON-RPC)
  console.error("LSBible MCP Server running on stdio");
  console.error("Ready to accept connections from MCP clients");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
