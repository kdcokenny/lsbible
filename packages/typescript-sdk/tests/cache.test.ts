import { beforeEach, describe, expect, it } from "bun:test";
import { ResponseCache } from "../src/cache.js";

describe("ResponseCache", () => {
  let cache: ResponseCache;

  beforeEach(() => {
    cache = new ResponseCache(1); // 1 second TTL for testing
  });

  describe("get and set", () => {
    it("should store and retrieve values", () => {
      cache.set("key1", { data: "value1" });
      expect(cache.get<{ data: string }>("key1")).toEqual({ data: "value1" });
    });

    it("should return undefined for missing keys", () => {
      expect(cache.get("nonexistent")).toBeUndefined();
    });

    it("should handle different data types", () => {
      cache.set("string", "hello");
      cache.set("number", 42);
      cache.set("object", { foo: "bar" });
      cache.set("array", [1, 2, 3]);

      expect(cache.get<string>("string")).toBe("hello");
      expect(cache.get<number>("number")).toBe(42);
      expect(cache.get<{ foo: string }>("object")).toEqual({ foo: "bar" });
      expect(cache.get<number[]>("array")).toEqual([1, 2, 3]);
    });

    it("should overwrite existing keys", () => {
      cache.set("key", "value1");
      cache.set("key", "value2");
      expect(cache.get<string>("key")).toBe("value2");
    });
  });

  describe("TTL expiration", () => {
    it("should expire entries after TTL", async () => {
      cache.set("key", "value");
      expect(cache.get<string>("key")).toBe("value");

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(cache.get("key")).toBeUndefined();
    });

    it("should not expire entries before TTL", async () => {
      cache.set("key", "value");
      expect(cache.get<string>("key")).toBe("value");

      // Wait but not long enough to expire
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(cache.get<string>("key")).toBe("value");
    });
  });

  describe("clear", () => {
    it("should remove all entries", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.set("key3", "value3");

      cache.clear();

      expect(cache.get("key1")).toBeUndefined();
      expect(cache.get("key2")).toBeUndefined();
      expect(cache.get("key3")).toBeUndefined();
      expect(cache.size).toBe(0);
    });
  });

  describe("cleanup", () => {
    it("should remove expired entries", async () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Add a new entry
      cache.set("key3", "value3");

      // Run cleanup
      cache.cleanup();

      // Expired entries should be gone, new entry should remain
      expect(cache.get("key1")).toBeUndefined();
      expect(cache.get("key2")).toBeUndefined();
      expect(cache.get<string>("key3")).toBe("value3");
    });
  });

  describe("size", () => {
    it("should return the number of cached entries", () => {
      expect(cache.size).toBe(0);

      cache.set("key1", "value1");
      expect(cache.size).toBe(1);

      cache.set("key2", "value2");
      expect(cache.size).toBe(2);

      cache.clear();
      expect(cache.size).toBe(0);
    });

    it("should include expired entries until cleanup", async () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      expect(cache.size).toBe(2);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Size still includes expired entries
      expect(cache.size).toBe(2);

      // But get() triggers removal
      cache.get("key1");
      expect(cache.size).toBe(1);
    });
  });

  describe("custom TTL", () => {
    it("should respect custom TTL values", async () => {
      const shortCache = new ResponseCache(0.5); // 0.5 second TTL
      const longCache = new ResponseCache(10); // 10 second TTL

      shortCache.set("key", "value");
      longCache.set("key", "value");

      // Wait 600ms
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Short cache should expire
      expect(shortCache.get("key")).toBeUndefined();

      // Long cache should still have value
      expect(longCache.get<string>("key")).toBe("value");
    });
  });
});
