"""Tests for Pydantic models."""

import pytest
from pydantic import ValidationError

from lsbible.models import (
    BookName,
    Passage,
    SearchResponse,
    Testament,
    TextSegment,
    VerseContent,
    VerseReference,
)


class TestBookName:
    """Test BookName enum."""

    def test_book_name_enum_values(self):
        """Test that all 66 books are defined."""
        assert len(BookName) == 66

    def test_old_testament_books(self):
        """Test Old Testament book names."""
        assert BookName.GENESIS.value == "Genesis"
        assert BookName.EXODUS.value == "Exodus"
        assert BookName.MALACHI.value == "Malachi"

    def test_new_testament_books(self):
        """Test New Testament book names."""
        assert BookName.MATTHEW.value == "Matthew"
        assert BookName.JOHN.value == "John"
        assert BookName.REVELATION.value == "Revelation"

    def test_numbered_books(self):
        """Test books with numbers."""
        assert BookName.SAMUEL_1.value == "1 Samuel"
        assert BookName.KINGS_2.value == "2 Kings"
        assert BookName.JOHN_3.value == "3 John"


class TestVerseReference:
    """Test VerseReference model."""

    def test_valid_reference(self):
        """Test creating a valid verse reference."""
        ref = VerseReference(book_number=43, chapter=3, verse=16)
        assert ref.book_number == 43
        assert ref.chapter == 3
        assert ref.verse == 16

    def test_book_name_property(self):
        """Test book_name property."""
        ref = VerseReference(book_number=43, chapter=3, verse=16)
        assert ref.book_name == BookName.JOHN

    def test_str_representation(self):
        """Test string representation."""
        ref = VerseReference(book_number=43, chapter=3, verse=16)
        assert str(ref) == "John 3:16"

    def test_invalid_book_number_too_low(self):
        """Test that book number must be >= 1."""
        with pytest.raises(ValidationError):
            VerseReference(book_number=0, chapter=1, verse=1)

    def test_invalid_book_number_too_high(self):
        """Test that book number must be <= 66."""
        with pytest.raises(ValidationError):
            VerseReference(book_number=67, chapter=1, verse=1)

    def test_invalid_chapter_too_high(self):
        """Test that chapter must exist in book."""
        # John only has 21 chapters
        with pytest.raises(ValidationError, match="John only has 21 chapters"):
            VerseReference(book_number=43, chapter=22, verse=1)

    def test_invalid_verse_too_high(self):
        """Test that verse must exist in chapter."""
        # John 3 only has 36 verses
        with pytest.raises(ValidationError, match="John 3 only has 36 verses"):
            VerseReference(book_number=43, chapter=3, verse=37)

    def test_frozen_model(self):
        """Test that VerseReference is immutable."""
        ref = VerseReference(book_number=43, chapter=3, verse=16)
        with pytest.raises(ValidationError):
            ref.book_number = 1

    @pytest.mark.parametrize(
        "book_num,chapter,verse,expected",
        [
            (1, 1, 1, "Genesis 1:1"),
            (19, 23, 1, "Psalms 23:1"),
            (43, 3, 16, "John 3:16"),
            (66, 22, 21, "Revelation 22:21"),
        ],
    )
    def test_various_references(self, book_num, chapter, verse, expected):
        """Test various valid references."""
        ref = VerseReference(book_number=book_num, chapter=chapter, verse=verse)
        assert str(ref) == expected


class TestTextSegment:
    """Test TextSegment model."""

    def test_plain_text_segment(self):
        """Test creating a plain text segment."""
        segment = TextSegment(text="For God so loved the world")
        assert segment.text == "For God so loved the world"
        assert segment.is_red_letter is False
        assert segment.is_italic is False
        assert segment.is_bold is False
        assert segment.is_small_caps is False

    def test_red_letter_segment(self):
        """Test red letter (Jesus' words) segment."""
        segment = TextSegment(text="I am the way", is_red_letter=True)
        assert segment.text == "I am the way"
        assert segment.is_red_letter is True

    def test_formatted_segment(self):
        """Test segment with multiple formatting flags."""
        segment = TextSegment(text="eternal life", is_bold=True, is_italic=True)
        assert segment.is_bold is True
        assert segment.is_italic is True

    def test_small_caps_segment(self):
        """Test small caps (LORD/Yahweh) segment."""
        segment = TextSegment(text="LORD", is_small_caps=True)
        assert segment.is_small_caps is True

    def test_frozen_model(self):
        """Test that TextSegment is immutable."""
        segment = TextSegment(text="test")
        with pytest.raises(ValidationError):
            segment.text = "changed"


class TestVerseContent:
    """Test VerseContent model."""

    def test_basic_verse_content(self):
        """Test creating basic verse content."""
        ref = VerseReference(book_number=43, chapter=3, verse=16)
        segments = [TextSegment(text="For God so loved the world")]
        verse = VerseContent(reference=ref, verse_number=16, segments=segments)

        assert verse.reference == ref
        assert verse.verse_number == 16
        assert len(verse.segments) == 1
        assert verse.has_subheading is False
        assert verse.is_poetry is False
        assert verse.is_prose is False

    def test_plain_text_property(self):
        """Test plain_text property joins all segments."""
        ref = VerseReference(book_number=43, chapter=3, verse=16)
        segments = [
            TextSegment(text="For God"),
            TextSegment(text="so loved"),
            TextSegment(text="the world"),
        ]
        verse = VerseContent(reference=ref, verse_number=16, segments=segments)

        assert verse.plain_text == "For God so loved the world"

    def test_formatted_text_property(self):
        """Test formatted_text property with formatting markers."""
        ref = VerseReference(book_number=43, chapter=3, verse=16)
        segments = [
            TextSegment(text="Jesus said:", is_italic=True),
            TextSegment(text="I am the way", is_red_letter=True),
        ]
        verse = VerseContent(reference=ref, verse_number=16, segments=segments)

        formatted = verse.formatted_text
        assert "[Jesus said:]" in formatted
        assert '"I am the way"' in formatted

    def test_verse_with_subheading(self):
        """Test verse with subheading."""
        ref = VerseReference(book_number=43, chapter=3, verse=16)
        segments = [TextSegment(text="For God so loved the world")]
        verse = VerseContent(
            reference=ref,
            verse_number=16,
            segments=segments,
            has_subheading=True,
            subheading_text="God's Love for the World",
        )

        assert verse.has_subheading is True
        assert verse.subheading_text == "God's Love for the World"

    def test_poetry_verse(self):
        """Test poetry verse."""
        ref = VerseReference(book_number=19, chapter=23, verse=1)
        segments = [TextSegment(text="The LORD is my shepherd")]
        verse = VerseContent(
            reference=ref, verse_number=1, segments=segments, is_poetry=True
        )

        assert verse.is_poetry is True
        assert verse.is_prose is False


class TestPassage:
    """Test Passage model."""

    def test_single_verse_passage(self):
        """Test passage with single verse."""
        from_ref = VerseReference(book_number=43, chapter=3, verse=16)
        to_ref = VerseReference(book_number=43, chapter=3, verse=16)
        verse = VerseContent(
            reference=from_ref, verse_number=16, segments=[TextSegment(text="test")]
        )

        passage = Passage(
            from_ref=from_ref, to_ref=to_ref, title="John 3:16", verses=[verse]
        )

        assert passage.from_ref == from_ref
        assert passage.to_ref == to_ref
        assert passage.title == "John 3:16"
        assert len(passage.verses) == 1
        assert passage.is_single_verse is True
        assert passage.verse_count == 1

    def test_multi_verse_passage(self):
        """Test passage with multiple verses."""
        from_ref = VerseReference(book_number=43, chapter=3, verse=16)
        to_ref = VerseReference(book_number=43, chapter=3, verse=17)
        verse1 = VerseContent(
            reference=from_ref, verse_number=16, segments=[TextSegment(text="verse 16")]
        )
        verse2 = VerseContent(
            reference=to_ref, verse_number=17, segments=[TextSegment(text="verse 17")]
        )

        passage = Passage(
            from_ref=from_ref, to_ref=to_ref, title="John 3:16-17", verses=[verse1, verse2]
        )

        assert passage.is_single_verse is False
        assert passage.verse_count == 2

    def test_cross_chapter_passage(self):
        """Test passage spanning multiple chapters."""
        from_ref = VerseReference(book_number=43, chapter=3, verse=16)
        to_ref = VerseReference(book_number=43, chapter=4, verse=1)
        verse1 = VerseContent(
            reference=from_ref, verse_number=16, segments=[TextSegment(text="verse 16")]
        )

        passage = Passage(
            from_ref=from_ref, to_ref=to_ref, title="John 3:16-4:1", verses=[verse1]
        )

        assert passage.is_single_verse is False


class TestSearchResponse:
    """Test SearchResponse model."""

    def test_search_response_basic(self):
        """Test creating a search response."""
        from_ref = VerseReference(book_number=43, chapter=3, verse=16)
        to_ref = VerseReference(book_number=43, chapter=3, verse=16)
        verse = VerseContent(
            reference=from_ref, verse_number=16, segments=[TextSegment(text="test")]
        )
        passage = Passage(
            from_ref=from_ref, to_ref=to_ref, title="John 3:16", verses=[verse]
        )

        response = SearchResponse(
            query="John 3:16",
            match_count=0,
            passages=[passage],
            duration_ms=1,
            timestamp=1761310084039,
        )

        assert response.query == "John 3:16"
        assert response.match_count == 0
        assert response.passage_count == 1
        assert response.total_verses == 1
        assert response.duration_ms == 1

    def test_multiple_passages(self):
        """Test response with multiple passages."""
        ref1 = VerseReference(book_number=43, chapter=3, verse=16)
        ref2 = VerseReference(book_number=62, chapter=4, verse=8)
        verse1 = VerseContent(
            reference=ref1, verse_number=16, segments=[TextSegment(text="verse 1")]
        )
        verse2 = VerseContent(
            reference=ref2, verse_number=8, segments=[TextSegment(text="verse 2")]
        )
        passage1 = Passage(
            from_ref=ref1, to_ref=ref1, title="John 3:16", verses=[verse1]
        )
        passage2 = Passage(
            from_ref=ref2, to_ref=ref2, title="1 John 4:8", verses=[verse2]
        )

        response = SearchResponse(
            query="love",
            match_count=2,
            passages=[passage1, passage2],
            duration_ms=5,
            timestamp=1761310084039,
        )

        assert response.passage_count == 2
        assert response.total_verses == 2

    def test_frozen_model(self):
        """Test that SearchResponse is immutable."""
        from_ref = VerseReference(book_number=43, chapter=3, verse=16)
        verse = VerseContent(
            reference=from_ref, verse_number=16, segments=[TextSegment(text="test")]
        )
        passage = Passage(
            from_ref=from_ref, to_ref=from_ref, title="John 3:16", verses=[verse]
        )
        response = SearchResponse(
            query="test", match_count=0, passages=[passage], duration_ms=1, timestamp=123
        )

        with pytest.raises(ValidationError):
            response.query = "changed"
