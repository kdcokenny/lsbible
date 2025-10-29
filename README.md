# LSBible SDK Monorepo

[![Python Version](https://img.shields.io/badge/python-3.12%2B-blue)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code style: ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)

Multi-language SDK for the LSBible API at [read.lsbible.org](https://read.lsbible.org).

> **Disclaimer:** This is an unofficial, third-party SDK and is not affiliated with, endorsed by, or connected to LSBible or its creators. This project is an independent client library for educational and development purposes.

## Why the LSB?

The **Legacy Standard Bible (LSB)** is a modern literal translation that prioritizes accuracy and consistency:

- **📖 Formal Equivalence** - Word-for-word translation philosophy preserving original structure
- **✝️ Based on NASB95** - Built on the respected New American Standard Bible, updated for modern scholarship
- **🔤 Consistent Translation** - Same Hebrew/Greek words translated consistently throughout
- **🌟 Divine Name** - Uses "Yahweh" for the Tetragrammaton (YHWH) instead of "LORD"
- **🆓 Freely Accessible** - Available for use in applications and tools
- **📅 Modern Scholarship** - Published in 2021 with latest textual research

The LSB's literal approach makes it ideal for serious Bible study, and its structured HTML output is perfect for SDK development, preserving formatting like red-letter text for Jesus' words and italics for translator clarifications.

## Table of Contents

- [Why the LSB?](#why-the-lsb)
- [What Can You Do With LSBible?](#what-can-you-do-with-lsbible)
- [Quick Start](#quick-start)
- [Key Features](#key-features)
- [Available SDKs](#available-sdks)
- [Documentation](#documentation)
- [Repository Structure](#repository-structure)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## What Can You Do With LSBible?

LSBible provides **three powerful ways** to access the Legacy Standard Bible:

### 🤖 As an MCP Server (for AI applications)

Integrate Bible content directly into Claude Desktop, Claude Code, Cursor, or any MCP-compatible LLM application:

- ✅ **Natural language queries** - Ask Claude to "get John 3:16" or "search for verses about love"
- ✅ **Zero setup coding** - Just add to your MCP config, no programming required
- ✅ **20+ supported clients** - Works with Cursor, VS Code, Claude Desktop, Windsurf, and more
- ✅ **Bible study tools** - Generate study guides and cross-reference analyses with built-in prompts
- ✅ **Search distribution** - Understand which parts of the Bible discuss specific topics
- ✅ **Bible structure info** - Query metadata about all 66 books, chapters, and verses

**[View MCP Server Installation Guide →](./packages/typescript-sdk/mcp/README.md)**

### 📦 As a TypeScript SDK (for developers)

Perfect for building modern Bible applications with full type safety:

- ✅ **100% Type-Safe** - Full TypeScript support with Zod validation
- ✅ **Structured Parameters** - No string parsing! Use `client.getVerse(BookName.JOHN, 3, 16)`
- ✅ **Rich formatting preserved** - Access red-letter text (Jesus' words), italics, small-caps, and more
- ✅ **MCP Server included** - Built-in Model Context Protocol server for AI integration
- ✅ **IDE autocomplete** - Enum-based book names for all 66 books (no typos!)
- ✅ **Modern runtime support** - Works with Node.js 18+, Bun, and Deno

**[View TypeScript SDK Documentation →](./packages/typescript-sdk/README.md)**

### 🐍 As a Python SDK (for developers)

Perfect for building Bible applications, study tools, or integrating Scripture into Python projects:

- ✅ **Fetch verses with type safety** - Get any Bible verse with full validation of book/chapter/verse
- ✅ **Search with analytics** - Find verses by text and see distribution across Bible sections and books
- ✅ **Rich formatting preserved** - Access red-letter text (Jesus' words), italics, small-caps, and more
- ✅ **Structured data models** - Work with immutable Pydantic models, not raw HTML or strings
- ✅ **IDE autocomplete** - Enum-based book names for all 66 books (no typos!)
- ✅ **Response caching** - Built-in TTL cache reduces API calls

**[View Python SDK Documentation →](./packages/python-sdk/README.md)**

## Quick Start

### Choose Your Path

#### 🤖 MCP Server Integration

The easiest way to get started - no coding required! Just add LSBible to your MCP client config.

**[📚 Complete Installation Guide →](./packages/typescript-sdk/mcp/README.md)**

Supports 20+ MCP clients including Cursor, Claude Code, VS Code, Claude Desktop, Windsurf, and more. Both local (npx) and remote (https://lsbible.kdco.dev/mcp) options available.

#### 📦 TypeScript SDK Usage

Install and use programmatically with full type safety:

```bash
# Install SDK
npm install lsbible
```

```typescript
import { LSBibleClient, BookName } from "lsbible";

const client = new LSBibleClient();

// Fetch a verse with type-safe parameters
const verse = await client.getVerse(BookName.JOHN, 3, 16);
console.log(verse.verses[0].plainText);
// Output: "For God so loved the world, that He gave His only Son..."

// Access rich formatting
for (const segment of verse.verses[0].segments) {
  if (segment.isRedLetter) {
    console.log(`Jesus said: "${segment.text}"`);
  }
}

// Search with distribution analytics
const results = await client.search("love");
console.log(`Found ${results.matchCount} matches across the Bible`);

// Get an entire chapter
const chapter = await client.getChapter(BookName.PSALMS, 23);
console.log(`Psalm 23 has ${chapter.verseCount} verses`);
```

#### 🐍 Python SDK Usage

Install and use programmatically:

```bash
# Install SDK
uv pip install lsbible
```

```python
from lsbible import LSBibleClient, BookName

with LSBibleClient() as client:
    # Fetch a verse with type-safe parameters
    passage = client.get_verse(BookName.JOHN, 3, 16)
    print(passage.verses[0].plain_text)
    # Output: "For God so loved the world, that He gave..."

    # Access rich formatting
    for segment in passage.verses[0].segments:
        if segment.is_red_letter:
            print(f'Jesus said: "{segment.text}"')

    # Search with distribution analytics
    results = client.search("love")
    print(f"Found {results.match_count} matches across the Bible")

    # See which sections discuss "love" most
    if results.has_search_metadata:
        for section, count in results.counts_by_section.items():
            print(f"{section}: {count} matches")
```

## Key Features

### 🎯 Structured Parameters Over String Parsing

Unlike traditional Bible APIs that parse strings like `"John 3:16"`, LSBible uses **explicit, validated parameters**:

```python
# ✅ GOOD - Type-safe with IDE autocomplete and validation
client.get_verse(BookName.JOHN, 3, 16)

# ❌ NOT SUPPORTED - String parsing (error-prone, no type safety)
client.get_verse("John 3:16")
```

**Why?**
- **Full IDE autocomplete** for all 66 books
- **Early validation** before API calls (catch errors instantly)
- **No parsing ambiguity** (is "1 John" a book or chapter?)
- **Better testing** (easy to generate test cases programmatically)
- **Language agnostic** (works consistently across all SDKs)

### 📖 Complete Bible Coverage

- **66 books** (39 Old Testament + 27 New Testament)
- **1,189 chapters** total
- **31,102 verses** total
- **Full validation** of all book/chapter/verse combinations
- **8 Bible sections** for search distribution analytics

### 🎨 Rich Text Formatting

All formatting from the LSB translation is preserved:

- **Red-letter text** - Words of Jesus highlighted
- **Italics** - Clarifying words added by translators
- **Small caps** - "LORD" representing YHWH (Yahweh)
- **Bold text** - Emphasis in original text
- **Poetry/prose detection** - Structural formatting preserved
- **Subheadings** - Section titles and chapter markers

### 📊 Search Distribution Analytics

For text searches (not Bible references), get rich metadata showing:

- **Total match count** across all of Scripture
- **Distribution by section** (Pentateuch, History, Wisdom, Prophets, Gospels, Epistles)
- **Distribution by book** (which books contain the most matches)
- **Filtered vs total counts** (see how filters affect results)

Example: Searching for "love" shows 436 total matches, with 101 in Pauline Epistles and 95 in Wisdom/Poetry.

### 🔒 Type Safety & Validation

- **Pydantic models** for all data structures
- **Immutable models** (frozen=True) prevent accidental mutations
- **Validation before API calls** - catch errors early
- **Comprehensive error messages** - know exactly what's wrong

## Available SDKs

### ✅ TypeScript SDK (Stable)

**Status:** Production ready
**Version:** 0.1.0
**Node.js:** 18+

```bash
npm install lsbible
```

**Key Stats:**
- 🏛️ Full TypeScript support with Zod validation
- ✅ Comprehensive test suite
- 📦 Built with MCP SDK, Zod, LinkedOM
- 🤖 Model Context Protocol (MCP) server included

**[Full TypeScript SDK Documentation →](./packages/typescript-sdk/README.md)**
**[MCP Server Installation Guide →](./packages/typescript-sdk/mcp/README.md)**

### ✅ Python SDK (Stable)

**Status:** Production ready
**Version:** 0.2.0
**Python:** 3.12+

```bash
uv pip install lsbible
```

**Key Stats:**
- 🏛️ 10 core modules
- ✅ Comprehensive test suite with >80% coverage
- 📦 Built with Pydantic v2, httpx, BeautifulSoup

**[Full Python SDK Documentation →](./packages/python-sdk/README.md)**

### 💡 Want Another Language?

We follow a **community-driven approach** for additional language SDKs. If you'd like to see LSBible in another language (Rust, Go, Java, C#, etc.):

1. **Check existing issues** - Someone may have already requested it
2. **Open a feature request** - Tell us which language and why
3. **Contribute!** - Follow our [SDK Specification](./.specs/SPEC.md) to build one

All SDKs should follow these principles:
- Structured parameter design (no string parsing)
- Full type safety in the target language
- Complete Bible validation
- Rich formatting support

**[Open an Issue →](https://github.com/kdcokenny/lsbible/issues)** | **[Read Contributing Guidelines →](./CONTRIBUTING.md)**

## Documentation

### 📚 Core Documentation
- **[MCP Server Installation](./packages/typescript-sdk/mcp/README.md)** - Install for 20+ MCP clients (Cursor, VS Code, Claude Code, etc.)
- **[TypeScript SDK Guide](./packages/typescript-sdk/README.md)** - Complete TypeScript SDK usage guide
- **[Python SDK Guide](./packages/python-sdk/README.md)** - Complete Python SDK usage guide
- **[API Models Reference](./packages/python-sdk/README.md#models)** - Pydantic model documentation
- **[SDK Specification](./.specs/SPEC.md)** - Full technical specification

### 🛠️ Development Documentation
- **[Contributing Guidelines](./CONTRIBUTING.md)** - How to contribute
- **[Development Workflow](./.specs/SPEC.md#development-workflow)** - Local development setup

### 🔗 External Resources
- **[LSBible Website](https://read.lsbible.org)** - Official LSB Bible reader
- **[Model Context Protocol](https://modelcontextprotocol.io/)** - Learn about MCP
- **[Issue Tracker](https://github.com/kdcokenny/lsbible/issues)** - Report bugs or request features

## Repository Structure

```
lsbible/
├── README.md                  # This file - project overview
├── CONTRIBUTING.md            # Contribution guidelines
├── LICENSE                    # MIT license
├── turbo.json                 # Turborepo configuration
├── package.json               # Root package.json with workspaces
│
├── .specs/                    # Technical specifications
│   ├── SPEC.md                # SDK specification (all languages)
│   └── python-sdk-mcp-server.md  # MCP server specification
│
└── packages/
    ├── typescript-sdk/        # ✅ TypeScript SDK (stable) + MCP Server
    │   ├── src/               # SDK source code
    │   │   ├── client.ts      # API client
    │   │   ├── models.ts      # Zod schemas
    │   │   ├── parser.ts      # HTML parser
    │   │   ├── validators.ts  # Reference validation
    │   │   ├── books.ts       # Bible structure data
    │   │   └── mcp/           # MCP server module
    │   │       ├── server.ts  # MCP server factory
    │   │       ├── stdio.ts   # STDIO entry point
    │   │       ├── tools.ts   # MCP tools
    │   │       └── resources.ts # MCP resources
    │   ├── tests/             # Test suite
    │   ├── examples/          # Usage examples
    │   ├── mcp/               # MCP server documentation
    │   │   └── README.md      # MCP installation guide
    │   ├── README.md          # TypeScript SDK docs
    │   └── package.json       # Package configuration
    │
    └── python-sdk/            # ✅ Python SDK (stable)
        ├── lsbible/           # SDK source code
        │   ├── client.py      # API client
        │   ├── models.py      # Pydantic data models
        │   ├── parser.py      # HTML parser
        │   ├── validators.py  # Reference validation
        │   ├── books.py       # Bible structure data
        │   ├── cache.py       # Response caching
        │   └── exceptions.py  # Custom exceptions
        ├── tests/             # Test suite
        ├── examples/          # Usage examples
        ├── README.md          # Python SDK docs
        └── pyproject.toml     # Python project config
```

## Development

This monorepo uses [Turborepo](https://turbo.build) for build orchestration and [Bun](https://bun.sh) as the package manager.

### Setup

```bash
# Clone repository
git clone https://github.com/kdcokenny/lsbible.git
cd lsbible

# Install monorepo dependencies
bun install

# Setup Python SDK for local development
cd packages/python-sdk
uv sync
```

### Common Commands

```bash
# Build all packages
bun run build

# Run all tests
bun run test

# Run linters
bun run lint

# Run type checking
bun run type-check

# Run specific package commands
bun run --filter python-sdk test
bun run --filter python-sdk lint
```

### TypeScript SDK Development

```bash
cd packages/typescript-sdk

# Install dependencies
bun install

# Run tests
bun test

# Build the project
bun run build

# Type checking
bun run type-check

# Linting and formatting
bun run lint
bun run lint:fix

# Run MCP server locally
bun run dist/mcp/stdio.js
# Or use the built binary
npx lsbible-mcp
```

### Python SDK Development

```bash
cd packages/python-sdk

# Run tests with coverage
uv run pytest

# Type checking (ty - Rust-based type checker)
uv run ty check lsbible

# Linting and formatting
uv run ruff check lsbible
uv run ruff format lsbible
```

## Contributing

We welcome contributions! Whether you want to:

- 🐛 Report bugs
- 💡 Suggest features
- 📝 Improve documentation
- 🔧 Submit code changes
- 🌍 Add new language SDKs

**Please read our [Contributing Guidelines](./CONTRIBUTING.md) first.**

### Quick Contribution Tips

- **Bug reports:** Include Python version, SDK version, and minimal reproduction
- **Feature requests:** Explain use case and expected behavior
- **Code changes:** Follow existing code style, add tests, update docs
- **New SDKs:** Follow the [SDK Specification](./.specs/SPEC.md)

## API Integration

All SDKs integrate with the LSBible API:

- **Base URL:** `https://read.lsbible.org`
- **Endpoint:** `/_next/data/{buildId}/index.json`
- **Query Parameter:** `q` (verse reference or search text)
- **Build ID Management:** Automatically handled by SDK
- **Response Caching:** Configurable TTL (default: 3600s)

## License

MIT License - See [LICENSE](./LICENSE) file for details.

This project is independently developed and is not affiliated with the creators of the Legacy Standard Bible or read.lsbible.org.

---

<div align="center">

**[Install MCP Server →](./packages/typescript-sdk/mcp/README.md)** | **[TypeScript SDK →](./packages/typescript-sdk/README.md)** | **[Python SDK →](./packages/python-sdk/README.md)**

Made with ❤️ for Bible software developers

</div>
