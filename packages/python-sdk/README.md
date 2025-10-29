# LSBible Python SDK

[![PyPI version](https://img.shields.io/pypi/v/lsbible.svg)](https://pypi.org/project/lsbible/)
[![Python Version](https://img.shields.io/badge/python-3.12%2B-blue)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code style: ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)

A structured, type-safe Python client for the LSBible API at [read.lsbible.org](https://read.lsbible.org).

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
- [Features at a Glance](#features-at-a-glance)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [SDK Usage Guide](#sdk-usage-guide)
  - [Core Concepts](#core-concepts)
  - [Basic Examples](#basic-examples)
  - [Advanced Features](#advanced-features)
  - [Search Distribution Metadata](#search-distribution-metadata)
  - [Error Handling](#error-handling)
- [API Reference](#api-reference)
  - [LSBibleClient](#lsbibleclient)
  - [Models](#models)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Features at a Glance

✨ **What makes this SDK special:**

- ✅ **100% Type-Safe** - Full Pydantic validation with type hints throughout
- ✅ **Structured Parameters** - No string parsing, explicit book/chapter/verse parameters
- ✅ **IDE Autocomplete** - Enum-based book names with all 66 books
- ✅ **Strict Validation** - Early error detection before API calls
- ✅ **Response Caching** - Built-in TTL-based caching for better performance
- ✅ **Rich Formatting** - Extract red-letter text, italics, small-caps, and more
- ✅ **Search Analytics** - Distribution metadata across Bible sections and books
- ✅ **Immutable Models** - All data structures are frozen for safety
- ✅ **Comprehensive Tests** - >80% code coverage with thorough test suite

## Installation

Install the LSBible Python SDK using your preferred package manager:

```bash
# Using uv (recommended)
uv pip install lsbible

# Using pip
pip install lsbible
```

## Quick Start

```python
from lsbible import LSBibleClient, BookName

# Initialize client (use context manager for automatic cleanup)
with LSBibleClient() as client:
    # Get a single verse
    passage = client.get_verse(BookName.JOHN, 3, 16)
    print(f"Reference: {passage.title}")
    print(f"Text: {passage.verses[0].plain_text}")

    # Get a passage range
    passage = client.get_passage(
        BookName.JOHN, 3, 16,
        BookName.JOHN, 3, 18
    )
    print(f"Got {passage.verse_count} verses")

    # Get an entire chapter
    chapter = client.get_chapter(BookName.JOHN, 3)
    print(f"John 3 has {chapter.verse_count} verses")

    # Search for text
    results = client.search("love")
    print(f"Found {results.match_count} passages")
```

## SDK Usage Guide

### Core Concepts

#### Design Philosophy: Structured Parameters Over String Parsing

This SDK uses **explicit, validated parameters** instead of parsing strings:

```python
from lsbible import LSBibleClient, BookName

client = LSBibleClient()

# ✅ GOOD - Type-safe with validation
passage = client.get_verse(BookName.JOHN, 3, 16)

# ✅ ALSO GOOD - String validated at runtime
passage = client.get_verse("John", 3, 16)

# ❌ NOT SUPPORTED - String parsing
passage = client.get_verse("John 3:16")  # This won't work
```

**Why this approach?**

1. **Full IDE autocomplete** - Type `BookName.` and see all 66 books
2. **Catch errors early** - Invalid references caught before API calls
3. **No parsing ambiguity** - Clear distinction between book, chapter, verse
4. **Better testing** - Easy to generate test cases programmatically
5. **Type safety** - Python type checkers can verify your code

#### Using Book Names

You have two options for specifying books:

**Option 1: BookName Enum (Recommended)**

```python
from lsbible import BookName

# Full IDE autocomplete support
BookName.JOHN
BookName.GENESIS
BookName.REVELATION
BookName.SAMUEL_1  # For numbered books
BookName.CORINTHIANS_2
```

**Option 2: Strings (Also Valid)**

```python
# Simple string (case-insensitive, normalized)
client.get_verse("John", 3, 16)
client.get_verse("john", 3, 16)  # Also works
client.get_verse("1 John", 1, 1)  # Numbered books
```

### Basic Examples

#### Fetching a Single Verse

```python
from lsbible import LSBibleClient, BookName

with LSBibleClient() as client:
    passage = client.get_verse(BookName.JOHN, 3, 16)

    # Access basic info
    verse = passage.verses[0]
    print(f"Reference: {verse.reference}")  # "John 3:16"
    print(f"Plain text: {verse.plain_text}")

    # Check if it's a single verse
    print(f"Single verse: {passage.is_single_verse}")  # True
```

#### Fetching a Passage Range

```python
# Same book, same chapter
passage = client.get_passage(
    BookName.JOHN, 3, 16,   # From: John 3:16
    BookName.JOHN, 3, 18    # To: John 3:18
)

# Same book, different chapters
passage = client.get_passage(
    BookName.JOHN, 1, 1,    # From: John 1:1
    BookName.JOHN, 2, 11    # To: John 2:11
)

# Different books
passage = client.get_passage(
    BookName.JUDE, 1, 24,   # From: Jude 1:24
    BookName.JUDE, 1, 25    # To: Jude 1:25
)

print(f"Got {passage.verse_count} verses")
```

#### Fetching an Entire Chapter

```python
# Get all verses in John chapter 3
chapter = client.get_chapter(BookName.JOHN, 3)

print(f"Chapter title: {chapter.title}")
print(f"Total verses: {chapter.verse_count}")

for verse in chapter.verses:
    print(f"Verse {verse.verse_number}: {verse.plain_text}")
```

#### Searching for Text

```python
# Search for verses containing "love"
results = client.search("love")

print(f"Query: {results.query}")
print(f"Total matches: {results.match_count}")
print(f"Passages returned: {results.passage_count}")

# Display results
for passage in results.passages:
    print(f"\n{passage.title}")
    for verse in passage.verses:
        print(f"  {verse.plain_text}")
```

### Advanced Features

#### Accessing Rich Formatting

The SDK preserves all formatting from the LSB translation:

```python
passage = client.get_verse(BookName.JOHN, 3, 16)
verse = passage.verses[0]

# Iterate through text segments with formatting metadata
for segment in verse.segments:
    # Check formatting flags
    if segment.is_red_letter:
        print(f'🔴 Jesus said: "{segment.text}"')
    elif segment.is_italic:
        print(f'📝 Clarification: [{segment.text}]')
    elif segment.is_small_caps:
        print(f'✨ LORD (YHWH): {segment.text}')
    elif segment.is_bold:
        print(f'📌 Emphasis: {segment.text}')
    else:
        print(f'   Regular: {segment.text}')

# Or use the formatted_text property for simple formatting
print(verse.formatted_text)
# Output: "For God so loved the world, that He gave..."
```

**Formatting Metadata:**

- **`is_red_letter`**: Words of Jesus Christ (traditionally printed in red)
- **`is_italic`**: Clarifying words added by translators
- **`is_small_caps`**: "LORD" representing YHWH (Yahweh)
- **`is_bold`**: Emphasis in the original text
- **Poetry/prose detection**: `verse.is_poetry` or `verse.is_prose`
- **Subheadings**: `verse.has_subheading` and `verse.subheading_text`

#### Working with Verse Metadata

```python
passage = client.get_verse(BookName.PSALMS, 23, 1)
verse = passage.verses[0]

# Check structural features
if verse.has_subheading:
    print(f"Subheading: {verse.subheading_text}")

if verse.is_poetry:
    print("This is poetic text")

if verse.chapter_start:
    print("This is the first verse of a chapter")

# Access reference details
ref = verse.reference
print(f"Book: {ref.book_name.value}")  # "Psalms"
print(f"Chapter: {ref.chapter}")        # 23
print(f"Verse: {ref.verse}")            # 1
print(f"Book number: {ref.book_number}") # 19 (Psalms is the 19th book)
```

#### Configuring the Client

```python
# Customize cache TTL and timeout
client = LSBibleClient(
    cache_ttl=7200,    # Cache responses for 2 hours (default: 3600)
    timeout=60,        # Request timeout in seconds (default: 30)
    build_id="custom"  # Optional: provide build ID (default: auto-detect)
)

# Clear cache manually
client.clear_cache()

# Use custom headers (e.g., for tracking)
custom_headers = {
    "X-App-Name": "My Bible App",
    "X-App-Version": "1.0.0"
}
client = LSBibleClient(headers=custom_headers)
```

### Search Distribution Metadata

When you search for **text** (not a Bible reference), the API returns rich metadata showing how matches are distributed across Scripture.

#### Understanding Search Responses

```python
results = client.search("love")

# Basic info available for ALL searches
print(f"Query: {results.query}")
print(f"Total matches: {results.match_count}")
print(f"Passages returned: {results.passage_count}")

# Distribution metadata (only for TEXT searches)
if results.has_search_metadata:
    print("\n📊 Distribution Metadata Available!")
    print(f"Total count: {results.total_count}")
    print(f"Filtered count: {results.filtered_count}")
else:
    print("No distribution metadata (Bible reference lookup)")
```

#### Distribution by Bible Section

The Bible is divided into 8 major sections. Search metadata shows match counts for each:

```python
results = client.search("love")

if results.has_search_metadata:
    from lsbible.books import SECTION_NAMES

    print("\n📚 Distribution by Section:")
    for section_id, count in results.counts_by_section.items():
        section_name = SECTION_NAMES[section_id]
        print(f"  {section_name}: {count} matches")
```

**The 8 Bible Sections:**

1. **Pentateuch** (Genesis - Deuteronomy)
2. **History** (Joshua - Esther)
3. **Wisdom and Poetry** (Job - Song of Songs)
4. **Major Prophets** (Isaiah - Daniel)
5. **Minor Prophets** (Hosea - Malachi)
6. **Gospels and Acts** (Matthew - Acts)
7. **Pauline Epistles** (Romans - Philemon)
8. **General Epistles** (Hebrews - Revelation)

#### Distribution by Individual Books

See which specific books contain the most matches:

```python
results = client.search("faith")

if results.has_search_metadata:
    from lsbible.books import BIBLE_STRUCTURE

    print("\n📖 Top 10 Books by Match Count:")

    # Sort books by match count (descending)
    sorted_books = sorted(
        results.counts_by_book.items(),
        key=lambda x: x[1],
        reverse=True
    )

    for book_num, count in sorted_books[:10]:
        book_name = BIBLE_STRUCTURE[book_num]["name"]
        print(f"  {book_name}: {count} matches")
```

#### Example: Complete Search Analysis

```python
from lsbible import LSBibleClient
from lsbible.books import SECTION_NAMES, BIBLE_STRUCTURE

with LSBibleClient() as client:
    results = client.search("salvation")

    print(f"🔍 Search Query: '{results.query}'")
    print(f"✅ Total Matches: {results.match_count}")
    print(f"📄 Passages Returned: {results.passage_count}")

    if results.has_search_metadata:
        print(f"\n📊 DISTRIBUTION ANALYTICS")
        print(f"   Total: {results.total_count}")
        print(f"   Filtered: {results.filtered_count}")

        # Section distribution
        print(f"\n📚 By Section:")
        for section_id, count in sorted(results.counts_by_section.items()):
            section_name = SECTION_NAMES[section_id]
            percentage = (count / results.total_count) * 100
            print(f"   {section_name:25} {count:4} ({percentage:5.1f}%)")

        # Top books
        print(f"\n📖 Top 5 Books:")
        sorted_books = sorted(
            results.counts_by_book.items(),
            key=lambda x: x[1],
            reverse=True
        )
        for book_num, count in sorted_books[:5]:
            book_name = BIBLE_STRUCTURE[book_num]["name"]
            print(f"   {book_name:25} {count:4} matches")

    # Display sample verses
    print(f"\n📝 Sample Verses:")
    for passage in results.passages[:3]:  # First 3 passages
        for verse in passage.verses:
            print(f"   {verse.reference}: {verse.plain_text[:100]}...")
```

#### When Distribution Metadata is Available

- ✅ **Text searches**: `client.search("love")` → Has metadata
- ❌ **Bible references**: `client.search("John 3:16")` → No metadata (use `get_verse` instead)

### Error Handling

The SDK provides specific exceptions for different error cases:

```python
from lsbible import (
    LSBibleClient,
    BookName,
    InvalidReferenceError,
    APIError,
    BuildIDError
)

with LSBibleClient() as client:
    try:
        # Invalid chapter (John only has 21 chapters)
        passage = client.get_verse(BookName.JOHN, 99, 1)
    except InvalidReferenceError as e:
        print(f"❌ Invalid reference: {e}")
        # Output: "John only has 21 chapters, but chapter 99 was requested"

    try:
        # Invalid verse (John 3 only has 36 verses)
        passage = client.get_verse(BookName.JOHN, 3, 999)
    except InvalidReferenceError as e:
        print(f"❌ Invalid reference: {e}")
        # Output: "John 3 only has 36 verses, but verse 999 was requested"

    try:
        # Invalid book name
        passage = client.get_verse("NotABook", 1, 1)
    except InvalidReferenceError as e:
        print(f"❌ Invalid reference: {e}")
        # Output: "Unknown book: NotABook"

    try:
        # API error (network issues, etc.)
        passage = client.get_verse(BookName.JOHN, 3, 16)
    except APIError as e:
        print(f"❌ API error: {e}")

    try:
        # Build ID detection failure
        passage = client.get_verse(BookName.JOHN, 3, 16)
    except BuildIDError as e:
        print(f"❌ Build ID error: {e}")
```

**Exception Hierarchy:**

- `LSBibleError` (base exception)
  - `InvalidReferenceError` - Invalid book/chapter/verse
  - `APIError` - API request failures
  - `BuildIDError` - Build ID detection failures

## API Reference

### LSBibleClient

Main client class for interacting with the LSBible API.

#### `__init__(cache_ttl=3600, timeout=30, build_id=None, headers=None)`

Initialize the client.

**Parameters:**
- `cache_ttl` (int): Cache time-to-live in seconds (default: 3600)
- `timeout` (int): Request timeout in seconds (default: 30)
- `build_id` (str, optional): Next.js build ID (auto-detected if not provided)
- `headers` (dict, optional): Custom HTTP headers

**Example:**
```python
client = LSBibleClient(cache_ttl=7200, timeout=60)
```

#### `search(query: str) -> SearchResponse`

Search for passages containing text.

**Parameters:**
- `query` (str): Search text or Bible reference

**Returns:** `SearchResponse` with structured passage data

**Raises:**
- `APIError`: If API request fails

#### `get_verse(book, chapter, verse) -> Passage`

Get a specific verse with validated parameters.

**Parameters:**
- `book` (BookName | str): Book name (enum or string)
- `chapter` (int): Chapter number
- `verse` (int): Verse number

**Returns:** `Passage` containing the verse

**Raises:**
- `InvalidReferenceError`: If reference is invalid
- `APIError`: If API request fails

#### `get_passage(from_book, from_chapter, from_verse, to_book, to_chapter, to_verse) -> Passage`

Get a passage spanning multiple verses.

**Parameters:**
- `from_book` (BookName | str): Starting book
- `from_chapter` (int): Starting chapter
- `from_verse` (int): Starting verse
- `to_book` (BookName | str): Ending book
- `to_chapter` (int): Ending chapter
- `to_verse` (int): Ending verse

**Returns:** `Passage` containing all verses in range

**Raises:**
- `InvalidReferenceError`: If any reference is invalid
- `APIError`: If API request fails

#### `get_chapter(book, chapter) -> Passage`

Get an entire chapter.

**Parameters:**
- `book` (BookName | str): Book name
- `chapter` (int): Chapter number

**Returns:** `Passage` containing all verses in the chapter

**Raises:**
- `InvalidReferenceError`: If reference is invalid
- `APIError`: If API request fails

#### `clear_cache() -> None`

Clear the response cache.

#### `close() -> None`

Close the HTTP client.

### Models

All models are immutable Pydantic models with full validation.

#### `BookName` (Enum)

Enumeration of all 66 Bible books:

```python
from lsbible import BookName

# Old Testament
BookName.GENESIS
BookName.EXODUS
# ... through ...
BookName.MALACHI

# New Testament
BookName.MATTHEW
BookName.MARK
# ... through ...
BookName.REVELATION

# Numbered books
BookName.SAMUEL_1      # "1 Samuel"
BookName.KINGS_2       # "2 Kings"
BookName.CORINTHIANS_1 # "1 Corinthians"
```

#### `VerseReference`

Immutable reference to a specific verse:

**Fields:**
- `book_number` (int): Book number (1-66)
- `chapter` (int): Chapter number
- `verse` (int): Verse number

**Properties:**
- `book_name` (BookName): The book name enum

**Example:**
```python
ref = VerseReference(book_number=43, chapter=3, verse=16)
print(ref.book_name)  # BookName.JOHN
print(str(ref))       # "John 3:16"
```

#### `TextSegment`

Text with formatting metadata:

**Fields:**
- `text` (str): The text content
- `is_red_letter` (bool): Jesus' words
- `is_italic` (bool): Clarifications
- `is_bold` (bool): Emphasis
- `is_small_caps` (bool): LORD (YHWH)

#### `VerseContent`

Complete structured content of a verse:

**Fields:**
- `reference` (VerseReference): Verse reference
- `verse_number` (int): Verse number
- `segments` (list[TextSegment]): Text segments with formatting
- `has_subheading` (bool): Whether verse has a subheading
- `subheading_text` (str | None): Subheading text
- `is_poetry` (bool): Poetic structure
- `is_prose` (bool): Prose structure
- `chapter_start` (bool): First verse of chapter

**Properties:**
- `plain_text` (str): Text without formatting
- `formatted_text` (str): Text with simple formatting markers

#### `Passage`

A passage containing one or more verses:

**Fields:**
- `from_ref` (VerseReference): Starting reference
- `to_ref` (VerseReference): Ending reference
- `title` (str): Passage title
- `verses` (list[VerseContent]): List of verses

**Properties:**
- `is_single_verse` (bool): Whether passage is a single verse
- `verse_count` (int): Number of verses

#### `SearchResponse`

Response from a search or verse lookup:

**Fields:**
- `query` (str): Original query
- `match_count` (int): Number of matches
- `passages` (list[Passage]): List of passages
- `duration_ms` (int): Query duration in milliseconds
- `timestamp` (int): Unix timestamp in milliseconds
- `total_count` (int | None): Total matches (text search only)
- `filtered_count` (int | None): Filtered matches (text search only)
- `counts_by_book` (dict | None): Match distribution by book
- `counts_by_section` (dict | None): Match distribution by section

**Properties:**
- `passage_count` (int): Number of passages returned
- `total_verses` (int): Total verses across all passages
- `has_search_metadata` (bool): Whether response includes distribution metadata

## Development

### Setup

```bash
# Clone repository
git clone https://github.com/kdcokenny/lsbible.git
cd lsbible/packages/python-sdk

# Install dependencies
uv sync
```

### Commands

```bash
# Run tests with coverage
uv run pytest

# Run specific test file
uv run pytest tests/test_client.py

# Run single test
uv run pytest tests/test_client.py::test_get_verse

# Type checking
uv run ty check lsbible

# Linting
uv run ruff check lsbible
uv run ruff check lsbible --fix  # Auto-fix

# Formatting
uv run ruff format lsbible
```

### Project Structure

```
packages/python-sdk/
├── lsbible/              # SDK source code
│   ├── __init__.py       # Public API exports
│   ├── client.py         # HTTP client
│   ├── models.py         # Pydantic models
│   ├── parser.py         # HTML parser
│   ├── validators.py     # Reference validation
│   ├── books.py          # Bible structure data
│   ├── cache.py          # Response caching
│   └── exceptions.py     # Custom exceptions
├── tests/                # Test suite
├── examples/             # Usage examples
├── README.md             # This file
└── pyproject.toml        # Project configuration
```

## Contributing

We welcome contributions! See the main [Contributing Guidelines](../../CONTRIBUTING.md) for details on:

- Reporting bugs
- Suggesting features
- Submitting pull requests
- Code style and standards

### Quick Tips

- **Add tests** for new features
- **Update docs** for API changes
- **Follow code style** (run `ruff format`)
- **Run tests** before submitting (`pytest`)

## License

MIT License - See [LICENSE](../../LICENSE) file for details.

---

<div align="center">

**[Back to Monorepo Root →](../../README.md)**

Made with ❤️ for Bible software developers

</div>
