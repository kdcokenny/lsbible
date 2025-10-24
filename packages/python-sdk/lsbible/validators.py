"""Validators for Bible references."""

import re

from .books import BIBLE_STRUCTURE, BOOK_NUMBERS
from .exceptions import InvalidReferenceError
from .models import BookName, VerseReference


class BookValidator:
    """Validate and normalize book names."""

    @staticmethod
    def normalize_book_name(book: BookName | str) -> str:
        """
        Normalize book name for API calls.

        Args:
            book: BookName enum or string

        Returns:
            Normalized book name string

        Raises:
            InvalidReferenceError: If book name is invalid

        Example:
            normalize_book_name(BookName.JOHN)  # "John"
            normalize_book_name("john")         # "John"
            normalize_book_name("1 john")       # "1 John"
        """
        if isinstance(book, BookName):
            return book.value

        # Normalize string input
        book_str = book.strip()
        book_lower = book_str.lower()

        # Try direct lookup
        if book_lower in BOOK_NUMBERS:
            book_num = BOOK_NUMBERS[book_lower]
            return BIBLE_STRUCTURE[book_num]["name"]

        # Try fuzzy matching (handle "1John" vs "1 John", "1john" vs "1 John")
        normalized = " ".join(book_lower.split())
        if normalized in BOOK_NUMBERS:
            book_num = BOOK_NUMBERS[normalized]
            return BIBLE_STRUCTURE[book_num]["name"]

        # Try adding space after leading digit (e.g., "1john" -> "1 john")
        if re.match(r"^\d", book_lower):
            spaced = re.sub(r"^(\d+)([a-z])", r"\1 \2", book_lower)
            if spaced in BOOK_NUMBERS:
                book_num = BOOK_NUMBERS[spaced]
                return BIBLE_STRUCTURE[book_num]["name"]

        raise InvalidReferenceError(f"Unknown book: {book}")

    @staticmethod
    def get_book_number(book: BookName | str) -> int:
        """
        Get book number from book name.

        Args:
            book: BookName enum or string

        Returns:
            Book number (1-66)
        """
        normalized = BookValidator.normalize_book_name(book)
        return BOOK_NUMBERS[normalized.lower()]


class ReferenceValidator:
    """Validate Bible references."""

    @staticmethod
    def validate_reference(book: BookName | str, chapter: int, verse: int) -> VerseReference:
        """
        Validate and create a VerseReference.

        Args:
            book: Book name
            chapter: Chapter number
            verse: Verse number

        Returns:
            Validated VerseReference object

        Raises:
            InvalidReferenceError: If reference is invalid
        """
        book_number = BookValidator.get_book_number(book)

        # Create VerseReference (Pydantic validates chapter/verse)
        try:
            return VerseReference(book_number=book_number, chapter=chapter, verse=verse)
        except ValueError as e:
            raise InvalidReferenceError(str(e)) from e
