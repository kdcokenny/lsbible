"""HTML parser for LSBible passages."""

from bs4 import BeautifulSoup, Tag

from .models import TextSegment, VerseContent, VerseReference


class PassageParser:
    """Parse HTML passages into structured VerseContent objects."""

    @staticmethod
    def parse_passage_html(html: str) -> list[VerseContent]:
        """
        Parse passageHtml into structured verse objects.

        Extracts:
        - Verse references from data-key attributes
        - Verse numbers from data-verse attributes
        - Text formatting (red-letter, italic, bold)
        - Subheadings and chapter markers
        - Poetry vs prose structure

        Args:
            html: The passageHtml string from API

        Returns:
            List of VerseContent objects
        """
        soup = BeautifulSoup(html, "lxml")
        verses = []

        for verse_span in soup.find_all("span", class_="verse"):
            verse = PassageParser._parse_verse(verse_span)
            verses.append(verse)

        return verses

    @staticmethod
    def _parse_verse(verse_span: Tag) -> VerseContent:
        """Parse a single verse span into VerseContent."""
        # Extract verse reference from data-key attribute
        data_key = verse_span.get("data-key")
        if not data_key:
            raise ValueError("Verse span missing data-key attribute")
        reference = PassageParser._parse_verse_reference(data_key)

        # Extract verse number
        verse_num_elem = verse_span.find("small", attrs={"data-verse": True})
        verse_number = int(verse_num_elem.get("data-verse", reference.verse))

        # Check for subheading
        has_subheading = False
        subheading_text = None
        subhead_elem = verse_span.find_previous_sibling("p", class_="subhead")
        if subhead_elem:
            has_subheading = True
            subheading_text = subhead_elem.get_text(strip=True)

        # Check for poetry vs prose
        is_poetry = verse_span.find_parent("p", class_="poetry") is not None
        is_prose = verse_span.find_parent("span", class_="prose") is not None

        # Check if chapter start
        chapter_start = verse_span.find("span", class_="chapter-number") is not None

        # Extract text segments
        segments = PassageParser._extract_segments(verse_span)

        return VerseContent(
            reference=reference,
            verse_number=verse_number,
            segments=segments,
            has_subheading=has_subheading,
            subheading_text=subheading_text,
            is_poetry=is_poetry,
            is_prose=is_prose,
            chapter_start=chapter_start,
        )

    @staticmethod
    def _parse_verse_reference(data_key: str) -> VerseReference:
        """
        Parse data-key attribute into VerseReference.
        Format: "43-003-016" (book-chapter-verse)
        """
        parts = data_key.split("-")
        if len(parts) != 3:
            raise ValueError(f"Invalid data-key format: {data_key}")

        book_number = int(parts[0])
        chapter = int(parts[1])
        verse = int(parts[2])

        return VerseReference(book_number=book_number, chapter=chapter, verse=verse)

    @staticmethod
    def _extract_segments(element: Tag) -> list[TextSegment]:
        """Extract text segments with formatting metadata."""
        segments = []

        # Remove verse number element to avoid including it in text
        for small_elem in element.find_all("small", attrs={"data-verse": True}):
            small_elem.decompose()

        # Remove chapter number elements
        for chapter_elem in element.find_all("span", class_="chapter-number"):
            chapter_elem.decompose()

        # Process remaining text and formatting
        for content in element.descendants:
            if isinstance(content, str):
                text = content.strip()
                if not text:
                    continue

                # Determine formatting based on parent elements
                is_red_letter = False
                is_italic = False
                is_bold = False
                is_small_caps = False

                parent = content.parent
                while parent and parent != element:
                    if isinstance(parent, Tag):
                        classes = parent.get("class") or []
                        if "red-letter" in classes:
                            is_red_letter = True
                        if parent.name == "i" or "italic" in classes:
                            is_italic = True
                        if parent.name == "b" or "bold" in classes:
                            is_bold = True
                        if "small-caps" in classes:
                            is_small_caps = True
                    parent = parent.parent

                segments.append(
                    TextSegment(
                        text=text,
                        is_red_letter=is_red_letter,
                        is_italic=is_italic,
                        is_bold=is_bold,
                        is_small_caps=is_small_caps,
                    )
                )

        return segments
