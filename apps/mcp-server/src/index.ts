/**
 * LSBible MCP Server - Cloudflare Workers Application
 *
 * Provides HTTP transport for the LSBible MCP server using Cloudflare Agents
 * McpAgent pattern for simplified deployment.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { LSBibleClient, registerPrompts, registerResources, registerTools } from "lsbible/mcp";
import { CloudflareCacheProvider } from "./cache/cloudflare.js";

/**
 * LSBible MCP Server Agent
 *
 * Exposes the Legacy Standard Bible through the Model Context Protocol,
 * providing tools for verse lookup, passage reading, and Bible search.
 */
export class LSBibleMCP extends McpAgent {
  server = new McpServer({
    name: "lsbible",
    version: "0.1.0",
  });

  async init() {
    // Create client with Cloudflare Cache provider
    const client = new LSBibleClient({
      cache: {
        provider: new CloudflareCacheProvider(),
      },
    });

    // Register all capabilities from shared package
    registerTools(this.server, client);
    registerResources(this.server);
    registerPrompts(this.server);
  }
}

/**
 * Cloudflare Workers fetch handler
 *
 * Routes requests to the appropriate MCP transport:
 * - /mcp: HTTP Streamable transport (recommended)
 * - /: Health check endpoint
 */
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/") {
      return new Response("LSBible MCP Server - OK", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // MCP endpoint - HTTP Streamable transport
    if (url.pathname === "/mcp") {
      return LSBibleMCP.serve("/mcp", {
        binding: "LSBibleMCP_OBJECT"
      }).fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
