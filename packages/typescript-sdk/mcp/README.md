# LSBible MCP - Up-to-date Bible API For Any Prompt

[![NPM Version](https://img.shields.io/npm/v/lsbible?color=red)](https://www.npmjs.com/package/lsbible) [![MIT licensed](https://img.shields.io/npm/l/lsbible)](../../LICENSE) [![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=lsbible&config=eyJ1cmwiOiJodHRwczovL2xzYmlibGUua2Rjby5kZXYvbWNwIn0%3D)

## ❌ Without LSBible MCP

LLMs rely on outdated or incomplete information about Bible verses and passages. You get:

- ❌ Inaccurate verse text from outdated training data
- ❌ Hallucinated verses that don't exist
- ❌ No access to structured Bible data with formatting

## ✅ With LSBible MCP

LSBible MCP pulls accurate, structured Bible passages from the Legacy Standard Bible (LSB) — and places them directly into your prompt.

Add to your prompt in Cursor or other MCP clients:

```txt
Get John 3:16 from the Legacy Standard Bible
```

```txt
Search for all verses containing "faith" in the LSB
```

LSBible MCP fetches accurate Bible text right into your LLM's context.

- 1️⃣ Write your prompt naturally
- 2️⃣ Request Bible verses or passages
- 3️⃣ Get accurate LSB text with formatting

No tab-switching, no hallucinated verses, no outdated text.

## 🛠️ Installation

### Requirements

- Node.js >= v18.0.0
- Cursor, Claude Code, VSCode, Windsurf or another MCP Client

> [!NOTE]
> Both local (STDIO) and remote (HTTP) installation methods are supported. Local is recommended for better performance and privacy.

<details>
<summary><b>Install in Cursor</b></summary>

Go to: `Settings` -> `Cursor Settings` -> `MCP` -> `Add new global MCP server`

Pasting the following configuration into your Cursor `~/.cursor/mcp.json` file is the recommended approach. You may also install in a specific project by creating `.cursor/mcp.json` in your project folder. See [Cursor MCP docs](https://docs.cursor.com/context/model-context-protocol) for more info.

> Since Cursor 1.0, you can click the install button below for instant one-click installation.

#### Cursor Remote Server Connection

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=lsbible&config=eyJ1cmwiOiJodHRwczovL2xzYmlibGUua2Rjby5kZXYvbWNwIn0%3D)

```json
{
  "mcpServers": {
    "lsbible": {
      "url": "https://lsbible.kdco.dev/mcp"
    }
  }
}
```

#### Cursor Local Server Connection

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=lsbible&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsImxzYmlibGUiXX0%3D)

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "npx",
      "args": ["-y", "lsbible-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Claude Code</b></summary>

Run this command. See [Claude Code MCP docs](https://docs.anthropic.com/en/docs/claude-code/mcp) for more info.

#### Claude Code Remote Server Connection

```sh
claude mcp add --transport http lsbible https://lsbible.kdco.dev/mcp
```

#### Claude Code Local Server Connection

```sh
claude mcp add lsbible -- npx -y lsbible-mcp
```

</details>

<details>
<summary><b>Install in Amp</b></summary>

Run this command in your terminal. See [Amp MCP docs](https://ampcode.com/manual#mcp) for more info.

#### Remote Server Connection

```sh
amp mcp add lsbible https://lsbible.kdco.dev/mcp
```

#### Local Server Connection

```sh
amp mcp add lsbible npx -y lsbible-mcp
```

</details>

<details>
<summary><b>Install in Windsurf</b></summary>

Add this to your Windsurf MCP config file. See [Windsurf MCP docs](https://docs.windsurf.com/windsurf/cascade/mcp) for more info.

#### Windsurf Remote Server Connection

```json
{
  "mcpServers": {
    "lsbible": {
      "serverUrl": "https://lsbible.kdco.dev/mcp"
    }
  }
}
```

#### Windsurf Local Server Connection

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "npx",
      "args": ["-y", "lsbible-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in VS Code</b></summary>

Add this to your VS Code MCP config file. See [VS Code MCP docs](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) for more info.

#### VS Code Remote Server Connection

```json
"mcp": {
  "servers": {
    "lsbible": {
      "type": "http",
      "url": "https://lsbible.kdco.dev/mcp"
    }
  }
}
```

#### VS Code Local Server Connection

```json
"mcp": {
  "servers": {
    "lsbible": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "lsbible-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Cline</b></summary>

You can easily install LSBible through the Cline MCP Server Marketplace or by directly editing configuration:

1. Open **Cline**.
2. Click the hamburger menu icon (☰) to enter the **MCP Servers** section.
3. Choose **Remote Servers** tab.
4. Click the **Edit Configuration** button.
5. Add lsbible to `mcpServers`:

#### Remote Server Connection

```json
{
  "mcpServers": {
    "lsbible": {
      "url": "https://lsbible.kdco.dev/mcp",
      "type": "streamableHttp"
    }
  }
}
```

#### Local Server Connection

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "npx",
      "args": ["-y", "lsbible-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Zed</b></summary>

Add this to your Zed `settings.json`. See [Zed Context Server docs](https://zed.dev/docs/assistant/context-servers) for more info.

```json
{
  "context_servers": {
    "lsbible": {
      "source": "custom",
      "command": "npx",
      "args": ["-y", "lsbible-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Augment Code</b></summary>

To configure LSBible MCP in Augment Code:

### Manual Configuration

1. Press Cmd/Ctrl Shift P or go to the hamburger menu in the Augment panel
2. Select Edit Settings
3. Under Advanced, click Edit in settings.json
4. Add the server configuration to the `mcpServers` array:

#### Local Server Connection

```json
"augment.advanced": {
  "mcpServers": [
    {
      "name": "lsbible",
      "command": "npx",
      "args": ["-y", "lsbible-mcp"]
    }
  ]
}
```

Once the MCP server is added, restart your editor.

</details>

<details>
<summary><b>Install in Roo Code</b></summary>

Add this to your Roo Code MCP configuration file. See [Roo Code MCP docs](https://docs.roocode.com/features/mcp/using-mcp-in-roo) for more info.

#### Roo Code Remote Server Connection

```json
{
  "mcpServers": {
    "lsbible": {
      "type": "streamable-http",
      "url": "https://lsbible.kdco.dev/mcp"
    }
  }
}
```

#### Roo Code Local Server Connection

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "npx",
      "args": ["-y", "lsbible-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Gemini CLI</b></summary>

See [Gemini CLI Configuration](https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html) for details.

1. Open the Gemini CLI settings file at `~/.gemini/settings.json`
2. Add the following to the `mcpServers` object:

#### Remote Server Connection

```json
{
  "mcpServers": {
    "lsbible": {
      "httpUrl": "https://lsbible.kdco.dev/mcp",
      "headers": {
        "Accept": "application/json, text/event-stream"
      }
    }
  }
}
```

#### Local Server Connection

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "npx",
      "args": ["-y", "lsbible-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Qwen Coder</b></summary>

See [Qwen Coder MCP Configuration](https://qwenlm.github.io/qwen-code-docs/en/tools/mcp-server/#how-to-set-up-your-mcp-server) for details.

1. Open the Qwen Coder settings file at `~/.qwen/settings.json`
2. Add the following to the `mcpServers` object:

#### Remote Server Connection

```json
{
  "mcpServers": {
    "lsbible": {
      "httpUrl": "https://lsbible.kdco.dev/mcp",
      "headers": {
        "Accept": "application/json, text/event-stream"
      }
    }
  }
}
```

#### Local Server Connection

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "npx",
      "args": ["-y", "lsbible-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Claude Desktop</b></summary>

#### Remote Server Connection

Open Claude Desktop and navigate to Settings > Connectors > Add Custom Connector. Enter the name as `lsbible` and the remote MCP server URL as `https://lsbible.kdco.dev/mcp`.

#### Local Server Connection

Open Claude Desktop developer settings and edit your `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "npx",
      "args": ["-y", "lsbible-mcp"]
    }
  }
}
```

See [Claude Desktop MCP docs](https://modelcontextprotocol.io/quickstart/user) for more info.

</details>

<details>
<summary><b>Install in Opencode</b></summary>

Add this to your Opencode configuration file. See [Opencode MCP docs](https://opencode.ai/docs/mcp-servers) for more info.

#### Opencode Remote Server Connection

```json
"mcp": {
  "lsbible": {
    "type": "remote",
    "url": "https://lsbible.kdco.dev/mcp",
    "enabled": true
  }
}
```

#### Opencode Local Server Connection

```json
{
  "mcp": {
    "lsbible": {
      "type": "local",
      "command": ["npx", "-y", "lsbible-mcp"],
      "enabled": true
    }
  }
}
```

</details>

<details>
<summary><b>Install in OpenAI Codex</b></summary>

See [OpenAI Codex](https://github.com/openai/codex) for more information.

Add the following configuration to your OpenAI Codex MCP server settings:

#### Local Server Connection

```toml
[mcp_servers.lsbible]
args = ["-y", "lsbible-mcp"]
command = "npx"
startup_timeout_ms = 20_000
```

#### Remote Server Connection

```toml
[mcp_servers.lsbible]
url = "https://lsbible.kdco.dev/mcp"
```

</details>

<details>
<summary><b>Install in JetBrains AI Assistant</b></summary>

See [JetBrains AI Assistant Documentation](https://www.jetbrains.com/help/ai-assistant/configure-an-mcp-server.html) for more details.

1. In JetBrains IDEs, go to `Settings` -> `Tools` -> `AI Assistant` -> `Model Context Protocol (MCP)`
2. Click `+ Add`.
3. Click on `Command` and select `As JSON`
4. Add this configuration:

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "npx",
      "args": ["-y", "lsbible-mcp"]
    }
  }
}
```

5. Click `Apply` to save changes.

</details>

<details>
<summary><b>Install in Kiro</b></summary>

See [Kiro Model Context Protocol Documentation](https://kiro.dev/docs/mcp/configuration/) for details.

1. Navigate `Kiro` > `MCP Servers`
2. Add a new MCP server by clicking the `+ Add` button.
3. Paste the configuration:

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "npx",
      "args": ["-y", "lsbible-mcp"],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

4. Click `Save`.

</details>

<details>
<summary><b>Install in Trae</b></summary>

Use the Add manually feature and fill in the JSON configuration information.
For more details, visit the [Trae documentation](https://docs.trae.ai/ide/model-context-protocol?_lang=en).

#### Trae Remote Server Connection

```json
{
  "mcpServers": {
    "lsbible": {
      "url": "https://lsbible.kdco.dev/mcp"
    }
  }
}
```

#### Trae Local Server Connection

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "npx",
      "args": ["-y", "lsbible-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Using Bun or Deno</b></summary>

Use these alternatives to run the local LSBible MCP server with other runtimes.

#### Bun

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "bunx",
      "args": ["-y", "lsbible-mcp"]
    }
  }
}
```

#### Deno

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "deno",
      "args": [
        "run",
        "--allow-env",
        "--allow-net",
        "npm:lsbible-mcp"
      ]
    }
  }
}
```

</details>

<details>
<summary><b>Install in LM Studio</b></summary>

See [LM Studio MCP Support](https://lmstudio.ai/blog/lmstudio-v0.3.17) for more information.

#### Manual setup:

1. Navigate to `Program` (right side) > `Install` > `Edit mcp.json`.
2. Paste the configuration:

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "npx",
      "args": ["-y", "lsbible-mcp"]
    }
  }
}
```

3. Click `Save`.
4. Toggle the MCP server on/off from the right hand side under `Program`.

</details>

<details>
<summary><b>Install in Visual Studio 2022</b></summary>

Add this to your Visual Studio MCP config file (see [Visual Studio docs](https://learn.microsoft.com/visualstudio/ide/mcp-servers?view=vs-2022)):

#### Remote Server Connection

```json
{
  "inputs": [],
  "servers": {
    "lsbible": {
      "type": "http",
      "url": "https://lsbible.kdco.dev/mcp"
    }
  }
}
```

#### Local Server Connection

```json
{
  "mcp": {
    "servers": {
      "lsbible": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "lsbible-mcp"]
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in Crush</b></summary>

Add this to your Crush configuration file. See [Crush MCP docs](https://github.com/charmbracelet/crush#mcps) for more info.

#### Crush Remote Server Connection

```json
{
  "$schema": "https://charm.land/crush.json",
  "mcp": {
    "lsbible": {
      "type": "http",
      "url": "https://lsbible.kdco.dev/mcp"
    }
  }
}
```

#### Crush Local Server Connection

```json
{
  "$schema": "https://charm.land/crush.json",
  "mcp": {
    "lsbible": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "lsbible-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in BoltAI</b></summary>

Open the "Settings" page, navigate to "Plugins," and enter the following JSON:

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "npx",
      "args": ["-y", "lsbible-mcp"]
    }
  }
}
```

For BoltAI on iOS, [see this guide](https://docs.boltai.com/docs/boltai-mobile/mcp-servers).

</details>

<details>
<summary><b>Install in Rovo Dev CLI</b></summary>

Edit your Rovo Dev CLI MCP config:

```bash
acli rovodev mcp
```

#### Remote Server Connection

```json
{
  "mcpServers": {
    "lsbible": {
      "url": "https://lsbible.kdco.dev/mcp"
    }
  }
}
```

#### Local Server Connection

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "npx",
      "args": ["-y", "lsbible-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Zencoder</b></summary>

1. Go to the Zencoder menu (...)
2. Select Agent tools
3. Click Add custom MCP
4. Add the configuration:

```json
{
  "command": "npx",
  "args": ["-y", "lsbible-mcp"]
}
```

5. Hit the Install button

</details>

<details>
<summary><b>Install in Qodo Gen</b></summary>

See [Qodo Gen docs](https://docs.qodo.ai/qodo-documentation/qodo-gen/qodo-gen-chat/agentic-mode/agentic-tools-mcps) for more details.

1. Open Qodo Gen chat panel
2. Click Connect more tools
3. Click + Add new MCP
4. Add the configuration:

#### Local Server Connection

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "npx",
      "args": ["-y", "lsbible-mcp"]
    }
  }
}
```

#### Remote Server Connection

```json
{
  "mcpServers": {
    "lsbible": {
      "url": "https://lsbible.kdco.dev/mcp"
    }
  }
}
```

</details>

<details>
<summary><b>Install in Perplexity Desktop</b></summary>

See [Local and Remote MCPs for Perplexity](https://www.perplexity.ai/help-center/en/articles/11502712-local-and-remote-mcps-for-perplexity).

1. Navigate `Perplexity` > `Settings`
2. Select `Connectors`
3. Click `Add Connector`
4. Select `Advanced`
5. Enter Server Name: `lsbible`
6. Paste the JSON:

```json
{
  "args": ["-y", "lsbible-mcp"],
  "command": "npx",
  "env": {}
}
```

7. Click `Save`

</details>

<details>
<summary><b>Install in Warp</b></summary>

See [Warp MCP Documentation](https://docs.warp.dev/knowledge-and-collaboration/mcp#adding-an-mcp-server).

1. Navigate `Settings` > `AI` > `Manage MCP servers`
2. Add a new MCP server
3. Paste the configuration:

```json
{
  "lsbible": {
    "command": "npx",
    "args": ["-y", "lsbible-mcp"],
    "env": {},
    "working_directory": null,
    "start_on_launch": true
  }
}
```

4. Click `Save`

</details>

<details>
<summary><b>Install in Copilot Coding Agent</b></summary>

Add to your Copilot Coding Agent configuration (Repository→Settings→Copilot→Coding agent→MCP configuration):

```json
{
  "mcpServers": {
    "lsbible": {
      "type": "http",
      "url": "https://lsbible.kdco.dev/mcp",
      "tools": ["get-verse", "get-passage", "get-chapter", "search-verses"]
    }
  }
}
```

See [GitHub Copilot documentation](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/agents/copilot-coding-agent/extending-copilot-coding-agent-with-mcp).

</details>

<details>
<summary><b>Install in Amazon Q Developer CLI</b></summary>

Add this to your Amazon Q Developer CLI configuration file. See [Amazon Q Developer CLI docs](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/command-line-mcp-configuration.html).

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "npx",
      "args": ["-y", "lsbible-mcp"]
    }
  }
}
```

</details>

## 🔨 Available Tools

LSBible MCP provides the following tools that LLMs can use:

- `get-verse`: Get a specific Bible verse
  - `book` (required): Book name (e.g., "John", "Genesis")
  - `chapter` (required): Chapter number
  - `verse` (required): Verse number

- `get-passage`: Get a passage range spanning multiple verses
  - `fromBook` (required): Starting book name
  - `fromChapter` (required): Starting chapter number
  - `fromVerse` (required): Starting verse number
  - `toBook` (required): Ending book name
  - `toChapter` (required): Ending chapter number
  - `toVerse` (required): Ending verse number

- `get-chapter`: Get an entire chapter
  - `book` (required): Book name
  - `chapter` (required): Chapter number

- `search-verses`: Search for verses containing text
  - `query` (required): Search query

## 📚 Available Resources

LSBible MCP provides the following resources:

- `book://[book-name]`: Get information about a specific Bible book
  - Example: `book://john`, `book://genesis`
  - Returns: Book name, testament, chapter count, total verses

- `books://testament/[ot|nt]`: List all books in Old or New Testament
  - Example: `books://testament/ot`, `books://testament/nt`
  - Returns: List of books with metadata

## 💻 Development

### Local Development

```bash
# Clone the repository
git clone https://github.com/kdcokenny/lsbible.git
cd lsbible/packages/typescript-sdk

# Install dependencies
bun install

# Build the project
bun run build

# Run the MCP server locally
bun run dist/mcp/stdio.js
```

### Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector npx lsbible-mcp
```

## 🚨 Troubleshooting

<details>
<summary><b>Module Not Found Errors</b></summary>

If you encounter `ERR_MODULE_NOT_FOUND`, try using `bunx` instead of `npx`:

```json
{
  "mcpServers": {
    "lsbible": {
      "command": "bunx",
      "args": ["-y", "lsbible-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>General MCP Client Errors</b></summary>

1. Try adding `@latest` to the package name
2. Use `bunx` as an alternative to `npx`
3. Consider using the remote server at `https://lsbible.kdco.dev/mcp`
4. Ensure you're using Node.js v18 or higher

</details>

## 🤝 Contributing

We welcome contributions! See the main [Contributing Guidelines](../../../CONTRIBUTING.md) for details.

## 📄 License

MIT License - See [LICENSE](../../../LICENSE) file for details.

---

<div align="center">

**[Back to TypeScript SDK →](../README.md)** | **[Back to Monorepo Root →](../../../README.md)**

Made with ❤️ for Bible software developers

</div>
