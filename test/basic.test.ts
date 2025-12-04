import { describe, it, expect } from "vitest";

describe("Basic Tests", () => {
  it("should pass a simple test", () => {
    expect(true).toBe(true);
  });

  it("should test a basic addition", () => {
    expect(2 + 2).toBe(4);
  });

  it("should test a basic object comparison", () => {
    const obj = { name: "Test", value: 123 };
    expect(obj).toEqual({ name: "Test", value: 123 });
  });

  it("should test an async function", async () => {
    const promise = new Promise((resolve) =>
      setTimeout(() => resolve("result"), 100),
    );
    const result = await promise;
    expect(result).toBe("result");
  });
});
