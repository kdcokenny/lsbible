"""Tests for MemoryCacheProvider."""

from unittest.mock import patch

import pytest

from lsbible.cache import MemoryCacheProvider


class TestMemoryCacheProvider:
    """Test MemoryCacheProvider class."""

    @pytest.mark.asyncio
    async def test_cache_set_and_get(self):
        """Test setting and getting values."""
        cache = MemoryCacheProvider()
        await cache.set("key1", "value1", ttl=60)

        result = await cache.get("key1")
        assert result == "value1"

    @pytest.mark.asyncio
    async def test_cache_miss_returns_none(self):
        """Test that cache miss returns None."""
        cache = MemoryCacheProvider()
        result = await cache.get("nonexistent")
        assert result is None

    @pytest.mark.asyncio
    async def test_cache_stores_different_types(self):
        """Test that cache can store different types."""
        cache = MemoryCacheProvider()

        await cache.set("string", "value", ttl=60)
        await cache.set("number", 123, ttl=60)
        await cache.set("list", [1, 2, 3], ttl=60)
        await cache.set("dict", {"key": "value"}, ttl=60)

        assert await cache.get("string") == "value"
        assert await cache.get("number") == 123
        assert await cache.get("list") == [1, 2, 3]
        assert await cache.get("dict") == {"key": "value"}

    @pytest.mark.asyncio
    async def test_cache_overwrites_existing_key(self):
        """Test that setting an existing key overwrites it."""
        cache = MemoryCacheProvider()

        await cache.set("key", "value1", ttl=60)
        assert await cache.get("key") == "value1"

        await cache.set("key", "value2", ttl=60)
        assert await cache.get("key") == "value2"

    @pytest.mark.asyncio
    async def test_cache_clear(self):
        """Test clearing the cache."""
        cache = MemoryCacheProvider()

        await cache.set("key1", "value1", ttl=60)
        await cache.set("key2", "value2", ttl=60)
        assert cache.size() == 2

        cache.clear()
        assert cache.size() == 0
        assert await cache.get("key1") is None
        assert await cache.get("key2") is None

    @pytest.mark.asyncio
    async def test_cache_ttl_expiration(self):
        """Test that cache entries expire after TTL."""
        cache = MemoryCacheProvider()

        # Mock time to control expiration
        with patch("time.time") as mock_time:
            # Set value at time 0
            mock_time.return_value = 0
            await cache.set("key", "value", ttl=1)

            # Get value immediately (before expiration)
            mock_time.return_value = 0.5
            assert await cache.get("key") == "value"

            # Get value after expiration (1.5 seconds later)
            mock_time.return_value = 1.5
            assert await cache.get("key") is None

    @pytest.mark.asyncio
    async def test_cache_expired_entry_is_removed(self):
        """Test that expired entries are removed from cache."""
        cache = MemoryCacheProvider()

        with patch("time.time") as mock_time:
            mock_time.return_value = 0
            await cache.set("key", "value", ttl=1)
            assert cache.size() == 1

            # After expiration, getting the key should remove it
            mock_time.return_value = 2
            assert await cache.get("key") is None
            assert cache.size() == 0

    @pytest.mark.asyncio
    async def test_cache_multiple_entries_with_different_ttls(self):
        """Test multiple entries with independent expiration."""
        cache = MemoryCacheProvider()

        with patch("time.time") as mock_time:
            # Set first entry at time 0 with 2 second TTL
            mock_time.return_value = 0
            await cache.set("key1", "value1", ttl=2)

            # Set second entry at time 1 with 2 second TTL
            mock_time.return_value = 1
            await cache.set("key2", "value2", ttl=2)

            # At time 1.5, both should be available
            mock_time.return_value = 1.5
            assert await cache.get("key1") == "value1"
            assert await cache.get("key2") == "value2"

            # At time 2.5, key1 should be expired, key2 should still be available
            mock_time.return_value = 2.5
            assert await cache.get("key1") is None
            assert await cache.get("key2") == "value2"

            # At time 3.5, both should be expired
            mock_time.return_value = 3.5
            assert await cache.get("key2") is None

    @pytest.mark.asyncio
    async def test_cache_size(self):
        """Test cache size tracking."""
        cache = MemoryCacheProvider()

        assert cache.size() == 0

        await cache.set("key1", "value1", ttl=60)
        assert cache.size() == 1

        await cache.set("key2", "value2", ttl=60)
        assert cache.size() == 2

        await cache.get("key1")  # Should not affect size
        assert cache.size() == 2

        cache.clear()
        assert cache.size() == 0

    @pytest.mark.asyncio
    async def test_cache_zero_ttl(self):
        """Test cache with zero TTL expires immediately."""
        cache = MemoryCacheProvider()

        with patch("time.time") as mock_time:
            mock_time.return_value = 0
            await cache.set("key", "value", ttl=0)

            # Should be expired immediately
            mock_time.return_value = 0.001
            assert await cache.get("key") is None

    @pytest.mark.asyncio
    async def test_cache_per_entry_ttl(self):
        """Test that each entry can have its own TTL."""
        cache = MemoryCacheProvider()

        with patch("time.time") as mock_time:
            mock_time.return_value = 0
            await cache.set("short", "value1", ttl=1)  # 1 second
            await cache.set("long", "value2", ttl=10)  # 10 seconds

            # At 0.5 seconds, both should be available
            mock_time.return_value = 0.5
            assert await cache.get("short") == "value1"
            assert await cache.get("long") == "value2"

            # At 1.5 seconds, short should expire, long should remain
            mock_time.return_value = 1.5
            assert await cache.get("short") is None
            assert await cache.get("long") == "value2"

            # At 10.5 seconds, both should be expired
            mock_time.return_value = 10.5
            assert await cache.get("long") is None
