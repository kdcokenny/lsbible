"""Tests for validators."""

import pytest

from lsbible.exceptions import InvalidReferenceError
from lsbible.models import BookName, VerseReference
from lsbible.validators import BookValidator, ReferenceValidator


class TestBookValidator:
    """Test BookValidator class."""

    def test_normalize_book_name_with_enum(self):
        """Test normalizing with BookName enum."""
        result = BookValidator.normalize_book_name(BookName.JOHN)
        assert result == "John"

    def test_normalize_book_name_exact_string(self):
        """Test normalizing with exact string match."""
        result = BookValidator.normalize_book_name("John")
        assert result == "John"

    def test_normalize_book_name_lowercase(self):
        """Test normalizing lowercase string."""
        result = BookValidator.normalize_book_name("john")
        assert result == "John"

    def test_normalize_book_name_uppercase(self):
        """Test normalizing uppercase string."""
        result = BookValidator.normalize_book_name("JOHN")
        assert result == "John"

    def test_normalize_book_name_fuzzy_matching(self):
        """Test fuzzy matching for books with numbers."""
        # Missing space between number and name
        result = BookValidator.normalize_book_name("1john")
        assert result == "1 John"

        result = BookValidator.normalize_book_name("2kings")
        assert result == "2 Kings"

    def test_normalize_book_name_with_spaces(self):
        """Test books with spaces in names."""
        result = BookValidator.normalize_book_name("1 Samuel")
        assert result == "1 Samuel"

        result = BookValidator.normalize_book_name("song of solomon")
        assert result == "Song of Solomon"

    def test_normalize_book_name_invalid(self):
        """Test that invalid book names raise error."""
        with pytest.raises(InvalidReferenceError, match="Unknown book"):
            BookValidator.normalize_book_name("NotABook")

        with pytest.raises(InvalidReferenceError, match="Unknown book"):
            BookValidator.normalize_book_name("")

    @pytest.mark.parametrize(
        "input_name,expected",
        [
            (BookName.GENESIS, "Genesis"),
            ("Genesis", "Genesis"),
            ("genesis", "Genesis"),
            ("GENESIS", "Genesis"),
            (BookName.REVELATION, "Revelation"),
            ("revelation", "Revelation"),
            (BookName.SAMUEL_1, "1 Samuel"),
            ("1 samuel", "1 Samuel"),
            ("1samuel", "1 Samuel"),
        ],
    )
    def test_normalize_various_inputs(self, input_name, expected):
        """Test normalizing various inputs."""
        result = BookValidator.normalize_book_name(input_name)
        assert result == expected

    def test_get_book_number_with_enum(self):
        """Test getting book number from enum."""
        result = BookValidator.get_book_number(BookName.JOHN)
        assert result == 43

    def test_get_book_number_with_string(self):
        """Test getting book number from string."""
        result = BookValidator.get_book_number("John")
        assert result == 43

        result = BookValidator.get_book_number("genesis")
        assert result == 1

        result = BookValidator.get_book_number("Revelation")
        assert result == 66

    @pytest.mark.parametrize(
        "book,expected_number",
        [
            (BookName.GENESIS, 1),
            ("Genesis", 1),
            (BookName.JOHN, 43),
            ("john", 43),
            (BookName.REVELATION, 66),
            ("Revelation", 66),
            ("1 samuel", 9),
            ("2 chronicles", 14),
        ],
    )
    def test_get_book_number_various(self, book, expected_number):
        """Test getting book number for various books."""
        result = BookValidator.get_book_number(book)
        assert result == expected_number


class TestReferenceValidator:
    """Test ReferenceValidator class."""

    def test_validate_valid_reference(self):
        """Test validating a valid reference."""
        result = ReferenceValidator.validate_reference(BookName.JOHN, 3, 16)
        assert isinstance(result, VerseReference)
        assert result.book_number == 43
        assert result.chapter == 3
        assert result.verse == 16

    def test_validate_reference_with_string(self):
        """Test validating reference with string book name."""
        result = ReferenceValidator.validate_reference("John", 3, 16)
        assert isinstance(result, VerseReference)
        assert result.book_number == 43

    def test_validate_reference_invalid_book(self):
        """Test that invalid book raises error."""
        with pytest.raises(InvalidReferenceError, match="Unknown book"):
            ReferenceValidator.validate_reference("NotABook", 1, 1)

    def test_validate_reference_invalid_chapter(self):
        """Test that invalid chapter raises error."""
        # John only has 21 chapters
        with pytest.raises(InvalidReferenceError, match="only has 21 chapters"):
            ReferenceValidator.validate_reference(BookName.JOHN, 99, 1)

    def test_validate_reference_invalid_verse(self):
        """Test that invalid verse raises error."""
        # John 3 only has 36 verses
        with pytest.raises(InvalidReferenceError, match="only has 36 verses"):
            ReferenceValidator.validate_reference(BookName.JOHN, 3, 999)

    @pytest.mark.parametrize(
        "book,chapter,verse",
        [
            (BookName.GENESIS, 1, 1),
            ("Genesis", 50, 26),  # Last verse of Genesis
            (BookName.PSALMS, 23, 1),
            ("psalms", 119, 176),  # Longest chapter
            (BookName.JOHN, 3, 16),
            ("john", 21, 25),  # Last verse of John
            (BookName.REVELATION, 22, 21),  # Last verse of Bible
        ],
    )
    def test_validate_various_valid_references(self, book, chapter, verse):
        """Test validating various valid references."""
        result = ReferenceValidator.validate_reference(book, chapter, verse)
        assert isinstance(result, VerseReference)
        assert result.chapter == chapter
        assert result.verse == verse

    def test_edge_case_obadiah(self):
        """Test Obadiah which has only 1 chapter."""
        result = ReferenceValidator.validate_reference(BookName.OBADIAH, 1, 21)
        assert result.book_number == 31
        assert result.chapter == 1

        # Obadiah only has 1 chapter
        with pytest.raises(InvalidReferenceError, match="only has 1 chapter"):
            ReferenceValidator.validate_reference(BookName.OBADIAH, 2, 1)

    def test_edge_case_psalm_119(self):
        """Test Psalm 119, the longest chapter."""
        # Psalm 119 has 176 verses
        result = ReferenceValidator.validate_reference(BookName.PSALMS, 119, 176)
        assert result.verse == 176

        # Verse 177 doesn't exist
        with pytest.raises(InvalidReferenceError, match="only has 176 verses"):
            ReferenceValidator.validate_reference(BookName.PSALMS, 119, 177)

    def test_edge_case_philemon(self):
        """Test Philemon which has only 1 chapter with 25 verses."""
        result = ReferenceValidator.validate_reference(BookName.PHILEMON, 1, 25)
        assert result.book_number == 57

        # Only 25 verses
        with pytest.raises(InvalidReferenceError, match="only has 25 verses"):
            ReferenceValidator.validate_reference(BookName.PHILEMON, 1, 26)
