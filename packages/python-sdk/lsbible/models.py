"""Pydantic models for LSBible SDK."""

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, model_validator


class BookName(str, Enum):
    """Enumeration of all 66 Bible books for type-safe API calls."""

    # Old Testament
    GENESIS = "Genesis"
    EXODUS = "Exodus"
    LEVITICUS = "Leviticus"
    NUMBERS = "Numbers"
    DEUTERONOMY = "Deuteronomy"
    JOSHUA = "Joshua"
    JUDGES = "Judges"
    RUTH = "Ruth"
    SAMUEL_1 = "1 Samuel"
    SAMUEL_2 = "2 Samuel"
    KINGS_1 = "1 Kings"
    KINGS_2 = "2 Kings"
    CHRONICLES_1 = "1 Chronicles"
    CHRONICLES_2 = "2 Chronicles"
    EZRA = "Ezra"
    NEHEMIAH = "Nehemiah"
    ESTHER = "Esther"
    JOB = "Job"
    PSALMS = "Psalms"
    PROVERBS = "Proverbs"
    ECCLESIASTES = "Ecclesiastes"
    SONG_OF_SOLOMON = "Song of Solomon"
    ISAIAH = "Isaiah"
    JEREMIAH = "Jeremiah"
    LAMENTATIONS = "Lamentations"
    EZEKIEL = "Ezekiel"
    DANIEL = "Daniel"
    HOSEA = "Hosea"
    JOEL = "Joel"
    AMOS = "Amos"
    OBADIAH = "Obadiah"
    JONAH = "Jonah"
    MICAH = "Micah"
    NAHUM = "Nahum"
    HABAKKUK = "Habakkuk"
    ZEPHANIAH = "Zephaniah"
    HAGGAI = "Haggai"
    ZECHARIAH = "Zechariah"
    MALACHI = "Malachi"
    # New Testament
    MATTHEW = "Matthew"
    MARK = "Mark"
    LUKE = "Luke"
    JOHN = "John"
    ACTS = "Acts"
    ROMANS = "Romans"
    CORINTHIANS_1 = "1 Corinthians"
    CORINTHIANS_2 = "2 Corinthians"
    GALATIANS = "Galatians"
    EPHESIANS = "Ephesians"
    PHILIPPIANS = "Philippians"
    COLOSSIANS = "Colossians"
    THESSALONIANS_1 = "1 Thessalonians"
    THESSALONIANS_2 = "2 Thessalonians"
    TIMOTHY_1 = "1 Timothy"
    TIMOTHY_2 = "2 Timothy"
    TITUS = "Titus"
    PHILEMON = "Philemon"
    HEBREWS = "Hebrews"
    JAMES = "James"
    PETER_1 = "1 Peter"
    PETER_2 = "2 Peter"
    JOHN_1 = "1 John"
    JOHN_2 = "2 John"
    JOHN_3 = "3 John"
    JUDE = "Jude"
    REVELATION = "Revelation"


class Testament(str, Enum):
    """Enumeration of Bible testaments."""

    OLD_TESTAMENT = "OT"
    NEW_TESTAMENT = "NT"


class VerseReference(BaseModel):
    """
    A reference to a specific verse in the Bible.

    Validates that:
    - Book number is 1-66
    - Chapter exists in the book
    - Verse exists in the chapter
    """

    model_config = ConfigDict(frozen=True)

    book_number: int = Field(ge=1, le=66, description="Book number (1-66)")
    chapter: int = Field(ge=1, description="Chapter number")
    verse: int = Field(ge=1, description="Verse number")

    @property
    def book_name(self) -> BookName:
        """Get the book name from the book number."""
        from .books import BOOK_NAMES

        return BookName(BOOK_NAMES[self.book_number])

    @model_validator(mode="after")
    def validate_chapter_and_verse(self):
        """Validate chapter and verse exist in the book."""
        from .books import BIBLE_STRUCTURE

        max_chapter = BIBLE_STRUCTURE[self.book_number]["chapters"]
        if self.chapter > max_chapter:
            raise ValueError(
                f"{self.book_name.value} only has {max_chapter} chapters, "
                f"but chapter {self.chapter} was requested"
            )

        max_verse = BIBLE_STRUCTURE[self.book_number]["verses"][self.chapter - 1]
        if self.verse > max_verse:
            raise ValueError(
                f"{self.book_name.value} {self.chapter} only has {max_verse} verses, "
                f"but verse {self.verse} was requested"
            )
        return self

    def __str__(self) -> str:
        return f"{self.book_name.value} {self.chapter}:{self.verse}"


class TextSegment(BaseModel):
    """A segment of text with formatting metadata."""

    model_config = ConfigDict(frozen=True)

    text: str
    is_red_letter: bool = False  # Words of Jesus in red
    is_italic: bool = False  # Italicized text (clarifications)
    is_bold: bool = False  # Bold text
    is_small_caps: bool = False  # LORD (Yahweh) in small caps


class VerseContent(BaseModel):
    """Complete structured content of a single verse."""

    model_config = ConfigDict(frozen=True)

    reference: VerseReference
    verse_number: int = Field(ge=1)
    segments: list[TextSegment]
    has_subheading: bool = False
    subheading_text: str | None = None
    is_poetry: bool = False
    is_prose: bool = False
    chapter_start: bool = False  # First verse of chapter

    @property
    def plain_text(self) -> str:
        """Get plain text without formatting."""
        return " ".join(seg.text for seg in self.segments)

    @property
    def formatted_text(self) -> str:
        """Get text with simple formatting markers."""
        parts = []
        for seg in self.segments:
            text = seg.text
            if seg.is_italic:
                text = f"[{text}]"
            if seg.is_red_letter:
                text = f'"{text}"'
            parts.append(text)
        return " ".join(parts)


class Passage(BaseModel):
    """A passage containing one or more verses."""

    model_config = ConfigDict(frozen=True)

    from_ref: VerseReference
    to_ref: VerseReference
    title: str
    verses: list[VerseContent]

    @property
    def is_single_verse(self) -> bool:
        """Check if this passage is a single verse."""
        return (
            self.from_ref.book_number == self.to_ref.book_number
            and self.from_ref.chapter == self.to_ref.chapter
            and self.from_ref.verse == self.to_ref.verse
        )

    @property
    def verse_count(self) -> int:
        """Get the number of verses in this passage."""
        return len(self.verses)


class SearchResponse(BaseModel):
    """Response from a search or verse lookup."""

    model_config = ConfigDict(frozen=True)

    query: str
    match_count: int = Field(ge=0)
    passages: list[Passage]
    duration_ms: int = Field(ge=0, description="Query duration in milliseconds")
    timestamp: int = Field(description="Unix timestamp in milliseconds")

    @property
    def passage_count(self) -> int:
        """Get the number of passages returned."""
        return len(self.passages)

    @property
    def total_verses(self) -> int:
        """Get total number of verses across all passages."""
        return sum(p.verse_count for p in self.passages)
