"""In-memory cache provider with TTL support."""

import time
from typing import Any


class MemoryCacheProvider:
    """In-memory cache provider using dictionary with TTL support.

    This cache stores entries in memory with automatic expiration based on TTL.
    Expired entries are removed lazily when accessed.

    Suitable for:
    - Local development and testing
    - Single-process applications
    - Low-traffic deployments
    - MCP stdio servers

    Not suitable for:
    - Multi-process applications (cache not shared between processes)
    - High-traffic production servers (use Redis/Memcached)
    - Serverless deployments with limited memory

    Example:
        ```python
        from lsbible import LSBibleClient, MemoryCacheProvider, CacheTTL

        client = LSBibleClient(
            cache={
                "provider": MemoryCacheProvider(),
                "ttl": {
                    "verse": CacheTTL.BIBLE_CONTENT,
                    "search": CacheTTL.SEARCH_RESULTS,
                }
            }
        )
        ```
    """

    def __init__(self) -> None:
        """Initialize the memory cache."""
        self._cache: dict[str, tuple[Any, float]] = {}

    async def get(self, key: str) -> Any | None:
        """Get a value from the cache.

        Args:
            key: Cache key

        Returns:
            Cached value if found and not expired, None otherwise
        """
        if key not in self._cache:
            return None

        value, expires_at = self._cache[key]

        # Check if expired
        if time.time() > expires_at:
            # Expired, remove from cache
            del self._cache[key]
            return None

        return value

    async def set(self, key: str, value: Any, ttl: int) -> None:
        """Set a value in the cache.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds
        """
        expires_at = time.time() + ttl
        self._cache[key] = (value, expires_at)

    def clear(self) -> None:
        """Clear all cached values.

        Note: This is a synchronous method for convenience.
        """
        self._cache.clear()

    def size(self) -> int:
        """Get the number of items currently in the cache.

        Note: This includes expired items that haven't been accessed yet.

        Returns:
            Number of items in cache
        """
        return len(self._cache)
