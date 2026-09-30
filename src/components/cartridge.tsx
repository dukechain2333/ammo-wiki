import type { Drawing } from "@/lib/schema";

/** Outline of a bottleneck or straight case plus bullet, from the caliber's dimensions (mm). */
export function cartridgePaths(d: Drawing, scale: number, cx: number, base: number) {
  const X = (x: number) => (cx + x * scale).toFixed(1);
  const Y = (y: number) => (base - y * scale).toFixed(1);
  const B = d.base;
  // Rim, extraction groove, body taper, shoulder, neck; right side up, then back down the left.
  const right: [number, number][] = [
    [B / 2, 0],
    [B / 2, 1.2],
    [0.42 * B, 1.8],
    [0.42 * B, 2.8],
    [0.49 * B, 3.6],
    [d.shoulder / 2, d.shoulderAt],
    [d.neck / 2, d.neckAt],
    [d.neck / 2, d.caseLength],
  ];
  const outline = [...right, ...right.slice().reverse().map(([x, y]) => [-x, y] as [number, number])];
  const casePath = `M${outline.map(([x, y]) => `${X(x)} ${Y(y)}`).join(" L")} Z`;

  const r = d.bullet / 2;
  const span = d.overallLength - d.caseLength;
  const s1 = d.caseLength + span * (d.shank ?? 0.22);
  const cp = d.caseLength + span * (d.ogive ?? 0.82);
  const bulletPath =
    `M${X(-r)} ${Y(d.caseLength)} L${X(r)} ${Y(d.caseLength)} L${X(r)} ${Y(s1)} ` +
    `Q${X(r)} ${Y(cp)} ${X(0)} ${Y(d.overallLength)} Q${X(-r)} ${Y(cp)} ${X(-r)} ${Y(s1)} Z`;
  return { casePath, bulletPath };
}

/** Cartridge drawn to scale: `scale` px per mm; the case head sits on the bottom edge. */
export function Cartridge({ drawing, scale = 2.2, height = 176, title }: { drawing: Drawing; scale?: number; height?: number; title?: string }) {
  const width = Math.ceil(drawing.base * scale + 8);
  const { casePath, bulletPath } = cartridgePaths(drawing, scale, width / 2, height - 1);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <path d={casePath} fill="var(--panel)" stroke="var(--ink)" strokeWidth="1.2" strokeLinejoin="round" />
      <path d={bulletPath} fill="var(--brass)" stroke="var(--ink)" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
