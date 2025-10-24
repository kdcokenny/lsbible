"""LSBible MCP Server - Model Context Protocol integration for the LSBible SDK."""

import json

from fastmcp import FastMCP

from lsbible.books import BIBLE_STRUCTURE
from lsbible.client import LSBibleClient
from lsbible.exceptions import APIError, BuildIDError, InvalidReferenceError
from lsbible.models import Testament
from lsbible.validators import BookValidator

# Initialize FastMCP server
mcp = FastMCP(
    name="LSBible",
    instructions="Access Bible passages from the Legacy Standard Bible (LSB) translation.",
)

# Initialize SDK client (shared across all tool calls)
client = LSBibleClient()


# HELPERS


def _coerce_int(value: int | str | None) -> int | None:
    """Convert string to int if needed, pass through int/None as-is.

    This is needed because MCP clients may send integer parameters as strings.

    Args:
        value: The value to coerce (int, str, or None)

    Returns:
        int if value is int or convertible string, None if value is None

    Raises:
        ValueError: If string value cannot be converted to int
    """
    if value is None:
        return None
    if isinstance(value, str):
        return int(value)
    return value


# TOOLS


@mcp.tool()
def get_verse(book: str, chapter: int | str, verse: int | str) -> dict:
    """Fetch a single Bible verse from the LSB translation.

    Args:
        book: Book name (e.g., "John", "Genesis", "1 John")
        chapter: Chapter number (int or string)
        verse: Verse number (int or string)

    Returns:
        Dictionary with verse reference, text, and formatting segments
    """
    try:
        # Coerce parameters to int (MCP clients may send strings)
        chapter = _coerce_int(chapter)
        verse = _coerce_int(verse)

        result = client.get_verse(book, chapter, verse)
        verse_content = result.verses[0]

        return {
            "reference": f"{book} {chapter}:{verse}",
            "text": verse_content.plain_text,
            "segments": [
                {
                    "text": seg.text,
                    "is_red_letter": seg.is_red_letter,
                    "is_italic": seg.is_italic,
                    "is_bold": seg.is_bold,
                    "is_small_caps": seg.is_small_caps,
                }
                for seg in verse_content.segments
            ],
        }
    except InvalidReferenceError as e:
        raise ValueError(f"Invalid Bible reference: {e}") from e
    except (APIError, BuildIDError) as e:
        raise RuntimeError(f"Failed to fetch verse: {e}") from e


@mcp.tool()
def get_passage(
    book: str,
    start_chapter: int | str,
    start_verse: int | str,
    end_chapter: int | str | None = None,
    end_verse: int | str | None = None,
) -> dict:
    """Fetch a passage (multiple verses) from the LSB translation.

    Args:
        book: Book name
        start_chapter: Starting chapter number (int or string)
        start_verse: Starting verse number (int or string)
        end_chapter: Ending chapter (int or string, defaults to start_chapter)
        end_verse: Ending verse (int or string, defaults to start_verse)

    Returns:
        Dictionary with passage reference, all verses, and metadata
    """
    try:
        # Coerce parameters to int (MCP clients may send strings)
        start_chapter = _coerce_int(start_chapter)
        start_verse = _coerce_int(start_verse)
        end_chapter = _coerce_int(end_chapter)
        end_verse = _coerce_int(end_verse)

        # SDK requires 6 parameters - convert from optional params
        to_book = book
        to_chapter = end_chapter if end_chapter is not None else start_chapter
        to_verse = end_verse if end_verse is not None else start_verse

        result = client.get_passage(book, start_chapter, start_verse, to_book, to_chapter, to_verse)

        return {
            "reference": result.title,
            "verses": [
                {
                    "verse_number": v.verse_number,
                    "text": v.plain_text,
                    "segments": [
                        {
                            "text": seg.text,
                            "is_red_letter": seg.is_red_letter,
                            "is_italic": seg.is_italic,
                            "is_bold": seg.is_bold,
                            "is_small_caps": seg.is_small_caps,
                        }
                        for seg in v.segments
                    ],
                }
                for v in result.verses
            ],
            "verse_count": len(result.verses),
        }
    except InvalidReferenceError as e:
        raise ValueError(f"Invalid Bible reference: {e}") from e
    except (APIError, BuildIDError) as e:
        raise RuntimeError(f"Failed to fetch passage: {e}") from e


@mcp.tool()
def get_chapter(book: str, chapter: int | str) -> dict:
    """Fetch an entire chapter from the LSB translation.

    Args:
        book: Book name
        chapter: Chapter number (int or string)

    Returns:
        Dictionary with chapter reference and all verses
    """
    try:
        # Coerce parameters to int (MCP clients may send strings)
        chapter = _coerce_int(chapter)

        result = client.get_chapter(book, chapter)

        return {
            "reference": f"{book} {chapter}",
            "verses": [
                {"verse_number": v.verse_number, "text": v.plain_text} for v in result.verses
            ],
            "verse_count": len(result.verses),
        }
    except (InvalidReferenceError, APIError) as e:
        raise ValueError(f"Invalid Bible reference: {e}") from e
    except BuildIDError as e:
        raise RuntimeError(f"Failed to fetch chapter: {e}") from e


@mcp.tool()
def search_bible(query: str, limit: int = 10) -> dict:
    """Search for verses containing a query string.

    Args:
        query: Search query
        limit: Maximum number of results (default: 10)

    Returns:
        Dictionary with matching verses and their references

    Implementation Notes:
    - SDK's search() method signature: search(query: str) -> SearchResponse
    - Does not support book filtering or limiting
    - Limiting is implemented via post-processing of results
    - SearchResponse.passages contains Passage objects, each with verses
    - We flatten the structure to individual verses for easier consumption
    """
    try:
        result = client.search(query)

        # Flatten passages into individual verses with limiting (post-processing)
        all_verses = []
        for passage in result.passages:
            for verse in passage.verses:
                all_verses.append({"reference": str(verse.reference), "text": verse.plain_text})
                if len(all_verses) >= limit:
                    break
            if len(all_verses) >= limit:
                break

        return {
            "query": query,
            "results": all_verses,
            "result_count": len(all_verses),
            "total_matches": result.match_count,
        }
    except (APIError, BuildIDError) as e:
        raise RuntimeError(f"Search failed: {e}") from e


# RESOURCES


@mcp.resource("bible://books")
def list_books() -> str:
    """List all 66 books of the Bible with metadata."""
    books = []
    for _book_num, book_info in BIBLE_STRUCTURE.items():
        testament = "Old" if book_info["testament"] == Testament.OLD_TESTAMENT else "New"
        books.append(
            {
                "name": book_info["name"],
                "chapters": book_info["chapters"],
                "testament": testament,
                "total_verses": sum(book_info["verses"]),
            }
        )

    return json.dumps({"books": books, "total_books": len(books)})


@mcp.resource("bible://structure/{book}")
def get_book_structure(book: str) -> str:
    """Get chapter/verse structure for a specific book."""
    try:
        # Normalize and validate book name
        book_num = BookValidator.get_book_number(book)
        book_info = BIBLE_STRUCTURE[book_num]

        result = {
            "book": book_info["name"],
            "chapters": book_info["chapters"],
            "verses_per_chapter": book_info["verses"],
            "total_verses": sum(book_info["verses"]),
        }
        return json.dumps(result)
    except InvalidReferenceError as e:
        raise ValueError(f"Invalid book name: {e}") from e


# PROMPTS


@mcp.prompt()
def bible_study(
    book: str, chapter: int | str, verse_start: int | str, verse_end: int | str | None = None
) -> str:
    """Generate a prompt for Bible study on a specific passage."""
    # Coerce parameters to int (MCP clients may send strings)
    chapter = _coerce_int(chapter)
    verse_start = _coerce_int(verse_start)
    verse_end = _coerce_int(verse_end)

    if verse_end:
        ref = f"{book} {chapter}:{verse_start}-{verse_end}"
    else:
        ref = f"{book} {chapter}:{verse_start}"

    return f"""Please provide a Bible study on {ref}. Include:

1. Context: Historical and literary context of this passage
2. Meaning: Key themes and theological insights
3. Application: How this passage applies to modern life
4. Cross-references: Related verses that illuminate this passage

Use the get_passage or get_verse tool to fetch the text first."""


@mcp.prompt()
def cross_reference(reference: str) -> str:
    """Generate a prompt for finding cross-references."""
    return f"""Please find and analyze cross-references for {reference}:

1. Use the get_verse or get_passage tool to fetch {reference}
2. Identify key themes and concepts in the passage
3. Use the search_bible tool to find related verses
4. Explain how these cross-references illuminate the original passage"""


# CLI ENTRY POINT


def main():
    """Entry point for the lsbible-mcp command."""
    mcp.run()


if __name__ == "__main__":
    main()
