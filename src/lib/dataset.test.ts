import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readDataset } from "./dataset";

describe("the repository's data", () => {
  const { data, errors } = readDataset(process.cwd());

  it("has no errors", () => {
    expect(errors).toEqual([]);
  });

  it("has loads in every caliber", () => {
    for (const c of data.calibers) expect(data.loads.some((l) => l.caliber === c.id), c.id).toBe(true);
  });

  it("resolves shared sources", () => {
    const xm193 = data.loads.find((l) => l.id === "fed-xm193")!;
    expect(xm193.sources.map((s) => s.id).filter(Boolean)).toEqual(["rifleshooter-223-2014-long", "rifleshooter-223-2015-short"]);
    expect(xm193.sources.every((s) => s.label)).toBe(true);
  });
});

function fixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), "ammo-wiki-"));
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    writeFileSync(path.join(root, rel), text);
  }
  return readDataset(root);
}

const CALIBER = `id: test-cal
name: Test caliber
short: Test
order: 1
bulletDiameterIn: 0.224
barrelPresetsIn: [16]
defaultBarrelIn: 16
tableRangeYd: 500
description: For tests.
drawing: { caseLength: 44.7, overallLength: 57.4, base: 9.6, shoulder: 9.0, shoulderAt: 36.5, neckAt: 39.8, neck: 6.4, bullet: 5.7 }
`;

const load = (id: string, extra = "") => `id: ${id}
caliber: test-cal
name: Test load ${id}
short: Test ${id}
weightGr: 55
diameterIn: 0.224
bc: 0.25
dragModel: G1
platform: ar15
confidence: low
mvByBarrel:
  - [16, 3000]
sources:
  - label: A test
    url: https://example.com
${extra}`;

describe("checks", () => {
  it("accepts a minimal load", () => {
    const r = fixture({ "data/calibers/test-cal.yaml": CALIBER, "data/loads/test-cal/a.yaml": load("a") });
    expect(r.errors).toEqual([]);
    expect(r.data.loads).toHaveLength(1);
  });

  it("reports a file name that does not match the id", () => {
    const r = fixture({ "data/calibers/test-cal.yaml": CALIBER, "data/loads/test-cal/b.yaml": load("a") });
    expect(r.errors.map((e) => e.message)).toContain('id "a" must match the file name "b"');
  });

  it("reports unknown fields, bad numbers and unsorted barrels", () => {
    const bad = load("a").replace("bc: 0.25", "bc: 25\ncolor: red").replace("  - [16, 3000]", "  - [16, 3000]\n  - [14, 2900]");
    const r = fixture({ "data/calibers/test-cal.yaml": CALIBER, "data/loads/test-cal/a.yaml": bad });
    const text = r.errors.map((e) => e.message).join("\n");
    expect(text).toMatch(/color/);
    expect(text).toMatch(/^bc:/m);
    expect(text).toMatch(/shortest first/);
  });

  it("reports a number where text is expected", () => {
    const r = fixture({ "data/calibers/test-cal.yaml": CALIBER, "data/loads/test-cal/a.yaml": load("a", "sku: [223]") });
    expect(r.errors.map((e) => e.message).join()).toMatch(/put quotes around numbers/);
  });

  it("reports broken links between files", () => {
    const r = fixture({
      "data/calibers/test-cal.yaml": CALIBER,
      "data/loads/test-cal/a.yaml": load("a", "sameAs: nope").replace("  - label: A test\n    url: https://example.com", "  - missing-source"),
    });
    const text = r.errors.map((e) => e.message).join("\n");
    expect(text).toMatch(/sameAs: no load with id "nope"/);
    expect(text).toMatch(/no source "missing-source"/);
  });

  it("reports duplicate ids and a folder with no caliber", () => {
    const r = fixture({
      "data/calibers/test-cal.yaml": CALIBER,
      "data/loads/test-cal/a.yaml": load("a"),
      "data/loads/other/a.yaml": load("a").replace("caliber: test-cal", "caliber: other"),
    });
    const text = r.errors.map((e) => e.message).join("\n");
    expect(text).toMatch(/no caliber "other"/);
    expect(text).toMatch(/already used/);
  });
});
