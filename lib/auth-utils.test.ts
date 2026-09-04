import { describe, expect, it } from "vitest";
import { digest, safeReturnTo, sessionToken } from "@/lib/auth-utils";

describe("auth utilities", () => {
  it("only accepts local return paths", () => {
    expect(safeReturnTo("/settings?tab=1")).toBe("/settings?tab=1");
    expect(safeReturnTo("//evil.example/path")).toBe("/");
    expect(safeReturnTo("https://evil.example/path")).toBe("/");
    expect(safeReturnTo(null)).toBe("/");
  });

  it("creates opaque tokens and stable non-plaintext hashes", () => {
    const first = sessionToken();
    const second = sessionToken();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(40);
    expect(digest(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(digest(first)).not.toContain(first);
  });
});
