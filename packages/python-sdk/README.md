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
    match_count=0,
    passages=[...],
    duration_ms=5,
    timestamp=1234567890
)

print(response.passage_count)  # Number of passages
print(response.total_verses)   # Total verses across all passages
```

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
