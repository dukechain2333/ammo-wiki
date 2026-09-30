// Everything is stored in imperial units (in, fps, gr, yd); these convert for display.

export type UnitSystem = "imperial" | "metric";

export const MM_PER_IN = 25.4;
export const MPS_PER_FPS = 0.3048;
export const G_PER_GR = 0.06479891;
export const J_PER_FTLB = 1.3558179;
export const M_PER_YD = 0.9144;

const grouped = (v: number, decimals = 0) =>
  v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export const fmtInt = (v: number) => grouped(Math.round(v));

export const velocity = (fps: number, s: UnitSystem) =>
  s === "metric" ? { value: grouped(fps * MPS_PER_FPS), unit: "m/s" } : { value: grouped(fps), unit: "fps" };

export const energy = (ftlb: number, s: UnitSystem) =>
  s === "metric" ? { value: grouped(ftlb * J_PER_FTLB), unit: "J" } : { value: grouped(ftlb), unit: "ft·lb" };

export const weight = (gr: number, s: UnitSystem) =>
  s === "metric" ? { value: grouped(gr * G_PER_GR, 2), unit: "g" } : { value: String(gr), unit: "gr" };

export const barrel = (inch: number, s: UnitSystem) =>
  s === "metric" ? { value: grouped(inch * MM_PER_IN), unit: "mm" } : { value: String(inch), unit: "in" };

/** Trim float noise: 0.30000001 -> "0.3". */
export const trim = (v: number, maxDecimals = 3) => String(Number(v.toFixed(maxDecimals)));
