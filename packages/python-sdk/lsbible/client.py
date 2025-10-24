"""LSBible API client."""

import re

import httpx

from .cache import ResponseCache
from .exceptions import APIError, BuildIDError
from .models import BookName, Passage, SearchResponse, VerseReference
from .parser import PassageParser
from .validators import BookValidator, ReferenceValidator


class LSBibleClient:
    """
    Client for interacting with the LSBible API.

    Args:
        cache_ttl: Cache time-to-live in seconds (default: 3600)
        timeout: Request timeout in seconds (default: 30)
        build_id: Optional build ID (auto-detected if not provided)
    """

    BASE_URL = "https://read.lsbible.org"

    def __init__(self, cache_ttl: int = 3600, timeout: int = 30, build_id: str | None = None):
        self._client = httpx.Client(timeout=timeout)
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
                    "accept": "*/*",
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

    def _parse_response(self, data: dict, query: str) -> SearchResponse:
        """
        Parse API response into SearchResponse.

        Args:
            data: Raw API response
            query: Original query

        Returns:
            SearchResponse object
        """
        page_props = data.get("pageProps", {})

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
