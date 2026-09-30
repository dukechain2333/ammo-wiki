import { describe, expect, it } from "vitest";
import { matches, normalize, queryPatterns } from "./search";

const hay = normalize("5.56 NATO / .223 Rem M855 / SS109 62 gr (green tip) Federal XM855 V-MAX 62gr G1");
const find = (q: string) => matches(hay, queryPatterns(q));

describe("search", () => {
  it("ignores dots and hyphens inside words", () => {
    expect(find("556")).toBe(true);
    expect(find("223")).toBe(true);
    expect(find("vmax")).toBe(true);
  });

  it("matches numbers at the start of a number only", () => {
    expect(find("855")).toBe(true);
    expect(find("109")).toBe(true);
    expect(find("09")).toBe(false);
  });

  it("needs every word", () => {
    expect(find("federal 62")).toBe(true);
    expect(find("federal 77")).toBe(false);
  });

  it("treats regex characters as text", () => {
    expect(() => find("(+")).not.toThrow();
  });
});
