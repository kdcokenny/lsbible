# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Python SDK for the LSBible API, part of a monorepo at `/Users/kenny/workspace/kdcokenny/lsbible/`. The SDK provides structured, type-safe access to Bible passages using explicit parameters (book, chapter, verse) rather than string parsing.

**Core Design Principle:** Structured parameters with full validation before API calls, not string parsing like "John 3:16".

## Development Commands

### Testing
```bash
# Run all tests with coverage
uv run pytest

# Run specific test file
uv run pytest tests/test_client.py

# Run single test
uv run pytest tests/test_client.py::test_get_verse
```

### Type Checking
```bash
# Run type checking (using ty)
uv run ty check lsbible
```

### Linting & Formatting
```bash
# Check code style
uv run ruff check lsbible

# Auto-fix linting issues
uv run ruff check lsbible --fix

# Format code
uv run ruff format lsbible
```

### Dependencies
```bash
# Install/sync dependencies
uv sync

# Add new dependency
uv add <package>

# Add dev dependency
uv add --dev <package>
```

## Architecture

### Core Components

1. **Client (`lsbible/client.py`)**: Main API client
   - Manages HTTP requests via httpx
   - Auto-detects Next.js build ID from homepage
   - Implements response caching with TTL
   - Provides high-level methods: `get_verse()`, `get_passage()`, `get_chapter()`, `search()`

2. **Models (`lsbible/models.py`)**: Pydantic data models
   - `BookName`: Enum of all 66 books (e.g., `BookName.JOHN`)
   - `VerseReference`: Immutable verse reference with validation
   - `TextSegment`: Text with formatting metadata (red-letter, italic, bold, small-caps)
   - `VerseContent`: Complete verse with segments and metadata
   - `Passage`: Collection of verses with range information
   - `SearchResponse`: API response wrapper

3. **Parser (`lsbible/parser.py`)**: HTML parsing
   - Extracts verses from LSBible's HTML format
   - Preserves formatting (red-letter text for Jesus' words, italics, small-caps for LORD/Yahweh)
   - Uses BeautifulSoup with lxml

4. **Validators (`lsbible/validators.py`)**: Reference validation
   - `BookValidator`: Book name normalization and lookup
   - `ReferenceValidator`: Validates book/chapter/verse combinations against Bible structure

5. **Books (`lsbible/books.py`)**: Bible structure data
   - `BIBLE_STRUCTURE`: Dict mapping book numbers to chapter/verse counts
   - `BOOK_NAMES`: Maps book numbers to display names

6. **Cache (`lsbible/cache.py`)**: TTL-based response cache
   - In-memory caching with time-to-live
   - Reduces API calls for repeated queries

7. **Exceptions (`lsbible/exceptions.py`)**: Custom exceptions
   - `LSBibleError`: Base exception
   - `InvalidReferenceError`: Invalid book/chapter/verse
   - `APIError`: API request failures
   - `BuildIDError`: Build ID detection failures

### Data Flow

1. User calls `client.get_verse(BookName.JOHN, 3, 16)`
2. `ReferenceValidator` validates the reference against `BIBLE_STRUCTURE`
3. `BookValidator` normalizes book name to canonical form
4. `LSBibleClient._make_request()` checks cache, then fetches from API
5. `PassageParser` parses HTML into structured `VerseContent` objects
6. Returns `Passage` containing validated, structured data

### API Integration

- Base URL: `https://read.lsbible.org`
- Endpoint: `/_next/data/{buildId}/index.json?q={query}`
- Build ID: Auto-detected from homepage `__NEXT_DATA__` script tag
- Responses cached with configurable TTL (default 3600s)

## Code Conventions

### Type Hints
- All functions must have complete type hints
- Use `Union[BookName, str]` for book parameters (supports both enum and string)
- Use `|` syntax for unions in Python 3.12+ (e.g., `str | None`)

### Validation
- Validate all Bible references before API calls
- Use Pydantic models for all data structures
- Frozen models (`frozen=True`) for immutability where appropriate

### Error Handling
- Raise `InvalidReferenceError` for invalid Bible references
- Raise `APIError` for HTTP/network failures
- Raise `BuildIDError` for build ID detection failures
- All custom exceptions inherit from `LSBibleError`

### Testing
- Use pytest fixtures in `conftest.py` for shared test data
- Mock HTTP requests with `respx` library
- Test both enum and string inputs for book parameters
- Aim for >80% code coverage (current: configured in pyproject.toml)

### Configuration
- Line length: 100 characters (Ruff)
- Python version: 3.12+
- Import order: stdlib, third-party, first-party (isort via Ruff)
- Quote style: double quotes

## Commit Message Format

Follow Conventional Commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `test:` - Adding or updating tests
- `refactor:` - Code restructuring without behavior change
- `chore:` - Maintenance tasks

Do NOT include AI attribution watermarks in commit messages.

## Monorepo Context

This package is in `packages/python-sdk/` within a larger monorepo managed by Turborepo. Other planned SDKs (TypeScript, Rust, Go) will follow the same API design patterns.
