import { describe, expect, it } from "vitest";
import { tableRanges, trajectoryTable } from "./trajectory";

const base = { muzzleVelocityFps: 3100, bc: 0.246, dragModel: "G1" as const, weightGr: 55, sightHeightIn: 2.6, zero: 100, maxYd: 500 };

describe("trajectory table", () => {
  it("crosses the line of sight at the zero", () => {
    const rows = trajectoryTable({ ...base, units: "imperial" });
    const zero = rows.find((r) => r.range === 100)!;
    expect(Math.abs(zero.pathIn)).toBeLessThan(0.01);
    expect(rows.at(-1)!.pathIn).toBeLessThan(-40);
    expect(rows.at(-1)!.comeUp).toBeGreaterThan(0);
  });

  it("uses round metric ranges and mils", () => {
    const rows = trajectoryTable({ ...base, units: "metric" });
    expect(rows.map((r) => r.range)).toEqual(tableRanges(500, "metric"));
    expect(rows.find((r) => r.range === 100)!.pathIn).toBeCloseTo(0, 2);
  });

  it("steps by 25, 50 or 100", () => {
    expect(tableRanges(150, "imperial")).toEqual([25, 50, 75, 100, 125, 150]);
    expect(tableRanges(1000, "imperial").slice(0, 2)).toEqual([100, 200]);
  });
});
