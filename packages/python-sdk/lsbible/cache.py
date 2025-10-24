"""Response cache for LSBible API."""

import time
from typing import Any


class ResponseCache:
    """Simple TTL-based cache for API responses."""

    def __init__(self, ttl: int = 3600):
        """
        Initialize the cache.

        Args:
            ttl: Time-to-live in seconds (default: 3600 = 1 hour)
        """
        self._cache: dict[str, tuple[Any, float]] = {}
        self._ttl = ttl

    def get(self, key: str) -> Any | None:
        """
        Get a value from the cache.

        Args:
            key: Cache key

        Returns:
            Cached value if found and not expired, None otherwise
        """
        if key not in self._cache:
            return None

        value, expires_at = self._cache[key]
        if time.time() > expires_at:
            # Expired, remove from cache
            del self._cache[key]
            return None

        return value

    def set(self, key: str, value: Any) -> None:
        """
        Set a value in the cache.

        Args:
            key: Cache key
            value: Value to cache
        """
        expires_at = time.time() + self._ttl
        self._cache[key] = (value, expires_at)

    def clear(self) -> None:
        """Clear all cached values."""
        self._cache.clear()

    def __len__(self) -> int:
        """Get the number of items in the cache."""
        return len(self._cache)
