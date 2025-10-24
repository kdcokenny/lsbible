# LSBible MCP Server

[![PyPI version](https://img.shields.io/pypi/v/lsbible.svg)](https://pypi.org/project/lsbible/)
[![Python Version](https://img.shields.io/badge/python-3.12%2B-blue)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Model Context Protocol server for accessing the Legacy Standard Bible in Claude Desktop, Cursor, VS Code, and other MCP-compatible applications.

> **📚 Looking for the Python SDK?** See the **[Python SDK Documentation](../../README.md)** for programmatic Bible access.

## Table of Contents

- [What is MCP?](#what-is-mcp)
- [Installation](#installation)
  - [Requirements](#requirements)
  - [Installation Guides by Client](#installation-guides-by-client)
  - [Verifying Installation](#verifying-installation)
  - [Troubleshooting](#troubleshooting)
- [Using with Claude](#using-with-claude)
  - [Basic Queries](#basic-queries)
  - [Search Queries](#search-queries)
  - [Bible Study](#bible-study)
  - [Bible Structure](#bible-structure)
- [Available Tools](#available-tools)
- [Resources](#resources)
- [Prompts](#prompts)
- [Development](#development)

## What is MCP?

The **Model Context Protocol (MCP)** is a standard for connecting LLM applications to external data sources and tools. The LSBible MCP server allows Claude Desktop, Claude Code, and other MCP-compatible applications to access Bible content through natural language.

**What you can do with MCP:**

- 🗣️ Ask Claude for Bible verses in natural language
- 🔍 Search Scripture with automatic result formatting
- 📖 Get Bible structure and metadata on demand
- 📝 Generate Bible study guides and cross-references
- 📊 Analyze search distribution across Scripture sections

## Installation

### Requirements

- Python 3.12+
- [`uv`](https://docs.astral.sh/uv/getting-started/installation/) or `pip` package manager (uv recommended)
- An MCP-compatible client (Cursor, Claude Code, VS Code, etc.)

### Installation Guides by Client

<details>
<summary><b>Install in Cursor</b></summary>

Go to: `Settings` → `Cursor Settings` → `MCP` → `Add new global MCP server`

Paste the configuration into your `~/.cursor/mcp.json` file. You may also install in a specific project by creating `.cursor/mcp.json` in your project folder.

**Option 1: Using uvx (Recommended - No Installation Required)**

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "uvx",
      "args": ["--from", "lsbible[server]", "lsbible-mcp"]
    }
  }
}
```

**Option 2: Using Installed Tool**

First install globally:
```bash
uv tool install 'lsbible[server]'
```

Then configure:
```json
{
  "mcpServers": {
    "lsbible": {
      "command": "lsbible-mcp",
      "args": []
    }
  }
}
```

For more info, see [Cursor MCP docs](https://docs.cursor.com/context/model-context-protocol).

</details>

<details>
<summary><b>Install in Claude Code</b></summary>

Run this command in your terminal:

```bash
claude mcp add lsbible -- uvx --from 'lsbible[server]' lsbible-mcp
```

Or if you've installed it as a tool:

```bash
uv tool install 'lsbible[server]'
claude mcp add lsbible -- lsbible-mcp
```

For more info, see [Claude Code MCP docs](https://docs.anthropic.com/en/docs/claude-code/mcp).

</details>

<details>
<summary><b>Install in Claude Desktop</b></summary>

Open Claude Desktop and navigate to **Settings** → **Developer** → **Edit Config**.

Add this configuration to your `claude_desktop_config.json`:

**Option 1: Using uvx (Recommended)**

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "uvx",
      "args": ["--from", "lsbible[server]", "lsbible-mcp"]
    }
  }
}
```

**Option 2: Using Installed Tool**

First install:
```bash
uv tool install 'lsbible[server]'
```

Then configure:
```json
{
  "mcpServers": {
    "lsbible": {
      "command": "lsbible-mcp",
      "args": []
    }
  }
}
```

**Config file locations:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

For more info, see [Claude Desktop MCP docs](https://modelcontextprotocol.io/quickstart/user).

</details>

<details>
<summary><b>Install in VS Code</b></summary>

Add this to your VS Code settings file (`.vscode/settings.json` or global settings):

**Option 1: Using uvx (Recommended)**

```json
{
  "mcp": {
    "servers": {
      "lsbible": {
        "type": "stdio",
        "command": "uvx",
        "args": ["--from", "lsbible[server]", "lsbible-mcp"]
      }
    }
  }
}
```

**Option 2: Using Installed Tool**

First install:
```bash
uv tool install 'lsbible[server]'
```

Then configure:
```json
{
  "mcp": {
    "servers": {
      "lsbible": {
        "type": "stdio",
        "command": "lsbible-mcp",
        "args": []
      }
    }
  }
}
```

For more info, see [VS Code MCP docs](https://code.visualstudio.com/docs/copilot/chat/mcp-servers).

</details>

<details>
<summary><b>Install in Windsurf</b></summary>

Add this to your Windsurf MCP config file:

**Option 1: Using uvx (Recommended)**

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "uvx",
      "args": ["--from", "lsbible[server]", "lsbible-mcp"]
    }
  }
}
```

**Option 2: Using Installed Tool**

First install:
```bash
uv tool install 'lsbible[server]'
```

Then configure:
```json
{
  "mcpServers": {
    "lsbible": {
      "command": "lsbible-mcp",
      "args": []
    }
  }
}
```

For more info, see [Windsurf MCP docs](https://docs.windsurf.com/windsurf/cascade/mcp).

</details>

<details>
<summary><b>Install in Cline</b></summary>

**Via Cline UI:**

1. Open **Cline**
2. Click the hamburger menu (☰) → **MCP Servers**
3. Choose **Remote Servers** tab
4. Click **Edit Configuration**
5. Add the configuration below

**Configuration:**

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "uvx",
      "args": ["--from", "lsbible[server]", "lsbible-mcp"]
    }
  }
}
```

Or if installed as a tool:
```json
{
  "mcpServers": {
    "lsbible": {
      "command": "lsbible-mcp",
      "args": []
    }
  }
}
```

</details>

<details>
<summary><b>Install in Zed</b></summary>

Add this to your Zed `settings.json`:

```json
{
  "context_servers": {
    "lsbible": {
      "source": "custom",
      "command": "uvx",
      "args": ["--from", "lsbible[server]", "lsbible-mcp"]
    }
  }
}
```

Or if installed as a tool:
```json
{
  "context_servers": {
    "lsbible": {
      "source": "custom",
      "command": "lsbible-mcp",
      "args": []
    }
  }
}
```

For more info, see [Zed Context Server docs](https://zed.dev/docs/assistant/context-servers).

</details>

<details>
<summary><b>Install in Roo Code</b></summary>

Add this to your Roo Code MCP configuration:

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "uvx",
      "args": ["--from", "lsbible[server]", "lsbible-mcp"]
    }
  }
}
```

Or if installed as a tool:
```json
{
  "mcpServers": {
    "lsbible": {
      "command": "lsbible-mcp",
      "args": []
    }
  }
}
```

For more info, see [Roo Code MCP docs](https://docs.roocode.com/features/mcp/using-mcp-in-roo).

</details>

<details>
<summary><b>Install in JetBrains AI Assistant</b></summary>

1. Go to **Settings** → **Tools** → **AI Assistant** → **Model Context Protocol (MCP)**
2. Click **+ Add**
3. Click **Command** in top-left and select **As JSON**
4. Add this configuration:

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "uvx",
      "args": ["--from", "lsbible[server]", "lsbible-mcp"]
    }
  }
}
```

5. Click **Apply**

For more info, see [JetBrains AI Assistant docs](https://www.jetbrains.com/help/ai-assistant/configure-an-mcp-server.html).

</details>

<details>
<summary><b>Install in Augment Code</b></summary>

**Via UI:**

1. Click hamburger menu → **Settings** → **Tools**
2. Click **+ Add MCP**
3. Enter command: `uvx --from 'lsbible[server]' lsbible-mcp`
4. Name: **LSBible**
5. Click **Add**

**Manual Configuration:**

```json
{
  "augment.advanced": {
    "mcpServers": [
      {
        "name": "lsbible",
        "command": "uvx",
        "args": ["--from", "lsbible[server]", "lsbible-mcp"]
      }
    ]
  }
}
```

</details>

<details>
<summary><b>Install for Local Development</b></summary>

For local development or testing from source:

```bash
# Install from local checkout
cd /path/to/lsbible/packages/python-sdk
uv pip install -e ".[server]"
```

Configure your MCP client:

```json
{
  "mcpServers": {
    "lsbible-dev": {
      "command": "uv",
      "args": [
        "run",
        "--project",
        "/path/to/lsbible/packages/python-sdk",
        "lsbible-mcp"
      ]
    }
  }
}
```

Replace `/path/to/lsbible/packages/python-sdk` with your actual project path.

</details>

<details>
<summary><b>Using with pip Instead of uv</b></summary>

If you prefer `pip` over `uv`:

**Install:**
```bash
pip install 'lsbible[server]'
```

**Configure:**
```json
{
  "mcpServers": {
    "lsbible": {
      "command": "lsbible-mcp",
      "args": []
    }
  }
}
```

**Note:** The `uvx` command won't work with pip. You must install first, then use the `lsbible-mcp` command directly.

</details>

### Verifying Installation

After configuration:

1. **Restart your MCP client** (Cursor, Claude Desktop, etc.)
2. **Check for MCP server status** (look for indicators in your client's UI)
3. **Test with a simple query**: "Get John 3:16"

If the server is working correctly, you should get a formatted Bible verse response.

### Troubleshooting

<details>
<summary><b>Command Not Found: uvx</b></summary>

If `uvx` is not found:

1. Install uv following the [official installation guide](https://docs.astral.sh/uv/getting-started/installation/)
2. Or use the pre-installed tool method instead:
   ```bash
   uv tool install 'lsbible[server]'
   ```
   Then use `lsbible-mcp` as the command

</details>

<details>
<summary><b>Python Version Issues</b></summary>

LSBible requires Python 3.12+. Check your version:

```bash
python --version
```

If you have an older version, install Python 3.12+ or use `uv` which can manage Python versions automatically.

</details>

<details>
<summary><b>Server Won't Start</b></summary>

Try these steps:

1. **Check installation**:
   ```bash
   uvx --from 'lsbible[server]' lsbible-mcp --help
   ```

2. **View server logs** in your MCP client's developer console

3. **Try reinstalling**:
   ```bash
   uv tool uninstall lsbible
   uv tool install 'lsbible[server]'
   ```

</details>

<details>
<summary><b>Windows-Specific Issues</b></summary>

On Windows, you may need to use full paths or adjust the command format:

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "cmd",
      "args": ["/c", "uvx", "--from", "lsbible[server]", "lsbible-mcp"]
    }
  }
}
```

</details>

## Using with Claude

Once configured, you can interact with the Bible using natural language:

### Basic Queries

```
You: "Get John 3:16"
Claude: [Uses get_verse tool]
       For God so loved the world, that He gave His only Son...

You: "Show me John chapter 3 verses 16 through 18"
Claude: [Uses get_passage tool]
       [Displays all three verses with formatting]

You: "Get all of Psalm 23"
Claude: [Uses get_chapter tool]
       [Displays the entire chapter]
```

### Search Queries

```
You: "Search for verses about love"
Claude: [Uses search_bible tool with limit=10]
       Found 436 total matches. Here are the first 10:
       [Shows verses with distribution metadata]

You: "Find verses mentioning faith and show which sections discuss it most"
Claude: [Uses search_bible tool]
       [Shows results plus section distribution chart]
```

### Bible Study

```
You: "Help me study Romans 8:28-39"
Claude: [Uses bible_study prompt]
       [Generates comprehensive study guide with context, meaning, application]

You: "Find cross-references for John 3:16"
Claude: [Uses cross_reference prompt]
       [Searches related verses and explains connections]
```

### Bible Structure

```
You: "Show me all the books of the Bible"
Claude: [Uses bible://books resource]
       [Lists all 66 books with chapter counts]

You: "How many chapters does Psalms have?"
Claude: [Uses bible://structure/Psalms resource]
       Psalms has 150 chapters with 2,461 total verses.
```

## Available Tools

The MCP server provides 4 tools for Bible access:

### `get_verse`

Fetch a single Bible verse with formatting segments.

**Parameters:**
- `book` (string): Book name (e.g., "John", "Genesis", "1 John")
- `chapter` (integer): Chapter number
- `verse` (integer): Verse number

**Returns:**
```json
{
  "reference": "John 3:16",
  "text": "For God so loved the world...",
  "segments": [
    {
      "text": "For God so loved the world",
      "is_red_letter": false,
      "is_italic": false,
      "is_bold": false,
      "is_small_caps": false
    }
  ]
}
```

### `get_passage`

Fetch a passage (multiple verses) with formatting.

**Parameters:**
- `book` (string): Book name
- `start_chapter` (integer): Starting chapter
- `start_verse` (integer): Starting verse
- `end_chapter` (integer, optional): Ending chapter (defaults to start_chapter)
- `end_verse` (integer, optional): Ending verse (defaults to start_verse)

**Returns:**
```json
{
  "reference": "John 3:16-18",
  "verses": [
    {
      "verse_number": 16,
      "text": "...",
      "segments": [...]
    }
  ],
  "verse_count": 3
}
```

### `get_chapter`

Fetch an entire chapter.

**Parameters:**
- `book` (string): Book name
- `chapter` (integer): Chapter number

**Returns:**
```json
{
  "reference": "John 3",
  "verses": [...],
  "verse_count": 36
}
```

### `search_bible`

Search for verses containing text with distribution metadata.

**Parameters:**
- `query` (string): Search query
- `limit` (integer, optional): Maximum results (default: 10)

**Returns:**
```json
{
  "query": "love",
  "results": [
    {
      "reference": "Genesis 22:2",
      "text": "..."
    }
  ],
  "result_count": 10,
  "total_matches": 436,
  "distribution": {
    "by_section": {
      "Pentateuch": 41,
      "Wisdom and Poetry": 95,
      "Pauline Epistles": 101
    },
    "by_book": {
      "Genesis": 12,
      "John": 18,
      "1 Corinthians": 15
    },
    "total_count": 436,
    "filtered_count": 436
  }
}
```

**Note:** Distribution metadata is only included for **text searches**, not Bible reference lookups.

## Resources

Resources provide static data about Bible structure:

### `bible://books`

List all 66 books with metadata.

**Returns:**
```json
{
  "books": [
    {
      "name": "Genesis",
      "chapters": 50,
      "testament": "Old",
      "total_verses": 1533
    }
  ],
  "total_books": 66
}
```

### `bible://structure/{book}`

Get chapter/verse structure for a specific book.

**Example:** `bible://structure/John`

**Returns:**
```json
{
  "book": "John",
  "chapters": 21,
  "verses_per_chapter": [51, 25, 36, 54, 47, 71, 53, 59, 41, 42, 57, 50, 38, 31, 27, 33, 26, 40, 42, 31, 25],
  "total_verses": 879
}
```

## Prompts

Prompts help generate structured study materials:

### `bible_study`

Generate a Bible study prompt for a passage.

**Parameters:**
- `book` (string): Book name
- `chapter` (integer): Chapter number
- `verse_start` (integer): Starting verse
- `verse_end` (integer, optional): Ending verse

**Generates a prompt asking Claude to provide:**
1. Context (historical and literary)
2. Meaning (key themes and theology)
3. Application (modern relevance)
4. Cross-references (related passages)

### `cross_reference`

Generate a cross-reference analysis prompt.

**Parameters:**
- `reference` (string): Bible reference (e.g., "John 3:16")

**Generates a prompt asking Claude to:**
1. Fetch the verse
2. Identify key themes
3. Search for related verses
4. Explain connections

## Development

For information on running the MCP server locally or contributing, see the [Python SDK Development Guide](../../README.md#development).

---

<div align="center">

**[← Back to Python SDK Documentation](../../README.md)** | **[← Back to Project Root](../../../../README.md)**

Made with ❤️ for Bible software developers

</div>
