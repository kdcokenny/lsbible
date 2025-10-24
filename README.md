# LSBible SDK Monorepo

Multi-language SDK for the LSBible API at [read.lsbible.org](https://read.lsbible.org).

## Overview

The LSBible SDK provides structured, type-safe client libraries for interacting with the LSBible API. Instead of parsing strings like `"John 3:16"`, the SDK uses explicit parameters with full validation.

### Design Philosophy

**Structured Parameters Over String Parsing:**

```python
# ✅ GOOD - Type-safe with IDE autocomplete
client.get_verse(BookName.JOHN, 3, 16)

# ❌ AVOID - String parsing (not supported)
client.get_verse("John 3:16")
```

**Benefits:**
- Full IDE autocomplete for all 66 books
- Early validation before API calls
- No parsing ambiguity
- Better testing and type safety
- Language-agnostic design

## Available SDKs

### Python SDK

✅ **Available** - Full implementation with Pydantic validation

```bash
uv add lsbible
```

[View Python SDK Documentation →](./packages/python-sdk/README.md)

### Future SDKs

- 🚧 TypeScript SDK
- 🚧 Rust SDK
- 🚧 Go SDK

## Quick Start

### Python

```python
from lsbible import LSBibleClient, BookName

with LSBibleClient() as client:
    # Get a verse
    passage = client.get_verse(BookName.JOHN, 3, 16)

    # Access structured data
    for verse in passage.verses:
        print(f"{verse.reference}: {verse.plain_text}")

    # Search for text
    results = client.search("love")
```

## Repository Structure

```
lsbible/
├── turbo.json                 # Turborepo configuration
├── package.json               # Root package.json with workspaces
├── README.md                  # This file
├── CONTRIBUTING.md            # Contribution guidelines
│
└── packages/
    ├── python-sdk/            # Python SDK (available)
    ├── typescript-sdk/        # Future: TypeScript SDK
    ├── rust-sdk/              # Future: Rust SDK
    └── go-sdk/                # Future: Go SDK
```

## Features

- **100% Programmatic** - All data is structured, typed, and validated
- **Strict Type Safety** - Full validation of Bible references
- **Multi-Language Support** - Easy contribution of SDKs in any language
- **Developer Friendly** - Intuitive APIs with excellent type hints

## Development

This monorepo uses [Turborepo](https://turbo.build) for build orchestration and [Bun](https://bun.sh) as the package manager.

### Setup

```bash
# Clone repository
git clone https://github.com/kdcokenny/lsbible.git
cd lsbible

# Install dependencies
bun install

# Setup Python SDK
cd packages/python-sdk
uv sync
```

### Commands

```bash
# Build all packages
bun run build

# Run all tests
bun run test

# Run linters
bun run lint

# Run type checking
bun run type-check

# Run specific package
bun run --filter python-sdk test
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:

- Adding new language SDKs
- Reporting bugs
- Submitting features
- Code style and standards

## API Documentation

The LSBible API provides access to Bible passages with rich formatting:

- **Base URL:** `https://read.lsbible.org`
- **Endpoint:** `/_next/data/{buildId}/index.json`
- **Query Parameter:** `q` (verse reference or search text)

All SDKs handle build ID management automatically.

## License

MIT License - See [LICENSE](./LICENSE) file for details.

## Links

- [Python SDK Documentation](./packages/python-sdk/README.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [LSBible Website](https://read.lsbible.org)
- [Issue Tracker](https://github.com/kdcokenny/lsbible/issues)
