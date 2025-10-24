"""LSBible API client."""

import platform
import re
import sys

import httpx

from .cache import ResponseCache
from .exceptions import APIError, BuildIDError
from .models import BookName, Passage, SearchResponse, VerseReference
from .parser import PassageParser
from .validators import BookValidator, ReferenceValidator


def _get_user_agent() -> str:
    """
    Build User-Agent string for SDK requests.

    Format: lsbible-python/VERSION (Python/X.Y.Z; PLATFORM; +https://github.com/kdcokenny/lsbible)

    Returns:
        User-Agent string
    """
    # Get SDK version
    try:
        from importlib.metadata import version

        sdk_version = version("lsbible")
    except Exception:
        sdk_version = "0.0.0"  # Fallback for development

    # Get Python version
    python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"

    # Get platform
    platform_name = platform.system()

    return f"lsbible-python/{sdk_version} (Python/{python_version}; {platform_name}; +https://github.com/kdcokenny/lsbible)"


class LSBibleClient:
    """
    Client for interacting with the LSBible API.

    Args:
        cache_ttl: Cache time-to-live in seconds (default: 3600)
        timeout: Request timeout in seconds (default: 30)
        build_id: Optional build ID (auto-detected if not provided)
        headers: Optional custom headers (merged with defaults)
    """

    BASE_URL = "https://read.lsbible.org"

    def __init__(
        self,
        cache_ttl: int = 3600,
        timeout: int = 30,
        build_id: str | None = None,
        headers: dict[str, str] | None = None,
    ):
        # Build default headers with User-Agent
        default_headers = {
            "User-Agent": _get_user_agent(),
            "Accept": "*/*",
        }

        # Merge with custom headers (custom headers take precedence)
        if headers:
            default_headers.update(headers)

        self._client = httpx.Client(timeout=timeout, headers=default_headers)
        self._cache = ResponseCache(ttl=cache_ttl)
        self._build_id = build_id
        self._build_id_fetched = build_id is not None

    def _get_build_id(self) -> str:
        """
        Get the Next.js build ID.

        Strategies:
        1. Use cached/provided build ID
        2. Extract from homepage HTML (__NEXT_DATA__ script)
        3. Try common/recent build ID patterns

        Returns:
            Build ID string

        Raises:
            BuildIDError: If build ID cannot be determined
        """
        if self._build_id and self._build_id_fetched:
            return self._build_id

        # Try to extract from homepage
        try:
            response = self._client.get(self.BASE_URL)
            response.raise_for_status()

            # Look for __NEXT_DATA__ script tag
            match = re.search(r'"buildId":"([^"]+)"', response.text)
            if match:
                self._build_id = match.group(1)
                self._build_id_fetched = True
                return self._build_id

            # Fallback: Try to find build ID in any script tag
            match = re.search(r"/_next/data/([^/]+)/", response.text)
            if match:
                self._build_id = match.group(1)
                self._build_id_fetched = True
                return self._build_id

        except Exception as e:
            raise BuildIDError(f"Failed to fetch build ID: {e}") from e

        raise BuildIDError("Could not determine build ID from homepage")

    def _make_request(self, query: str) -> dict:
        """
        Make a request to the LSBible API.

        Args:
            query: Search query or verse reference

        Returns:
            API response JSON

        Raises:
            APIError: If request fails
        """
        # Check cache first
        cache_key = f"query:{query}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        # Get build ID
        build_id = self._get_build_id()

        # Construct URL
        url = f"{self.BASE_URL}/_next/data/{build_id}/index.json"

        # Make request
        try:
            response = self._client.get(
                url,
                params={"q": query},
                headers={
                    "referer": f"{self.BASE_URL}/",
                    "x-nextjs-data": "1",
                },
            )
            response.raise_for_status()
            data = response.json()

            # Cache the response
            self._cache.set(cache_key, data)

            return data

        except httpx.HTTPStatusError as e:
            raise APIError(f"API request failed with status {e.response.status_code}: {e}") from e
        except Exception as e:
            raise APIError(f"API request failed: {e}") from e

    def _is_text_search(self, page_props: dict) -> bool:
        """
        Detect if response is from text search or Bible reference lookup.

        Text searches have:
        - initialItems array (search results)
        - totalCount, filteredCount
        - countsByBook, countsBySection

        Bible reference lookups have:
        - passages array (full passage HTML)
        - searchMatchCount (usually 0)
        """
        return "initialItems" in page_props and "totalCount" in page_props

    def _parse_search_results(self, page_props: dict, query: str) -> SearchResponse:
        """
        Parse text search results from initialItems format.

        Args:
            page_props: pageProps from API response
            query: Original search query

        Returns:
            SearchResponse with search metadata
        """
        passages = []

        # Parse each search result item
        for item in page_props.get("initialItems", []):
            # Parse the key (e.g., "43-003-016" -> John 3:16)
            key = item.get("key", "")
            parts = key.split("-")
            if len(parts) != 3:
                continue

            book_number = int(parts[0])
            chapter = int(parts[1])
            verse = int(parts[2])

            # Create verse reference
            verse_ref = VerseReference(book_number=book_number, chapter=chapter, verse=verse)

            # Parse HTML snippet to plain text
            html_snippet = item.get("html", "")
            plain_text = PassageParser.parse_search_result_html(html_snippet)

            # Create a minimal VerseContent (we don't have full formatting data)
            from .models import TextSegment, VerseContent

            verse_content = VerseContent(
                reference=verse_ref,
                verse_number=verse,
                segments=[TextSegment(text=plain_text)],
                has_subheading=False,
                subheading_text=None,
                is_poetry=False,
                is_prose=False,
                chapter_start=False,
            )

            # Create a single-verse passage
            passages.append(
                Passage(
                    from_ref=verse_ref,
                    to_ref=verse_ref,
                    title=str(verse_ref),
                    verses=[verse_content],
                )
            )

        # Extract metadata
        total_count = page_props.get("totalCount", 0)
        filtered_count = page_props.get("filteredCount", 0)
        counts_by_book = page_props.get("countsByBook", {})
        counts_by_section = page_props.get("countsBySection", {})

        # Convert string keys to int for consistency
        counts_by_book = {int(k): v for k, v in counts_by_book.items()} if counts_by_book else None
        counts_by_section = (
            {int(k): v for k, v in counts_by_section.items()} if counts_by_section else None
        )

        return SearchResponse(
            query=query,
            match_count=total_count,
            passages=passages,
            duration_ms=page_props.get("duration", 0),
            timestamp=page_props.get("start", 0),
            total_count=total_count,
            filtered_count=filtered_count,
            counts_by_book=counts_by_book,
            counts_by_section=counts_by_section,
        )

    def _parse_reference_results(self, page_props: dict, query: str) -> SearchResponse:
        """
        Parse Bible reference lookup results from passages format.

        Args:
            page_props: pageProps from API response
            query: Original query

        Returns:
            SearchResponse without search metadata
        """
        passages = []
        for passage_data in page_props.get("passages", []):
            from_data = passage_data["from"]
            to_data = passage_data["to"]

            from_ref = VerseReference(
                book_number=from_data["bn"],
                chapter=from_data["cn"],
                verse=from_data["vn"],
            )

            to_ref = VerseReference(
                book_number=to_data["bn"],
                chapter=to_data["cn"],
                verse=to_data["vn"],
            )

            # Parse HTML to get verse content
            passage_html = passage_data.get("passageHtml", "")
            verses = PassageParser.parse_passage_html(passage_html)

            passages.append(
                Passage(
                    from_ref=from_ref,
                    to_ref=to_ref,
                    title=passage_data.get("title", ""),
                    verses=verses,
                )
            )

        return SearchResponse(
            query=query,
            match_count=page_props.get("searchMatchCount", 0),
            passages=passages,
            duration_ms=page_props.get("duration", 0),
            timestamp=page_props.get("start", 0),
        )

    def _parse_response(self, data: dict, query: str) -> SearchResponse:
        """
        Parse API response into SearchResponse.

        Handles two response formats:
        1. Text search (initialItems format with rich metadata)
        2. Bible reference lookup (passages format with full HTML)

        Args:
            data: Raw API response
            query: Original query

        Returns:
            SearchResponse object
        """
        page_props = data.get("pageProps", {})

        if self._is_text_search(page_props):
            return self._parse_search_results(page_props, query)
        else:
            return self._parse_reference_results(page_props, query)

    def search(self, query: str) -> SearchResponse:
        """
        Search for passages containing text.

        Args:
            query: Search text (e.g., "love", "faith")

        Returns:
            SearchResponse with structured passage data

        Raises:
            APIError: If API request fails
        """
        data = self._make_request(query)
        return self._parse_response(data, query)

    def get_verse(self, book: BookName | str, chapter: int, verse: int) -> Passage:
        """
        Get a specific verse with validated parameters.

        Args:
            book: Book name as enum or string (e.g., BookName.JOHN or "John")
            chapter: Chapter number (validated against book)
            verse: Verse number (validated against chapter)

        Returns:
            Single Passage containing the verse

        Raises:
            InvalidReferenceError: If book/chapter/verse combination is invalid
            APIError: If API request fails

        Example:
            # Using enum (recommended - type-safe with autocomplete)
            passage = client.get_verse(BookName.JOHN, 3, 16)

            # Using string (validated at runtime)
            passage = client.get_verse("John", 3, 16)
        """
        # Validate reference
        ReferenceValidator.validate_reference(book, chapter, verse)

        # Construct query
        book_name = BookValidator.normalize_book_name(book)
        query = f"{book_name} {chapter}:{verse}"

        # Make request
        response = self.search(query)

        # Return first passage (should be only one for single verse)
        if not response.passages:
            raise APIError(f"No passage found for {query}")

        return response.passages[0]

    def get_passage(
        self,
        from_book: BookName | str,
        from_chapter: int,
        from_verse: int,
        to_book: BookName | str,
        to_chapter: int,
        to_verse: int,
    ) -> Passage:
        """
        Get a passage spanning multiple verses.

        Args:
            from_book: Starting book
            from_chapter: Starting chapter
            from_verse: Starting verse
            to_book: Ending book
            to_chapter: Ending chapter
            to_verse: Ending verse

        Returns:
            Passage containing all verses in range

        Raises:
            InvalidReferenceError: If any reference is invalid
            APIError: If API request fails

        Example:
            # Get John 3:16-18
            passage = client.get_passage(
                BookName.JOHN, 3, 16,
                BookName.JOHN, 3, 18
            )
        """
        # Validate references
        from_ref = ReferenceValidator.validate_reference(from_book, from_chapter, from_verse)
        to_ref = ReferenceValidator.validate_reference(to_book, to_chapter, to_verse)

        # Construct query
        from_book_name = BookValidator.normalize_book_name(from_book)
        to_book_name = BookValidator.normalize_book_name(to_book)

        if from_ref.book_number == to_ref.book_number:
            # Same book
            if from_chapter == to_chapter:
                # Same chapter
                query = f"{from_book_name} {from_chapter}:{from_verse}-{to_verse}"
            else:
                # Different chapters
                query = f"{from_book_name} {from_chapter}:{from_verse}-{to_chapter}:{to_verse}"
        else:
            # Different books
            query = f"{from_book_name} {from_chapter}:{from_verse}-{to_book_name} {to_chapter}:{to_verse}"

        # Make request
        response = self.search(query)

        # Return first passage
        if not response.passages:
            raise APIError(f"No passage found for {query}")

        return response.passages[0]

    def get_chapter(self, book: BookName | str, chapter: int) -> Passage:
        """
        Get an entire chapter.

        Args:
            book: Book name
            chapter: Chapter number

        Returns:
            Passage containing all verses in the chapter

        Example:
            # Get all of John chapter 3
            passage = client.get_chapter(BookName.JOHN, 3)
        """
        # Validate book and chapter exist
        book_number = BookValidator.get_book_number(book)
        from .books import BIBLE_STRUCTURE

        max_chapter = BIBLE_STRUCTURE[book_number]["chapters"]
        if chapter < 1 or chapter > max_chapter:
            book_name = BookValidator.normalize_book_name(book)
            raise APIError(
                f"{book_name} only has {max_chapter} chapters, "
                f"but chapter {chapter} was requested"
            )

        # Construct query
        book_name = BookValidator.normalize_book_name(book)
        query = f"{book_name} {chapter}"

        # Make request
        response = self.search(query)

        # Return first passage
        if not response.passages:
            raise APIError(f"No passage found for {query}")

        return response.passages[0]

    def clear_cache(self) -> None:
        """Clear the response cache."""
        self._cache.clear()

    def close(self) -> None:
        """Close the HTTP client."""
        self._client.close()

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()
