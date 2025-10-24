"""Tests for LSBible API client."""

import pytest
import respx
from httpx import Response

from lsbible.client import LSBibleClient
from lsbible.exceptions import APIError, BuildIDError, InvalidReferenceError
from lsbible.models import BookName


class TestLSBibleClient:
    """Test LSBibleClient class."""

    @respx.mock
    def test_get_build_id_from_homepage(self, sample_homepage_html):
        """Test extracting build ID from homepage."""
        # Mock homepage request
        respx.get("https://read.lsbible.org").mock(
            return_value=Response(200, text=sample_homepage_html)
        )

        client = LSBibleClient()
        build_id = client._get_build_id()

        assert build_id == "test-build-id-123"

    @respx.mock
    def test_get_build_id_caching(self, sample_homepage_html):
        """Test that build ID is cached after first fetch."""
        respx.get("https://read.lsbible.org").mock(
            return_value=Response(200, text=sample_homepage_html)
        )

        client = LSBibleClient()
        build_id1 = client._get_build_id()
        build_id2 = client._get_build_id()

        assert build_id1 == build_id2
        # Should only make one request (cached after first)
        assert respx.calls.call_count == 1

    @respx.mock
    def test_get_build_id_with_provided_id(self, sample_homepage_html):
        """Test that provided build ID is used without fetching."""
        client = LSBibleClient(build_id="provided-build-id")
        build_id = client._get_build_id()

        assert build_id == "provided-build-id"
        # Should not make any HTTP requests
        assert respx.calls.call_count == 0

    @respx.mock
    def test_get_build_id_failure(self):
        """Test that BuildIDError is raised when build ID cannot be found."""
        respx.get("https://read.lsbible.org").mock(
            return_value=Response(200, text="<html>No build ID here</html>")
        )

        client = LSBibleClient()
        with pytest.raises(BuildIDError, match="Could not determine build ID"):
            client._get_build_id()

    @respx.mock
    def test_search(self, sample_homepage_html, sample_api_response):
        """Test search method."""
        # Mock homepage and API requests
        respx.get("https://read.lsbible.org/").mock(
            return_value=Response(200, text=sample_homepage_html)
        )
        respx.route(
            method="GET",
            url__regex=r"https://read\.lsbible\.org/_next/data/test-build-id-123/index\.json.*",
        ).mock(return_value=Response(200, json=sample_api_response))

        client = LSBibleClient()
        response = client.search("John 3:16")

        assert response.query == "John 3:16"
        assert len(response.passages) == 1
        assert response.passages[0].title == "John 3:16"

    @respx.mock
    def test_get_verse(self, sample_homepage_html, sample_api_response):
        """Test get_verse method."""
        respx.get("https://read.lsbible.org/").mock(
            return_value=Response(200, text=sample_homepage_html)
        )
        respx.route(
            method="GET",
            url__regex=r"https://read\.lsbible\.org/_next/data/test-build-id-123/index\.json.*",
        ).mock(return_value=Response(200, json=sample_api_response))

        client = LSBibleClient()
        passage = client.get_verse(BookName.JOHN, 3, 16)

        assert passage.title == "John 3:16"
        assert passage.from_ref.book_number == 43
        assert passage.from_ref.chapter == 3
        assert passage.from_ref.verse == 16
        assert passage.is_single_verse is True

    @respx.mock
    def test_get_verse_with_string(self, sample_homepage_html, sample_api_response):
        """Test get_verse with string book name."""
        respx.get("https://read.lsbible.org/").mock(
            return_value=Response(200, text=sample_homepage_html)
        )
        respx.route(
            method="GET",
            url__regex=r"https://read\.lsbible\.org/_next/data/test-build-id-123/index\.json.*",
        ).mock(return_value=Response(200, json=sample_api_response))

        client = LSBibleClient()
        passage = client.get_verse("John", 3, 16)

        assert passage.from_ref.book_number == 43

    def test_get_verse_validates_reference(self):
        """Test that get_verse validates references."""
        client = LSBibleClient()

        # Invalid chapter
        with pytest.raises(InvalidReferenceError, match="only has 21 chapters"):
            client.get_verse(BookName.JOHN, 99, 1)

        # Invalid verse
        with pytest.raises(InvalidReferenceError, match="only has 36 verses"):
            client.get_verse(BookName.JOHN, 3, 999)

    @respx.mock
    def test_get_passage(
        self, sample_homepage_html, sample_multi_verse_response
    ):
        """Test get_passage method for verse ranges."""
        respx.get("https://read.lsbible.org/").mock(
            return_value=Response(200, text=sample_homepage_html)
        )
        respx.route(
            method="GET",
            url__regex=r"https://read\.lsbible\.org/_next/data/test-build-id-123/index\.json.*",
        ).mock(return_value=Response(200, json=sample_multi_verse_response))

        client = LSBibleClient()
        passage = client.get_passage(
            BookName.JOHN, 3, 16, BookName.JOHN, 3, 17
        )

        assert passage.from_ref.verse == 16
        assert passage.to_ref.verse == 17
        assert passage.is_single_verse is False
        assert passage.verse_count == 2

    @respx.mock
    def test_get_chapter(self, sample_homepage_html, sample_api_response):
        """Test get_chapter method."""
        respx.get("https://read.lsbible.org/").mock(
            return_value=Response(200, text=sample_homepage_html)
        )
        respx.route(
            method="GET",
            url__regex=r"https://read\.lsbible\.org/_next/data/test-build-id-123/index\.json.*",
        ).mock(return_value=Response(200, json=sample_api_response))

        client = LSBibleClient()
        passage = client.get_chapter(BookName.JOHN, 3)

        assert passage.from_ref.chapter == 3

    def test_get_chapter_validates_chapter(self):
        """Test that get_chapter validates chapter exists."""
        client = LSBibleClient()

        # John only has 21 chapters
        with pytest.raises(APIError, match="only has 21 chapters"):
            client.get_chapter(BookName.JOHN, 99)

    @respx.mock
    def test_cache_integration(self, sample_homepage_html, sample_api_response):
        """Test that responses are cached."""
        respx.get("https://read.lsbible.org/").mock(
            return_value=Response(200, text=sample_homepage_html)
        )
        api_mock = respx.route(
            method="GET",
            url__regex=r"https://read\.lsbible\.org/_next/data/test-build-id-123/index\.json.*",
        ).mock(return_value=Response(200, json=sample_api_response))

        client = LSBibleClient()

        # First request
        response1 = client.search("John 3:16")
        api_call_count_1 = api_mock.call_count

        # Second request (should be cached)
        response2 = client.search("John 3:16")
        api_call_count_2 = api_mock.call_count

        # Verify responses are the same
        assert response1.query == response2.query
        # API should only be called once (second was cached)
        assert api_call_count_1 == 1
        assert api_call_count_2 == 1

    @respx.mock
    def test_clear_cache(self, sample_homepage_html, sample_api_response):
        """Test clearing the cache."""
        respx.get("https://read.lsbible.org/").mock(
            return_value=Response(200, text=sample_homepage_html)
        )
        api_mock = respx.route(
            method="GET",
            url__regex=r"https://read\.lsbible\.org/_next/data/test-build-id-123/index\.json.*",
        ).mock(return_value=Response(200, json=sample_api_response))

        client = LSBibleClient()

        # First request
        client.search("John 3:16")
        assert api_mock.call_count == 1

        # Clear cache
        client.clear_cache()

        # Second request (should not be cached)
        client.search("John 3:16")
        assert api_mock.call_count == 2

    @respx.mock
    def test_api_error_handling(self, sample_homepage_html):
        """Test API error handling."""
        respx.get("https://read.lsbible.org/").mock(
            return_value=Response(200, text=sample_homepage_html)
        )
        respx.route(
            method="GET",
            url__regex=r"https://read\.lsbible\.org/_next/data/test-build-id-123/index\.json.*",
        ).mock(return_value=Response(500, text="Server error"))

        client = LSBibleClient()
        with pytest.raises(APIError, match="API request failed with status 500"):
            client.search("test")

    @respx.mock
    def test_context_manager(self, sample_homepage_html, sample_api_response):
        """Test using client as context manager."""
        respx.get("https://read.lsbible.org/").mock(
            return_value=Response(200, text=sample_homepage_html)
        )
        respx.route(
            method="GET",
            url__regex=r"https://read\.lsbible\.org/_next/data/test-build-id-123/index\.json.*",
        ).mock(return_value=Response(200, json=sample_api_response))

        with LSBibleClient() as client:
            passage = client.get_verse(BookName.JOHN, 3, 16)
            assert passage.title == "John 3:16"

        # Client should be closed after exiting context

    def test_client_initialization(self):
        """Test client initialization with custom parameters."""
        client = LSBibleClient(cache_ttl=7200, timeout=60, build_id="custom-id")

        assert client._cache._ttl == 7200
        assert client._build_id == "custom-id"

    @respx.mock
    def test_api_request_headers(self, sample_homepage_html, sample_api_response):
        """Test that API requests include correct headers."""
        respx.get("https://read.lsbible.org/").mock(
            return_value=Response(200, text=sample_homepage_html)
        )
        api_mock = respx.route(
            method="GET",
            url__regex=r"https://read\.lsbible\.org/_next/data/test-build-id-123/index\.json.*",
        ).mock(return_value=Response(200, json=sample_api_response))

        client = LSBibleClient()
        client.search("test")

        # Verify headers were sent
        request = api_mock.calls.last.request
        assert request.headers.get("accept") == "*/*"
        assert request.headers.get("referer") == "https://read.lsbible.org/"
        assert request.headers.get("x-nextjs-data") == "1"

    @respx.mock
    def test_no_passages_raises_error(self, sample_homepage_html):
        """Test that no passages in response raises APIError."""
        respx.get("https://read.lsbible.org/").mock(
            return_value=Response(200, text=sample_homepage_html)
        )
        respx.route(
            method="GET",
            url__regex=r"https://read\.lsbible\.org/_next/data/test-build-id-123/index\.json.*",
        ).mock(
            return_value=Response(
                200,
                json={
                    "pageProps": {
                        "counter": 0,
                        "q": "nonexistent",
                        "searchMatchCount": 0,
                        "passages": [],
                        "start": 123,
                        "duration": 1,
                    }
                },
            )
        )

        client = LSBibleClient()
        with pytest.raises(APIError, match="No passage found"):
            client.get_verse(BookName.JOHN, 3, 16)
