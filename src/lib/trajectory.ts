// The trajectory table on a load page: zero the rifle, then read the bullet path at round ranges.

import { sampleTrajectory, solveZeroElevation, STANDARD_ATMOSPHERE, type DragModel } from "./ballistics/solver";
import { energyFtLb } from "./mv";
import { M_PER_YD, type UnitSystem } from "./units";

export const WIND_MPH = 10;

export interface TrajectoryRow {
  rangeYd: number;
  /** Range in the display unit (yd or m), a round number. */
  range: number;
  /** Bullet path relative to the line of sight, inches (+ = above). */
  pathIn: number;
  /** Elevation correction in MOA (imperial) or mil (metric); + = dial up. */
  comeUp: number;
  /** Drift in a 10 mph full-value crosswind, inches. */
  windIn: number;
  velocityFps: number;
  energyFtLb: number;
  timeS: number;
  subsonic: boolean;
}

export interface TrajectoryInput {
  muzzleVelocityFps: number;
  bc: number;
  dragModel: DragModel;
  weightGr: number;
  sightHeightIn: number;
  /** Zero distance in the display unit. */
  zero: number;
  /** Longest range in yards; rounded to the display unit. */
  maxYd: number;
  units: UnitSystem;
}

const moaInches = (yd: number) => Math.tan(Math.PI / 10800) * yd * 36;
const milInches = (yd: number) => 0.001 * yd * 36;

/** Round steps in the display unit: 25 for short tables, 50 to 500, then 100. */
export function tableRanges(maxYd: number, units: UnitSystem): number[] {
  const max = units === "metric" ? Math.round((maxYd * M_PER_YD) / 50) * 50 : maxYd;
  const step = max <= 200 ? 25 : max <= 500 ? 50 : 100;
  const out: number[] = [];
  for (let r = step; r <= max; r += step) out.push(r);
  return out;
}

export function trajectoryTable(p: TrajectoryInput): TrajectoryRow[] {
  const toYd = (d: number) => (p.units === "metric" ? d / M_PER_YD : d);
  const input = { muzzleVelocityFps: p.muzzleVelocityFps, bc: p.bc, dragModel: p.dragModel, sightHeightIn: p.sightHeightIn };
  const elevation = solveZeroElevation(input, toYd(p.zero));
  const ranges = tableRanges(p.maxYd, p.units);
  const yds = ranges.map(toYd);
  const still = sampleTrajectory(input, elevation, yds);
  const windy = sampleTrajectory({ ...input, crosswindMph: WIND_MPH }, elevation, yds);
  const perUnit = p.units === "metric" ? milInches : moaInches;
  return still.map((pt, i) => ({
    rangeYd: pt.rangeYd,
    range: ranges[i],
    pathIn: pt.heightIn,
    comeUp: -pt.heightIn / perUnit(pt.rangeYd),
    windIn: Math.abs(windy[i]?.windageIn ?? 0),
    velocityFps: pt.velocityFps,
    energyFtLb: energyFtLb(p.weightGr, pt.velocityFps),
    timeS: pt.timeS,
    subsonic: pt.velocityFps < STANDARD_ATMOSPHERE.speedOfSoundFps,
  }));
}
