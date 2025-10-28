import { describe, expect, it } from "bun:test";
import { APIError, BuildIDError, InvalidReferenceError, LSBibleError } from "../src/exceptions.js";

describe("Exceptions", () => {
  describe("LSBibleError", () => {
    it("should create base error with message", () => {
      const error = new LSBibleError("Test error");
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Test error");
      expect(error.name).toBe("LSBibleError");
    });

    it("should maintain stack trace", () => {
      const error = new LSBibleError("Test error");
      expect(error.stack).toBeDefined();
    });
  });

  describe("InvalidReferenceError", () => {
    it("should create invalid reference error", () => {
      const error = new InvalidReferenceError("Invalid book");
      expect(error).toBeInstanceOf(LSBibleError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Invalid book");
      expect(error.name).toBe("InvalidReferenceError");
    });
  });

  describe("APIError", () => {
    it("should create API error", () => {
      const error = new APIError("API request failed");
      expect(error).toBeInstanceOf(LSBibleError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("API request failed");
      expect(error.name).toBe("APIError");
    });
  });

  describe("BuildIDError", () => {
    it("should create build ID error", () => {
      const error = new BuildIDError("Could not determine build ID");
      expect(error).toBeInstanceOf(LSBibleError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Could not determine build ID");
      expect(error.name).toBe("BuildIDError");
    });
  });
});
