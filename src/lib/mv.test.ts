import { describe, expect, it } from "vitest";
import { energyFtLb, estimateMuzzleVelocity, sectionalDensity } from "./mv";

const load = { mvByBarrel: [[10, 2500], [14, 2800], [20, 3100]] as [number, number][] };

describe("estimateMuzzleVelocity", () => {
  it("returns a data point as measured", () => {
    expect(estimateMuzzleVelocity(load, 14)).toEqual({ fps: 2800, extrapolated: false, measured: true });
  });

  it("interpolates between points", () => {
    expect(estimateMuzzleVelocity(load, 16).fps).toBeCloseTo(2900);
    expect(estimateMuzzleVelocity(load, 16).extrapolated).toBe(false);
  });

  it("extends the end slope outside the data and says so", () => {
    const long = estimateMuzzleVelocity(load, 22);
    expect(long.fps).toBeCloseTo(3200);
    expect(long.extrapolated).toBe(true);
    expect(estimateMuzzleVelocity(load, 2).fps).toBeGreaterThanOrEqual(0.6 * 2500);
  });

  it("handles a single reading", () => {
    expect(estimateMuzzleVelocity({ mvByBarrel: [[16, 3000]] }, 20)).toEqual({ fps: 3000, extrapolated: true, measured: false });
  });
});

it("computes energy and sectional density", () => {
  expect(energyFtLb(55, 3240)).toBeCloseTo(1282, 0);
  expect(sectionalDensity(168, 0.308)).toBeCloseTo(0.253, 3);
});
