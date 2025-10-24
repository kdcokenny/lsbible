# LSBible Python SDK

A structured, type-safe Python client for the LSBible API at [read.lsbible.org](https://read.lsbible.org).

> **Disclaimer:** This is an unofficial, third-party SDK and is not affiliated with, endorsed by, or connected to LSBible or its creators. This project is an independent client library for educational and development purposes.

## Features

- **100% Type-Safe** - Full Pydantic validation with type hints
- **Structured Parameters** - No string parsing, explicit book/chapter/verse
- **IDE Autocomplete** - Enum-based book names with all 66 books
- **Strict Validation** - Early error detection before API calls
- **Response Caching** - Built-in TTL-based caching
- **Rich Formatting** - Extract red-letter text, italics, and more

## Installation

```bash
# Using uv (recommended)
uv add lsbible

# Using pip
pip install lsbible
```

## Quick Start

```python
from lsbible import LSBibleClient, BookName

# Initialize client
with LSBibleClient() as client:
    # Get a single verse
    passage = client.get_verse(BookName.JOHN, 3, 16)

    # Access structured data
    for verse in passage.verses:
        print(f"{verse.reference}: {verse.plain_text}")

    # Get a passage range
    passage = client.get_passage(
        BookName.JOHN, 3, 16,
        BookName.JOHN, 3, 18
    )

    # Get an entire chapter
    chapter = client.get_chapter(BookName.JOHN, 3)

    # Search for text
    results = client.search("love")
    print(f"Found {results.passage_count} passages")
```

## Design Philosophy

This SDK uses **structured parameters** instead of string parsing:

```python
# ✅ GOOD - Type-safe with validation
client.get_verse(BookName.JOHN, 3, 16)

# ❌ NOT SUPPORTED - String parsing
client.get_verse("John 3:16")  # Not supported
```

**Why?**
- Full IDE autocomplete for all 66 books
- Catch errors before API calls
- No parsing ambiguity
- Better testing and type safety

## Usage Examples

### Using Book Enums (Recommended)

```python
from lsbible import LSBibleClient, BookName

with LSBibleClient() as client:
    # Type-safe with IDE autocomplete
    passage = client.get_verse(BookName.JOHN, 3, 16)
```

### Using Strings

```python
with LSBibleClient() as client:
    # Also supported, validated at runtime
    passage = client.get_verse("John", 3, 16)
```

### Accessing Verse Content

```python
passage = client.get_verse(BookName.JOHN, 3, 16)

for verse in passage.verses:
    # Reference information
    ref = verse.reference
    print(f"{ref.book_name.value} {ref.chapter}:{ref.verse}")

    # Plain text
    print(verse.plain_text)

    # Formatted text with markers
    print(verse.formatted_text)

    # Access individual segments with formatting
    for segment in verse.segments:
        if segment.is_red_letter:
            print(f'Jesus said: "{segment.text}"')
        elif segment.is_italic:
            print(f'Clarification: [{segment.text}]')
```

### Error Handling

```python
from lsbible import LSBibleClient, BookName, InvalidReferenceError

with LSBibleClient() as client:
    try:
        # Invalid chapter (John only has 21 chapters)
        passage = client.get_verse(BookName.JOHN, 99, 1)
    except InvalidReferenceError as e:
        print(f"Error: {e}")
        # Output: "John only has 21 chapters, but chapter 99 was requested"
```

## API Reference

### LSBibleClient

#### `__init__(cache_ttl: int = 3600, timeout: int = 30, build_id: Optional[str] = None)`

Initialize the client.

- `cache_ttl`: Cache time-to-live in seconds (default: 3600)
- `timeout`: Request timeout in seconds (default: 30)
- `build_id`: Optional Next.js build ID (auto-detected if not provided)

#### `search(query: str) -> SearchResponse`

Search for passages containing text.

#### `get_verse(book: Union[BookName, str], chapter: int, verse: int) -> Passage`

Get a specific verse with validated parameters.

#### `get_passage(from_book, from_chapter, from_verse, to_book, to_chapter, to_verse) -> Passage`

Get a passage spanning multiple verses.

#### `get_chapter(book: Union[BookName, str], chapter: int) -> Passage`

Get an entire chapter.

#### `clear_cache() -> None`

Clear the response cache.

## MCP Server

LSBible includes a Model Context Protocol (MCP) server for integration with LLM applications like Claude Code and Claude Desktop. The MCP server exposes the SDK's functionality as tools, resources, and prompts.

### Installation

Install with MCP server support:

```bash
# Using uv (recommended)
uv pip install lsbible[server]

# Using pip
pip install lsbible[server]

# Or install as a tool for Claude Desktop
uv tool install lsbible[server]
```

### Running the Server

```bash
# Direct command (if installed)
lsbible-mcp

# Or using uv run (development)
uv run --project /path/to/python-sdk lsbible-mcp

# Or via uvx (temporary run without installation)
uvx --from lsbible[server] lsbible-mcp
```

### Claude Desktop Configuration

Add to your Claude Desktop config file:

**Option 1: Using uvx (recommended for installed package)**
```json
{
  "mcpServers": {
    "lsbible": {
      "command": "uvx",
      "args": [
        "--from",
        "lsbible[server]",
        "lsbible-mcp"
      ]
    }
  }
}
```

**Option 2: Local development**
```json
{
  "mcpServers": {
    "lsbible-dev": {
      "command": "uv",
      "args": [
        "run",
        "--project",
        "/Users/kenny/workspace/kdcokenny/lsbible/packages/python-sdk",
        "lsbible-mcp"
      ]
    }
  }
}
```

### Available MCP Features

**Tools:**
- `get_verse` - Fetch a single Bible verse with formatting
- `get_passage` - Fetch a passage (multiple verses) with formatting
- `get_chapter` - Fetch an entire chapter
- `search_bible` - Search for verses containing text with distribution metadata
  - Returns match count and verse results
  - For text searches, includes distribution across Bible sections and books
  - Supports limiting results (default: 10)

**Resources:**
- `bible://books` - List all 66 books with metadata
- `bible://structure/{book}` - Get chapter/verse structure for a book

**Prompts:**
- `bible_study` - Generate Bible study prompts for passages
- `cross_reference` - Generate cross-reference analysis prompts

### Example Usage in Claude

Once configured, you can use natural language in Claude:

```
"Get John 3:16"
"Search for verses about love"
"Show me the structure of the book of Psalms"
"Help me study Romans 8:28-39"
```

Claude will automatically use the appropriate MCP tools to fetch and display Bible content.

### Search Distribution Metadata

When using `search_bible` for text queries (not Bible references), the tool returns rich distribution metadata showing how matches are spread across the Bible:

**Example response:**
```json
{
  "query": "love",
  "results": [
    {
      "reference": "Genesis 22:2",
      "text": "Then He said, \"Take now your son, your only one, whom you love...\""
    }
  ],
  "result_count": 10,
  "total_matches": 436,
  "distribution": {
    "by_section": {
      "Pentateuch": 41,
      "History": 35,
      "Wisdom and Poetry": 95,
      "Major Prophets": 20,
      "Minor Prophets": 19,
      "Gospels and Acts": 65,
      "Pauline Epistles": 101,
      "General Epistles": 60
    },
    "by_book": {
      "Genesis": 12,
      "Exodus": 5,
      "John": 18,
      "1 Corinthians": 15,
      ...
    },
    "total_count": 436,
    "filtered_count": 436
  }
}
```

This metadata helps understand:
- Which parts of the Bible most frequently discuss a topic
- Testament distribution (Old vs New Testament)
- Concentration in specific books or sections

## Models

### BookName

Enum with all 66 Bible books:

```python
BookName.GENESIS
BookName.JOHN
BookName.REVELATION
# ... and 63 more
```

### VerseReference

Immutable reference to a specific verse:

```python
ref = VerseReference(book_number=43, chapter=3, verse=16)
print(ref.book_name)  # BookName.JOHN
print(str(ref))       # "John 3:16"
```

### TextSegment

Text with formatting metadata:

```python
segment = TextSegment(
    text="For God so loved the world",
    is_red_letter=True,
    is_italic=False,
    is_bold=False,
    is_small_caps=False
)
```

### VerseContent

Complete structured content of a verse:

```python
verse = VerseContent(
    reference=ref,
    verse_number=16,
    segments=[...],
    has_subheading=False,
    is_poetry=False,
    is_prose=True,
    chapter_start=False
)
```

### Passage

A passage containing one or more verses:

```python
passage = Passage(
    from_ref=from_ref,
    to_ref=to_ref,
    title="John 3:16",
    verses=[...]
)

print(passage.is_single_verse)  # True
print(passage.verse_count)      # 1
```

### SearchResponse

Response from a search or verse lookup:

```python
response = SearchResponse(
    query="love",
    match_count=436,
    passages=[...],
    duration_ms=5,
    timestamp=1234567890,
    # Optional metadata for text searches
    total_count=436,
    filtered_count=436,
    counts_by_book={1: 12, 43: 18, ...},
    counts_by_section={1: 41, 6: 65, 7: 101, ...}
)

print(response.passage_count)     # Number of passages
print(response.total_verses)      # Total verses across all passages
print(response.has_search_metadata)  # True if includes distribution data

# Access distribution metadata (text searches only)
if response.has_search_metadata:
    print(response.counts_by_section)  # Distribution across Bible sections
    print(response.counts_by_book)     # Distribution across individual books
```

**Bible Sections:**
1. Pentateuch (Genesis - Deuteronomy)
2. History (Joshua - Esther)
3. Wisdom and Poetry (Job - Song of Songs)
4. Major Prophets (Isaiah - Daniel)
5. Minor Prophets (Hosea - Malachi)
6. Gospels and Acts (Matthew - Acts)
7. Pauline Epistles (Romans - Philemon)
8. General Epistles (Hebrews - Jude, Revelation)

## Development

```bash
# Clone the repository
git clone https://github.com/kdcokenny/lsbible.git
cd lsbible/packages/python-sdk

# Install dependencies
uv sync

# Run tests
uv run pytest

# Run type checking
uv run ty check lsbible

# Run linting
uv run ruff check lsbible

# Format code
uv run ruff format lsbible
```

## License

MIT License - See LICENSE file for details.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.
