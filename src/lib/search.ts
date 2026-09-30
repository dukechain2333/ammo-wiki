// Catalog search: every word of the query must match the start of a word or number in the load's
// caliber, brand, name, product codes or weight. Same rules as the zero-targets load picker.

// Lowercase, drop dots and hyphens inside words, so "5.56", "556" and ".223" or "V-MAX" and "vmax"
// find the same loads.
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/(?<=[a-z])-(?=[a-z])/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const escape = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// A word matches where a run of letters or digits starts: "855" finds "m855", "62" does not find "262".
const wordPattern = (w: string) => new RegExp(/^[0-9]/.test(w) ? `(?<![0-9])${escape(w)}` : `(?<![a-z])${escape(w)}`);

export function queryPatterns(query: string): RegExp[] {
  return normalize(query).split(" ").filter(Boolean).map(wordPattern);
}

export const matches = (haystack: string, patterns: RegExp[]) => patterns.every((p) => p.test(haystack));
