/**
 * LSBible MCP Server Module
 *
 * Provides Model Context Protocol access to the Legacy Standard Bible.
 *
 * @example
 * ```ts
 * // Create and start server with stdio transport
 * import { createLSBibleMCPServer } from 'lsbible/mcp';
 * import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
 *
 * const server = createLSBibleMCPServer();
 * const transport = new StdioServerTransport();
 * await server.connect(transport);
 * ```
 *
 * @example
 * ```ts
 * // Create and start server with HTTP transport
 * import { createLSBibleMCPServer } from 'lsbible/mcp';
 * import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
 *
 * const server = createLSBibleMCPServer();
 * const transport = new StreamableHTTPServerTransport({ ... });
 * await server.connect(transport);
 * ```
 */

// Export main factory function
export { createLSBibleMCPServer } from "./server.js";

// Export registration functions (for advanced use)
export { registerTools } from "./tools.js";
export { registerResources } from "./resources.js";
export { registerPrompts } from "./prompts.js";

// Re-export client and cache for MCP server use
export { LSBibleClient } from "../client.js";
export { type CacheProvider, type CacheOptions, CacheTTL } from "../cache/interface.js";
export { MemoryCacheProvider } from "../cache/memory.js";
export { NoopCacheProvider } from "../cache/noop.js";

// Export types
export type * from "./types.js";
