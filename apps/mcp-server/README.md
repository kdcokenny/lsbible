# LSBible MCP Server (Cloudflare Workers)

Cloudflare Workers application providing HTTP transport for the LSBible Model Context Protocol server.

## Features

- **Edge Caching**: Cloudflare Cache API for instant global response caching
- **Stateless Design**: Scales infinitely without coordination overhead
- **CORS Support**: Works with browser-based MCP clients
- **Type Safety**: Full TypeScript with Zod schema validation

## Getting Started

### Prerequisites

- Cloudflare account
- Wrangler CLI: `bun install -g wrangler`
- Authenticated: `wrangler login`

### Installation

```bash
cd apps/mcp-server
bun install
```

### Local Development

```bash
# Start local dev server
bun run dev

# Server runs at http://localhost:8787/mcp
```

### Testing

```bash
# Health check
curl http://localhost:8787/

# List tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'

# Call get_verse tool
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_verse",
      "arguments": {
        "book": "John",
        "chapter": 3,
        "verse": 16
      }
    },
    "id": 2
  }'
```

### Deployment

```bash
# Deploy to Cloudflare Workers
bun run deploy

# Output will show your Worker URL
# https://lsbible-mcp-server.your-subdomain.workers.dev
```

### Custom Domain

1. Add a route in Cloudflare dashboard for your domain
2. Update `wrangler.jsonc`:

```jsonc
{
  "routes": [
    {
      "pattern": "lsbible.kdco.dev/mcp",
      "zone_name": "kdco.dev"
    }
  ]
}
```

3. Deploy: `bun run deploy`

## MCP Capabilities

### Tools (4)

1. **get_verse** - Fetch a single Bible verse
2. **get_passage** - Fetch a range of verses (single or multi-chapter)
3. **get_chapter** - Fetch an entire chapter
4. **search_bible** - Full-text search across the Bible

### Resources (2)

1. **bible://books** - List all 66 books of the Bible
2. **bible://structure/{book}** - Get chapter/verse structure for a specific book

### Prompts (2)

1. **bible_study** - Generate a structured Bible study guide
2. **cross_reference** - Find related verses and themes

## Cache Strategy

The server uses Cloudflare Cache API for edge caching:

- **Verses**: 1 year TTL (Bible verses never change)
- **Search results**: 1 day TTL (may change with API updates)
- **Resources**: 1 year TTL (static Bible structure)

Cache is per-datacenter (no global replication). First request to each edge location will be a cache miss.

## Environment Variables

None required! The server is stateless and uses public APIs.

## Monitoring

```bash
# View logs
wrangler tail

# Or use Cloudflare dashboard
# Workers > lsbible-mcp-server > Metrics
```

## Architecture

```
Client (MCP Client)
    ↓
HTTP Request
    ↓
Cloudflare Workers (Hono + MCP)
    ↓
LSBible SDK
    ↓
LSBible.org API
```

## Cost Estimates

Cloudflare Workers (generous free tier):

- **100,000 requests/day**: $0/month (within free tier)
- **1,000,000 requests/day**: ~$5/month
- **Cache API**: $0 (unlimited)
- **Bandwidth**: $0 (first 10GB free)

## Troubleshooting

**Issue**: Module not found errors

**Solution**: Ensure workspace dependencies are installed: `bun install` from project root

**Issue**: Cache not working locally

**Solution**: Cache API only works in Workers runtime. Use `wrangler dev` instead of local Node.js

**Issue**: CORS errors in browser

**Solution**: Verify CORS middleware is configured with `exposedHeaders: ['Mcp-Session-Id']`

## Related Documentation

- [MCP Specification](https://spec.modelcontextprotocol.io)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Hono Documentation](https://hono.dev/)
- [LSBible TypeScript SDK](../../packages/typescript-sdk/README.md)
