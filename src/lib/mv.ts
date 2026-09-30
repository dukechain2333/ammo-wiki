/** (barrel length in, muzzle velocity fps) points, ascending by length. */
export type MvCurve = ReadonlyArray<readonly [number, number]>;

export interface MvEstimate {
  fps: number;
  /** True when the barrel is shorter or longer than the published data covers. */
  extrapolated: boolean;
  /** True when a reading exists at exactly this length. */
  measured: boolean;
}

/**
 * Muzzle velocity for a barrel length: linear interpolation between published points. Outside the
 * data the end segment's slope is extended, which is a fair guess for a couple of inches but no more.
 * (Same rule as zero-targets, so both sites give the same number.)
 */
export function estimateMuzzleVelocity(load: { mvByBarrel: MvCurve }, barrelIn: number): MvEstimate {
  const pts = load.mvByBarrel;
  const measured = pts.some(([len]) => len === barrelIn);
  if (pts.length === 1) return { fps: pts[0][1], extrapolated: barrelIn !== pts[0][0], measured };
  let i = pts.findIndex(([len]) => len >= barrelIn);
  const extrapolated = i === -1 || (i === 0 && barrelIn < pts[0][0]);
  if (i === -1) i = pts.length - 1;
  if (i === 0) i = 1;
  const [x0, y0] = pts[i - 1];
  const [x1, y1] = pts[i];
  const fps = y0 + ((barrelIn - x0) * (y1 - y0)) / (x1 - x0);
  // Steep short-barrel slopes can run away when extended; never drop below 60% of the data.
  return { fps: Math.max(fps, 0.6 * pts[0][1]), extrapolated, measured };
}

/** Muzzle energy, ft-lb, from bullet weight (gr) and velocity (fps). */
export const energyFtLb = (weightGr: number, fps: number) => (weightGr * fps * fps) / 450240;

/** Sectional density, lb/in². */
export const sectionalDensity = (weightGr: number, diameterIn: number) => weightGr / 7000 / (diameterIn * diameterIn);
