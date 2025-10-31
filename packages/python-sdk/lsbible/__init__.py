"""LSBible SDK - Structured, type-safe Bible API client."""

from .cache import (
    CacheOptions,
    CacheProvider,
    CacheTTL,
    CacheTTLConfig,
    MemoryCacheProvider,
    NoopCacheProvider,
)
from .client import LSBibleClient
from .exceptions import APIError, BuildIDError, InvalidReferenceError, LSBibleError
from .models import (
    BookName,
    Passage,
    SearchResponse,
    Testament,
    TextSegment,
    VerseContent,
    VerseReference,
)

__version__ = "0.1.0"

__all__ = [
    # Client
    "LSBibleClient",
    # Exceptions
    "LSBibleError",
    "InvalidReferenceError",
    "APIError",
    "BuildIDError",
    # Models
    "BookName",
    "Testament",
    "VerseReference",
    "TextSegment",
    "VerseContent",
    "Passage",
    "SearchResponse",
    # Cache
    "CacheProvider",
    "CacheOptions",
    "CacheTTL",
    "CacheTTLConfig",
    "MemoryCacheProvider",
    "NoopCacheProvider",
]
