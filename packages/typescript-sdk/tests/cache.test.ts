import { beforeEach, describe, expect, it } from "bun:test";
import { MemoryCacheProvider } from "../src/cache/memory.js";

describe("MemoryCacheProvider", () => {
  let cache: MemoryCacheProvider;

  beforeEach(() => {
    cache = new MemoryCacheProvider();
  });

  describe("get and set", () => {
    it("should store and retrieve values", async () => {
      await cache.set("key1", { data: "value1" }, 1);
      expect(await cache.get<{ data: string }>("key1")).toEqual({ data: "value1" });
    });

    it("should return undefined for missing keys", async () => {
      expect(await cache.get("nonexistent")).toBeUndefined();
    });

    it("should handle different data types", async () => {
      await cache.set("string", "hello", 1);
      await cache.set("number", 42, 1);
      await cache.set("object", { foo: "bar" }, 1);
      await cache.set("array", [1, 2, 3], 1);

      expect(await cache.get<string>("string")).toBe("hello");
      expect(await cache.get<number>("number")).toBe(42);
      expect(await cache.get<{ foo: string }>("object")).toEqual({ foo: "bar" });
      expect(await cache.get<number[]>("array")).toEqual([1, 2, 3]);
    });

    it("should overwrite existing keys", async () => {
      await cache.set("key", "value1", 1);
      await cache.set("key", "value2", 1);
      expect(await cache.get<string>("key")).toBe("value2");
    });
  });

  describe("TTL expiration", () => {
    it("should expire entries after TTL", async () => {
      await cache.set("key", "value", 1); // 1 second TTL
      expect(await cache.get<string>("key")).toBe("value");

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(await cache.get("key")).toBeUndefined();
    });

    it("should not expire entries before TTL", async () => {
      await cache.set("key", "value", 1); // 1 second TTL
      expect(await cache.get<string>("key")).toBe("value");

      // Wait but not long enough to expire
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(await cache.get<string>("key")).toBe("value");
    });
  });

  describe("clear", () => {
    it("should remove all entries", async () => {
      await cache.set("key1", "value1", 1);
      await cache.set("key2", "value2", 1);
      await cache.set("key3", "value3", 1);

      cache.clear();

      expect(await cache.get("key1")).toBeUndefined();
      expect(await cache.get("key2")).toBeUndefined();
      expect(await cache.get("key3")).toBeUndefined();
      expect(cache.size()).toBe(0);
    });
  });

  describe("size", () => {
    it("should return the number of cached entries", async () => {
      expect(cache.size()).toBe(0);

      await cache.set("key1", "value1", 1);
      expect(cache.size()).toBe(1);

      await cache.set("key2", "value2", 1);
      expect(cache.size()).toBe(2);

      cache.clear();
      expect(cache.size()).toBe(0);
    });

    it("should include expired entries until accessed", async () => {
      await cache.set("key1", "value1", 1);
      await cache.set("key2", "value2", 1);
      expect(cache.size()).toBe(2);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Size still includes expired entries
      expect(cache.size()).toBe(2);

      // But get() triggers removal
      await cache.get("key1");
      expect(cache.size()).toBe(1);
    });
  });

  describe("custom TTL", () => {
    it("should respect custom TTL values", async () => {
      const shortCache = new MemoryCacheProvider();
      const longCache = new MemoryCacheProvider();

      await shortCache.set("key", "value", 0.5); // 0.5 second TTL
      await longCache.set("key", "value", 10); // 10 second TTL

      // Wait 600ms
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Short cache should expire
      expect(await shortCache.get("key")).toBeUndefined();

      // Long cache should still have value
      expect(await longCache.get<string>("key")).toBe("value");
    });
  });
});
