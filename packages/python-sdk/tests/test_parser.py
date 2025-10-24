"""Tests for HTML parser."""

import pytest

from lsbible.models import BookName, VerseContent
from lsbible.parser import PassageParser


class TestPassageParser:
    """Test PassageParser class."""

    def test_parse_simple_verse(self, sample_passage_html_simple):
        """Test parsing a simple verse without formatting."""
        verses = PassageParser.parse_passage_html(sample_passage_html_simple)

        assert len(verses) == 1
        verse = verses[0]

        assert isinstance(verse, VerseContent)
        assert verse.reference.book_number == 43
        assert verse.reference.chapter == 3
        assert verse.reference.verse == 16
        assert verse.verse_number == 16
        assert len(verse.segments) > 0
        assert "For God so loved the world" in verse.plain_text

    def test_parse_formatted_verse(self, sample_passage_html_formatted):
        """Test parsing a verse with various formatting."""
        verses = PassageParser.parse_passage_html(sample_passage_html_formatted)

        assert len(verses) == 1
        verse = verses[0]

        # Check that we have multiple segments
        assert len(verse.segments) > 1

        # Check for red letter text (Jesus' words)
        red_letter_segments = [s for s in verse.segments if s.is_red_letter]
        assert len(red_letter_segments) > 0
        assert any("For God so loved the world" in s.text for s in red_letter_segments)

        # Check for italic text
        italic_segments = [s for s in verse.segments if s.is_italic]
        assert len(italic_segments) > 0
        assert any("only" in s.text for s in italic_segments)

        # Check for bold text
        bold_segments = [s for s in verse.segments if s.is_bold]
        assert len(bold_segments) > 0
        assert any("eternal life" in s.text for s in bold_segments)

    def test_parse_small_caps(self, sample_passage_html_small_caps):
        """Test parsing verse with small caps (LORD/Yahweh)."""
        verses = PassageParser.parse_passage_html(sample_passage_html_small_caps)

        assert len(verses) == 1
        verse = verses[0]

        # Check that we parsed Psalm 23:1
        assert verse.reference.book_number == 19
        assert verse.reference.chapter == 23
        assert verse.reference.verse == 1

        # Check for small caps segments
        small_caps_segments = [s for s in verse.segments if s.is_small_caps]
        assert len(small_caps_segments) > 0
        assert any("Lord" in s.text for s in small_caps_segments)

        # Check for poetry flag
        assert verse.is_poetry is True

    def test_parse_verse_reference_from_data_key(self):
        """Test parsing verse reference from data-key attribute."""
        html = '<span class="verse" data-key="43-003-016"><small data-verse="16">16</small>Test</span>'
        verses = PassageParser.parse_passage_html(html)

        assert len(verses) == 1
        assert verses[0].reference.book_number == 43
        assert verses[0].reference.chapter == 3
        assert verses[0].reference.verse == 16

    def test_parse_verse_number_from_attribute(self):
        """Test parsing verse number from data-verse attribute."""
        html = '<span class="verse" data-key="43-003-016"><small data-verse="16">16</small>Test</span>'
        verses = PassageParser.parse_passage_html(html)

        assert verses[0].verse_number == 16

    def test_parse_multiple_verses(self):
        """Test parsing multiple verses."""
        html = """
        <span class="verse" data-key="43-003-016">
            <small data-verse="16">16</small>
            <span class="prose">Verse 16</span>
        </span>
        <span class="verse" data-key="43-003-017">
            <small data-verse="17">17</small>
            <span class="prose">Verse 17</span>
        </span>
        """
        verses = PassageParser.parse_passage_html(html)

        assert len(verses) == 2
        assert verses[0].verse_number == 16
        assert verses[1].verse_number == 17
        assert "Verse 16" in verses[0].plain_text
        assert "Verse 17" in verses[1].plain_text

    def test_parse_empty_html(self):
        """Test parsing empty HTML."""
        verses = PassageParser.parse_passage_html("")
        assert len(verses) == 0

    def test_parse_html_without_verses(self):
        """Test parsing HTML without verse elements."""
        html = "<div>Some text without verse spans</div>"
        verses = PassageParser.parse_passage_html(html)
        assert len(verses) == 0

    def test_parse_missing_data_key(self):
        """Test parsing verse with missing data-key raises error."""
        html = '<span class="verse"><small data-verse="16">16</small>Test</span>'

        with pytest.raises(ValueError, match="missing data-key"):
            PassageParser.parse_passage_html(html)

    def test_plain_text_property(self, sample_passage_html_formatted):
        """Test that plain_text joins all segments."""
        verses = PassageParser.parse_passage_html(sample_passage_html_formatted)
        verse = verses[0]

        plain_text = verse.plain_text
        assert "For God so loved the world" in plain_text
        assert "eternal life" in plain_text

    def test_formatted_text_property(self, sample_passage_html_formatted):
        """Test that formatted_text adds formatting markers."""
        verses = PassageParser.parse_passage_html(sample_passage_html_formatted)
        verse = verses[0]

        formatted_text = verse.formatted_text

        # Red letter text should be in quotes
        assert '"For God so loved the world' in formatted_text or '"For God so loved the world"' in formatted_text

        # Italic text should be in brackets
        assert "[only]" in formatted_text

    def test_parse_prose_flag(self, sample_passage_html_simple):
        """Test detecting prose formatting."""
        verses = PassageParser.parse_passage_html(sample_passage_html_simple)
        verse = verses[0]

        # The sample has prose class
        assert verse.is_prose is True or verse.is_poetry is False

    def test_parse_poetry_flag(self, sample_passage_html_small_caps):
        """Test detecting poetry formatting."""
        verses = PassageParser.parse_passage_html(sample_passage_html_small_caps)
        verse = verses[0]

        assert verse.is_poetry is True

    def test_parse_strips_verse_number_from_text(self):
        """Test that verse numbers are not included in text."""
        html = '<span class="verse" data-key="43-003-016"><small data-verse="16"><span>16 </span></small>For God</span>'
        verses = PassageParser.parse_passage_html(html)

        # Verse number should not be in the text
        plain_text = verses[0].plain_text
        assert "For God" in plain_text
        # The "16" from the verse number should be stripped
        assert not plain_text.startswith("16")

    @pytest.mark.parametrize(
        "data_key,expected_book,expected_chapter,expected_verse",
        [
            ("01-001-001", 1, 1, 1),  # Genesis 1:1
            ("19-023-001", 19, 23, 1),  # Psalm 23:1
            ("43-003-016", 43, 3, 16),  # John 3:16
            ("66-022-021", 66, 22, 21),  # Revelation 22:21
        ],
    )
    def test_parse_various_references(
        self, data_key, expected_book, expected_chapter, expected_verse
    ):
        """Test parsing various verse references."""
        html = f'<span class="verse" data-key="{data_key}"><small data-verse="{expected_verse}">X</small>Text</span>'
        verses = PassageParser.parse_passage_html(html)

        assert verses[0].reference.book_number == expected_book
        assert verses[0].reference.chapter == expected_chapter
        assert verses[0].reference.verse == expected_verse
