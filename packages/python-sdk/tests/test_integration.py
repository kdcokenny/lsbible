"""Integration tests against real LSBible API.

These tests hit the actual API and should be run manually.
They are skipped by default to avoid making API calls during normal test runs.

To run: pytest tests/test_integration.py -v -m integration
"""

import pytest

from lsbible import LSBibleClient


@pytest.mark.integration
@pytest.mark.skip(reason="Integration test - requires real API, run manually")
class TestRealAPIIntegration:
    """Tests that hit the actual LSBible API."""

    @pytest.mark.asyncio
    async def test_first_verses_of_chapters(self):
        """Verify first verses parse correctly (regression test for parser bug).

        First verses (class='verse first-verse') lack <small data-verse> tags.
        This test ensures the parser handles them correctly.
        """
        async with LSBibleClient() as client:
            test_cases = [
                ("John", 1, 1, "beginning"),
                ("Genesis", 1, 1, "beginning"),
                ("Psalms", 23, 1, "shepherd"),
                ("Romans", 8, 1, "condemnation"),
            ]

            for book, chapter, verse, expected_word in test_cases:
                result = await client.get_verse(book, chapter, verse)
                assert len(result.verses) == 1
                assert expected_word.lower() in result.verses[0].plain_text.lower(), (
                    f"{book} {chapter}:{verse} should contain '{expected_word}'"
                )

    @pytest.mark.asyncio
    async def test_non_first_verses(self):
        """Verify non-first verses still work (have <small> tags)."""
        async with LSBibleClient() as client:
            test_cases = [
                ("John", 3, 16, "God so loved"),
                ("Romans", 8, 28, "all things work"),
            ]

            for book, chapter, verse, expected_phrase in test_cases:
                result = await client.get_verse(book, chapter, verse)
                assert len(result.verses) == 1
                assert expected_phrase in result.verses[0].plain_text

    @pytest.mark.asyncio
    async def test_full_chapter(self):
        """Verify full chapters parse correctly (mix of first and non-first verses)."""
        async with LSBibleClient() as client:
            # Philemon has only 1 chapter with 25 verses
            result = await client.get_chapter("Philemon", 1)

            assert len(result.verses) == 25
            assert result.verses[0].verse_number == 1
            assert result.verses[-1].verse_number == 25
