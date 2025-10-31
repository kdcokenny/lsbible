"""Tests for NoopCacheProvider."""

import pytest

from lsbible.cache import NoopCacheProvider


class TestNoopCacheProvider:
    """Test NoopCacheProvider class."""

    @pytest.mark.asyncio
    async def test_get_always_returns_none(self):
        """Test that get() always returns None."""
        cache = NoopCacheProvider()

        result = await cache.get("any_key")
        assert result is None

    @pytest.mark.asyncio
    async def test_set_does_nothing(self):
        """Test that set() does nothing."""
        cache = NoopCacheProvider()

        # Should not raise any errors
        await cache.set("key", "value", ttl=60)

        # Should still return None
        result = await cache.get("key")
        assert result is None

    @pytest.mark.asyncio
    async def test_multiple_sets_and_gets(self):
        """Test that multiple operations work correctly."""
        cache = NoopCacheProvider()

        # Set multiple values
        await cache.set("key1", "value1", ttl=60)
        await cache.set("key2", "value2", ttl=120)
        await cache.set("key3", {"data": "value3"}, ttl=180)

        # All gets should return None
        assert await cache.get("key1") is None
        assert await cache.get("key2") is None
        assert await cache.get("key3") is None
