"""No-op cache provider that disables caching."""

from typing import Any


class NoopCacheProvider:
    """No-op cache provider that disables caching entirely.

    All get() calls return None (cache miss), and all set() calls do nothing.
    Useful for debugging or situations where caching isn't beneficial.

    Example:
        ```python
        from lsbible import LSBibleClient, NoopCacheProvider

        # Disable caching for testing
        client = LSBibleClient(
            cache={"provider": NoopCacheProvider()}
        )
        ```
    """

    async def get(self, key: str) -> Any | None:
        """Get a value from the cache.

        Always returns None (cache miss).

        Args:
            key: Cache key (ignored)

        Returns:
            Always None
        """
        return None

    async def set(self, key: str, value: Any, ttl: int) -> None:
        """Set a value in the cache.

        Does nothing (no-op).

        Args:
            key: Cache key (ignored)
            value: Value to cache (ignored)
            ttl: Time to live in seconds (ignored)
        """
        pass
