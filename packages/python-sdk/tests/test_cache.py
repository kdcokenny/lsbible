"""Tests for response cache."""

import time
from unittest.mock import patch

import pytest

from lsbible.cache import ResponseCache


class TestResponseCache:
    """Test ResponseCache class."""

    def test_cache_set_and_get(self):
        """Test setting and getting values."""
        cache = ResponseCache(ttl=60)
        cache.set("key1", "value1")

        result = cache.get("key1")
        assert result == "value1"

    def test_cache_miss_returns_none(self):
        """Test that cache miss returns None."""
        cache = ResponseCache(ttl=60)
        result = cache.get("nonexistent")
        assert result is None

    def test_cache_stores_different_types(self):
        """Test that cache can store different types."""
        cache = ResponseCache(ttl=60)

        cache.set("string", "value")
        cache.set("number", 123)
        cache.set("list", [1, 2, 3])
        cache.set("dict", {"key": "value"})

        assert cache.get("string") == "value"
        assert cache.get("number") == 123
        assert cache.get("list") == [1, 2, 3]
        assert cache.get("dict") == {"key": "value"}

    def test_cache_overwrites_existing_key(self):
        """Test that setting an existing key overwrites it."""
        cache = ResponseCache(ttl=60)

        cache.set("key", "value1")
        assert cache.get("key") == "value1"

        cache.set("key", "value2")
        assert cache.get("key") == "value2"

    def test_cache_clear(self):
        """Test clearing the cache."""
        cache = ResponseCache(ttl=60)

        cache.set("key1", "value1")
        cache.set("key2", "value2")
        assert len(cache) == 2

        cache.clear()
        assert len(cache) == 0
        assert cache.get("key1") is None
        assert cache.get("key2") is None

    def test_cache_ttl_expiration(self):
        """Test that cache entries expire after TTL."""
        cache = ResponseCache(ttl=1)  # 1 second TTL

        # Mock time to control expiration
        with patch("time.time") as mock_time:
            # Set value at time 0
            mock_time.return_value = 0
            cache.set("key", "value")

            # Get value immediately (before expiration)
            mock_time.return_value = 0.5
            assert cache.get("key") == "value"

            # Get value after expiration (1.5 seconds later)
            mock_time.return_value = 1.5
            assert cache.get("key") is None

    def test_cache_expired_entry_is_removed(self):
        """Test that expired entries are removed from cache."""
        cache = ResponseCache(ttl=1)

        with patch("time.time") as mock_time:
            mock_time.return_value = 0
            cache.set("key", "value")
            assert len(cache) == 1

            # After expiration, getting the key should remove it
            mock_time.return_value = 2
            assert cache.get("key") is None
            assert len(cache) == 0

    def test_cache_multiple_entries_with_different_ttls(self):
        """Test multiple entries with independent expiration."""
        cache = ResponseCache(ttl=2)

        with patch("time.time") as mock_time:
            # Set first entry at time 0
            mock_time.return_value = 0
            cache.set("key1", "value1")

            # Set second entry at time 1
            mock_time.return_value = 1
            cache.set("key2", "value2")

            # At time 1.5, both should be available
            mock_time.return_value = 1.5
            assert cache.get("key1") == "value1"
            assert cache.get("key2") == "value2"

            # At time 2.5, key1 should be expired, key2 should still be available
            mock_time.return_value = 2.5
            assert cache.get("key1") is None
            assert cache.get("key2") == "value2"

            # At time 3.5, both should be expired
            mock_time.return_value = 3.5
            assert cache.get("key2") is None

    def test_cache_len(self):
        """Test cache length tracking."""
        cache = ResponseCache(ttl=60)

        assert len(cache) == 0

        cache.set("key1", "value1")
        assert len(cache) == 1

        cache.set("key2", "value2")
        assert len(cache) == 2

        cache.get("key1")  # Should not affect length
        assert len(cache) == 2

        cache.clear()
        assert len(cache) == 0

    def test_cache_default_ttl(self):
        """Test default TTL of 3600 seconds."""
        cache = ResponseCache()  # Default TTL

        with patch("time.time") as mock_time:
            mock_time.return_value = 0
            cache.set("key", "value")

            # Should still be available after 3599 seconds
            mock_time.return_value = 3599
            assert cache.get("key") == "value"

            # Should be expired after 3601 seconds
            mock_time.return_value = 3601
            assert cache.get("key") is None

    def test_cache_zero_ttl(self):
        """Test cache with zero TTL expires immediately."""
        cache = ResponseCache(ttl=0)

        with patch("time.time") as mock_time:
            mock_time.return_value = 0
            cache.set("key", "value")

            # Should be expired immediately
            mock_time.return_value = 0.001
            assert cache.get("key") is None
