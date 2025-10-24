"""LSBible SDK - Structured, type-safe Bible API client."""

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
    "LSBibleClient",
    "LSBibleError",
    "InvalidReferenceError",
    "APIError",
    "BuildIDError",
    "BookName",
    "Testament",
    "VerseReference",
    "TextSegment",
    "VerseContent",
    "Passage",
    "SearchResponse",
]
