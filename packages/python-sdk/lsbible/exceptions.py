"""Exception classes for the LSBible SDK."""


class LSBibleError(Exception):
    """Base exception for LSBible SDK."""


class InvalidReferenceError(LSBibleError):
    """Raised when a Bible reference is invalid."""


class APIError(LSBibleError):
    """Raised when API request fails."""


class BuildIDError(LSBibleError):
    """Raised when build ID cannot be determined."""
