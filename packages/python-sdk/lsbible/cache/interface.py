"""Cache provider interface for LSBible SDK.

Allows users to implement custom caching strategies for different
deployment environments (Redis, Memcached, in-memory, etc.)
"""

from typing import Any, Protocol, TypedDict


class CacheProvider(Protocol):
    """Cache provider protocol.

    Implement this protocol to provide custom caching for the LSBible client.

    Example:
        ```python
        import redis.asyncio as redis

        class RedisCacheProvider:
            def __init__(self, redis_client: redis.Redis):
                self.redis = redis_client

            async def get(self, key: str) -> Any | None:
                value = await self.redis.get(key)
                return json.loads(value) if value else None

            async def set(self, key: str, value: Any, ttl: int) -> None:
                await self.redis.set(key, json.dumps(value), ex=ttl)
        ```
    """

    async def get(self, key: str) -> Any | None:
        """Get a value from the cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found/expired
        """
        ...

    async def set(self, key: str, value: Any, ttl: int) -> None:
        """Set a value in the cache.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds
        """
        ...


class CacheTTLConfig(TypedDict, total=False):
    """Per-operation TTL overrides."""

    verse: int
    """TTL for verse lookups"""

    passage: int
    """TTL for passage lookups"""

    chapter: int
    """TTL for chapter lookups"""

    search: int
    """TTL for search queries"""


class CacheOptions(TypedDict, total=False):
    """Cache configuration options."""

    provider: CacheProvider | None
    """Cache provider implementation.

    If not provided, caching is disabled.
    """

    default_ttl: int
    """Default TTL for cache entries (in seconds).

    Can be overridden per-operation.
    Default: 2592000 (30 days)
    """

    ttl: CacheTTLConfig
    """Per-operation TTL overrides."""


class CacheTTL:
    """Recommended cache TTL values (in seconds)."""

    BIBLE_CONTENT: int = 2_592_000
    """1 month - for immutable Bible content (verses, passages, chapters)"""

    SEARCH_RESULTS: int = 604_800
    """1 week - for search results that may change with API updates"""

    STATIC: int = 31_536_000
    """1 year - for static resources that never change"""
