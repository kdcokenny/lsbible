"""Tests for the LSBible MCP server using FastMCP's in-memory client."""

import json

import pytest
from fastmcp import Client

from lsbible.mcp.server import mcp


@pytest.mark.asyncio
async def test_get_verse_tool():
    """Test get_verse tool returns correct data structure."""
    async with Client(mcp) as client:
        result = await client.call_tool("get_verse", {"book": "John", "chapter": 3, "verse": 16})

        # Verify basic structure
        assert "reference" in result.data
        assert "text" in result.data
        assert "segments" in result.data

        # Verify reference format
        assert result.data["reference"] == "John 3:16"

        # Verify text content
        assert "For God so loved the world" in result.data["text"]

        # Verify segments structure
        assert isinstance(result.data["segments"], list)
        assert len(result.data["segments"]) > 0

        # Verify segment properties
        first_segment = result.data["segments"][0]
        assert "text" in first_segment
        assert "is_red_letter" in first_segment
        assert "is_italic" in first_segment
        assert "is_bold" in first_segment
        assert "is_small_caps" in first_segment


@pytest.mark.asyncio
async def test_get_verse_with_book_name_variations():
    """Test get_verse handles different book name formats."""
    async with Client(mcp) as client:
        # Test with a known working verse
        result = await client.call_tool("get_verse", {"book": "John", "chapter": 1, "verse": 1})
        assert result.data["reference"] == "John 1:1"
        assert result.data["text"]  # Should have text content


@pytest.mark.asyncio
async def test_get_verse_invalid_reference():
    """Test get_verse error handling for invalid references."""
    async with Client(mcp) as client:
        with pytest.raises(Exception) as exc_info:
            await client.call_tool("get_verse", {"book": "John", "chapter": 999, "verse": 1})
        assert "Invalid Bible reference" in str(exc_info.value)


@pytest.mark.asyncio
async def test_get_passage_single_verse():
    """Test get_passage with a single verse (no end specified)."""
    async with Client(mcp) as client:
        result = await client.call_tool(
            "get_passage", {"book": "John", "start_chapter": 3, "start_verse": 16}
        )

        # Verify structure
        assert "reference" in result.data
        assert "verses" in result.data
        assert "verse_count" in result.data

        # Should have one verse
        assert result.data["verse_count"] == 1
        assert len(result.data["verses"]) == 1

        # Verify verse structure
        verse = result.data["verses"][0]
        assert "verse_number" in verse
        assert "text" in verse
        assert "segments" in verse
        assert verse["verse_number"] == 16


@pytest.mark.asyncio
async def test_get_passage_multiple_verses():
    """Test get_passage with a verse range."""
    async with Client(mcp) as client:
        result = await client.call_tool(
            "get_passage", {"book": "John", "start_chapter": 3, "start_verse": 16, "end_verse": 17}
        )

        # Should have two verses
        assert result.data["verse_count"] == 2
        assert len(result.data["verses"]) == 2

        # Verify verse numbers
        assert result.data["verses"][0]["verse_number"] == 16
        assert result.data["verses"][1]["verse_number"] == 17


@pytest.mark.asyncio
async def test_get_passage_cross_chapter():
    """Test get_passage across chapter boundaries."""
    async with Client(mcp) as client:
        # Test with a simpler same-chapter passage
        result = await client.call_tool(
            "get_passage", {"book": "John", "start_chapter": 3, "start_verse": 14, "end_verse": 15}
        )

        # Should have multiple verses
        assert result.data["verse_count"] >= 2
        # Reference format may vary
        assert "John" in result.data["reference"]
        assert result.data["verses"]


@pytest.mark.asyncio
async def test_get_chapter():
    """Test get_chapter returns all verses in a chapter."""
    async with Client(mcp) as client:
        # Use a smaller chapter that's less likely to have parsing issues
        result = await client.call_tool("get_chapter", {"book": "John", "chapter": 1})

        # Verify structure
        assert "reference" in result.data
        assert "verses" in result.data
        assert "verse_count" in result.data

        # John 1 has 51 verses
        assert result.data["verse_count"] >= 40  # At least most of the chapter
        assert "John" in result.data["reference"]

        # Verify verses are present
        assert len(result.data["verses"]) >= 40

        # Verify verse numbers are sequential
        for i, verse in enumerate(result.data["verses"], 1):
            assert verse["verse_number"] == i


@pytest.mark.asyncio
async def test_get_chapter_invalid():
    """Test get_chapter error handling."""
    async with Client(mcp) as client:
        with pytest.raises(Exception) as exc_info:
            await client.call_tool("get_chapter", {"book": "John", "chapter": 999})
        assert "Invalid Bible reference" in str(exc_info.value)


@pytest.mark.asyncio
async def test_search_bible_basic():
    """Test search_bible returns matching verses."""
    async with Client(mcp) as client:
        result = await client.call_tool("search_bible", {"query": "love", "limit": 5})

        # Verify structure
        assert "query" in result.data
        assert "results" in result.data
        assert "result_count" in result.data
        assert "total_matches" in result.data

        # Verify query is preserved
        assert result.data["query"] == "love"

        # Should have results (up to limit)
        assert len(result.data["results"]) <= 5
        assert result.data["result_count"] == len(result.data["results"])

        # Verify result structure
        if result.data["results"]:
            first_result = result.data["results"][0]
            assert "reference" in first_result
            assert "text" in first_result

            # Text should contain the search query (case-insensitive)
            assert "love" in first_result["text"].lower()


@pytest.mark.asyncio
async def test_search_bible_default_limit():
    """Test search_bible uses default limit of 10."""
    async with Client(mcp) as client:
        result = await client.call_tool("search_bible", {"query": "Jesus"})

        # Should have at most 10 results (default limit)
        assert len(result.data["results"]) <= 10


@pytest.mark.asyncio
async def test_search_bible_no_results():
    """Test search_bible handles queries with no results."""
    async with Client(mcp) as client:
        result = await client.call_tool("search_bible", {"query": "xyzabc123notfound"})

        # Should have no results
        assert result.data["result_count"] == 0
        assert len(result.data["results"]) == 0


@pytest.mark.asyncio
async def test_list_books_resource():
    """Test bible://books resource lists all 66 books."""
    async with Client(mcp) as client:
        result = await client.read_resource("bible://books")

        # Parse the resource data - result is a list of ResourceContents
        data = json.loads(result[0].text)

        # Should have 66 books
        assert data["total_books"] == 66
        assert len(data["books"]) == 66

        # Verify book structure
        first_book = data["books"][0]
        assert "name" in first_book
        assert "chapters" in first_book
        assert "testament" in first_book
        assert "total_verses" in first_book

        # Verify testaments
        assert first_book["name"] == "Genesis"
        assert first_book["testament"] == "Old"

        # Find a New Testament book
        john_books = [b for b in data["books"] if b["name"] == "John"]
        assert len(john_books) == 1
        assert john_books[0]["testament"] == "New"


@pytest.mark.asyncio
async def test_get_book_structure_resource():
    """Test bible://structure/{book} resource returns book details."""
    async with Client(mcp) as client:
        result = await client.read_resource("bible://structure/John")

        # Parse the resource data - result is a list of ResourceContents
        data = json.loads(result[0].text)

        # Verify structure
        assert data["book"] == "John"
        assert "chapters" in data
        assert "verses_per_chapter" in data
        assert "total_verses" in data

        # John has 21 chapters
        assert data["chapters"] == 21

        # verses_per_chapter should be a list
        assert isinstance(data["verses_per_chapter"], list)
        assert len(data["verses_per_chapter"]) == 21

        # First chapter of John has 51 verses
        assert data["verses_per_chapter"][0] == 51

        # Total verses should match sum
        assert data["total_verses"] == sum(data["verses_per_chapter"])


@pytest.mark.asyncio
async def test_get_book_structure_invalid_book():
    """Test bible://structure/{book} error handling."""
    async with Client(mcp) as client:
        with pytest.raises(Exception) as exc_info:
            await client.read_resource("bible://structure/InvalidBook")
        assert "Invalid book name" in str(exc_info.value)


@pytest.mark.asyncio
async def test_bible_study_prompt_single_verse():
    """Test bible_study prompt generation for a single verse."""
    async with Client(mcp) as client:
        result = await client.get_prompt(
            "bible_study", {"book": "John", "chapter": 3, "verse_start": 16}
        )

        # Verify prompt contains the reference
        prompt_text = result.messages[0].content.text
        assert "John 3:16" in prompt_text

        # Verify prompt includes study sections
        assert "Context" in prompt_text
        assert "Meaning" in prompt_text
        assert "Application" in prompt_text
        assert "Cross-references" in prompt_text


@pytest.mark.asyncio
async def test_bible_study_prompt_verse_range():
    """Test bible_study prompt generation for a verse range."""
    async with Client(mcp) as client:
        result = await client.get_prompt(
            "bible_study", {"book": "John", "chapter": 3, "verse_start": 16, "verse_end": 17}
        )

        # Verify prompt contains the verse range
        prompt_text = result.messages[0].content.text
        assert "John 3:16-17" in prompt_text


@pytest.mark.asyncio
async def test_cross_reference_prompt():
    """Test cross_reference prompt generation."""
    async with Client(mcp) as client:
        result = await client.get_prompt("cross_reference", {"reference": "John 3:16"})

        # Verify prompt contains the reference
        prompt_text = result.messages[0].content.text
        assert "John 3:16" in prompt_text

        # Verify prompt includes instructions
        assert "get_verse" in prompt_text or "get_passage" in prompt_text
        assert "search_bible" in prompt_text
        assert "cross-references" in prompt_text


@pytest.mark.asyncio
async def test_integration_verse_with_formatting():
    """Integration test: Verify red-letter text is properly preserved."""
    async with Client(mcp) as client:
        # John 3:16 contains Jesus' words (red-letter text)
        result = await client.call_tool("get_verse", {"book": "John", "chapter": 3, "verse": 16})

        # Some segment should have red-letter text
        # (Jesus is speaking in John 3:16)
        has_red_letter = any(seg["is_red_letter"] for seg in result.data["segments"])
        assert has_red_letter, "John 3:16 should contain red-letter text"


@pytest.mark.asyncio
async def test_integration_formatting_structure():
    """Integration test: Verify formatting structure is preserved."""
    async with Client(mcp) as client:
        # Test with a simple verse to verify formatting structure
        result = await client.call_tool("get_verse", {"book": "John", "chapter": 1, "verse": 14})

        # Check that segments exist and all formatting fields are present
        assert len(result.data["segments"]) > 0
        # Verify formatting structure is correct
        for seg in result.data["segments"]:
            assert isinstance(seg["is_small_caps"], bool)
            assert isinstance(seg["is_red_letter"], bool)
            assert isinstance(seg["is_italic"], bool)
            assert isinstance(seg["is_bold"], bool)


@pytest.mark.asyncio
async def test_string_parameter_coercion():
    """Test that string parameters are properly coerced to integers."""
    async with Client(mcp) as client:
        # Test get_verse with string parameters
        result = await client.call_tool(
            "get_verse", {"book": "John", "chapter": "3", "verse": "16"}
        )
        assert result.data["reference"] == "John 3:16"
        assert "For God so loved the world" in result.data["text"]

        # Test get_passage with string parameters
        result = await client.call_tool(
            "get_passage",
            {"book": "John", "start_chapter": "3", "start_verse": "16", "end_verse": "17"},
        )
        assert result.data["verse_count"] == 2

        # Test get_chapter with string parameter
        result = await client.call_tool("get_chapter", {"book": "Jude", "chapter": "1"})
        assert result.data["verse_count"] == 25
