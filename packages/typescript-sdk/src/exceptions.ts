/**
 * Custom exceptions for LSBible SDK.
 */

/**
 * Base exception for LSBible SDK errors.
 */
export class LSBibleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LSBibleError";
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Raised when a Bible reference is invalid.
 *
 * Examples:
 * - Invalid book name
 * - Chapter number exceeds book's chapter count
 * - Verse number exceeds chapter's verse count
 */
export class InvalidReferenceError extends LSBibleError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidReferenceError";
  }
}

/**
 * Raised when an API request fails.
 *
 * Examples:
 * - HTTP errors (4xx, 5xx)
 * - Network failures
 * - Malformed responses
 */
export class APIError extends LSBibleError {
  constructor(message: string) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * Raised when build ID cannot be determined.
 *
 * The Next.js build ID is required for API requests but may change
 * with deployments. This error indicates the SDK couldn't auto-detect it.
 */
export class BuildIDError extends LSBibleError {
  constructor(message: string) {
    super(message);
    this.name = "BuildIDError";
  }
}
