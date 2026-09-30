"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MvCurve } from "@/lib/mv";
import { energyFtLb, estimateMuzzleVelocity } from "@/lib/mv";
import type { DragModel } from "@/lib/schema";
import { zeroTargetsUrl } from "@/lib/site";
import { trajectoryTable, WIND_MPH } from "@/lib/trajectory";
import { energy as fmtEnergy, fmtInt, MM_PER_IN, MPS_PER_FPS, trim, velocity as fmtVelocity, type UnitSystem } from "@/lib/units";
import { UnitsToggle, useUnits } from "./units";

export interface PanelLoad {
  confidence: "high" | "medium" | "low";
  weightGr: number;
  bc: number;
  dragModel: DragModel;
  mvByBarrel: MvCurve;
}

const PAD = { l: 52, r: 12, t: 16, b: 36 };

/** Width of an element in CSS px, so the chart can draw at 1:1 and keep its labels readable. */
function useWidth(fallback: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Round tick values covering [lo, hi] in steps that give 4 to 7 lines. */
function niceTicks(lo: number, hi: number): number[] {
  const steps = [10, 20, 25, 50, 100, 200, 250, 500, 1000];
  const step = steps.find((s) => (hi - lo) / s <= 6) ?? 1000;
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const out: number[] = [];
  for (let v = start; v <= end + 1e-9; v += step) out.push(v);
  return out;
}

function Chart({ load, barrelIn, mvFps, units }: { load: PanelLoad; barrelIn: number; mvFps: number; units: UnitSystem }) {
  const [ref, measured] = useWidth(760);
  const W = Math.max(280, measured);
  const H = W < 520 ? 220 : 300;
  const pts = load.mvByBarrel;
  const toDisp = (fps: number) => (units === "metric" ? fps * MPS_PER_FPS : fps);
  const xs = [...pts.map((p) => p[0]), barrelIn];
  const x0 = Math.floor(Math.min(...xs) / 2) * 2;
  const x1 = Math.max(Math.ceil(Math.max(...xs) / 2) * 2, x0 + 4);
  const ys = [...pts.map((p) => toDisp(p[1])), toDisp(mvFps)];
  const yTicks = niceTicks(Math.min(...ys), Math.max(...ys));
  const y0 = yTicks[0];
  const y1 = yTicks[yTicks.length - 1] === y0 ? y0 + 1 : yTicks[yTicks.length - 1];
  const X = (len: number) => PAD.l + ((len - x0) / (x1 - x0)) * (W - PAD.l - PAD.r);
  const Y = (fps: number) => PAD.t + ((y1 - toDisp(fps)) / (y1 - y0)) * (H - PAD.t - PAD.b);
  const xStep = (x1 - x0) / (W < 520 ? 6 : 12) > 2 ? 4 : 2;
  const xTicks: number[] = [];
  for (let v = x0; v <= x1; v += xStep) xTicks.push(v);
  const curve = `M${pts.map(([l, v]) => `${X(l).toFixed(1)} ${Y(v).toFixed(1)}`).join(" L")}`;
  const mx = X(barrelIn);
  const my = Y(mvFps);
  const label = `${fmtInt(toDisp(mvFps))} ${units === "metric" ? "m/s" : "fps"}`;
  const labelLeft = mx > W - 110;
  const first = pts[0];
  const last = pts[pts.length - 1];
  return (
    <div ref={ref} style={{ marginTop: 18 }}>
    <svg
      className="chart"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Muzzle velocity against barrel length: ${fmtInt(toDisp(first[1]))} at ${first[0]} in${
        pts.length > 1 ? ` to ${fmtInt(toDisp(last[1]))} at ${last[0]} in` : ""
      } ${units === "metric" ? "m/s" : "fps"}.`}
    >
      {yTicks.map((v) => {
        const y = PAD.t + ((y1 - v) / (y1 - y0)) * (H - PAD.t - PAD.b);
        return (
          <g key={v}>
            <line className="grid" x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} />
            <text x={PAD.l - 8} y={y + 4} textAnchor="end">
              {fmtInt(v)}
            </text>
          </g>
        );
      })}
      {xTicks.map((v) => (
        <g key={v}>
          <line className="axis" x1={X(v)} x2={X(v)} y1={H - PAD.b} y2={H - PAD.b + 5} />
          <text x={X(v)} y={H - PAD.b + 20} textAnchor="middle">
            {v}″
          </text>
        </g>
      ))}
      <line className="axis" x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} strokeWidth={1.2} />
      <line className="marker-line" x1={mx} x2={mx} y1={PAD.t} y2={H - PAD.b} />
      {pts.length > 1 && <path className="curve" d={curve} />}
      {pts.map(([l, v]) => (
        <circle key={l} className="pt" cx={X(l)} cy={Y(v)} r={3.5} />
      ))}
      <circle className="marker" cx={mx} cy={my} r={7} />
      <text className="marker-label" x={labelLeft ? mx - 12 : mx + 12} y={Math.min(my + 22, H - PAD.b - 8)} textAnchor={labelLeft ? "end" : "start"}>
        {label}
      </text>
    </svg>
    </div>
  );
}

const SIGHT_HEIGHTS = [1.5, 2, 2.6, 3];
const ZEROS = [25, 50, 100, 200];

export function VelocityPanel({
  load,
  presets,
  defaultBarrelIn,
  tableRangeYd,
  defaultZero,
  side,
}: {
  load: PanelLoad;
  presets: number[];
  defaultBarrelIn: number;
  tableRangeYd: number;
  defaultZero: number;
  /** Server-rendered spec sheet shown beside the chart. */
  side: React.ReactNode;
}) {
  const { units } = useUnits();
  const [barrelIn, setBarrelIn] = useState(defaultBarrelIn);
  const [custom, setCustom] = useState("");
  const [zero, setZero] = useState(defaultZero);
  const [sightIn, setSightIn] = useState(2.6);

  const mv = estimateMuzzleVelocity(load, barrelIn);
  const v = fmtVelocity(mv.fps, units);
  const e = fmtEnergy(energyFtLb(load.weightGr, mv.fps), units);

  const pts = load.mvByBarrel;
  const lo = [...pts].reverse().find((p) => p[0] < barrelIn);
  const hi = pts.find((p) => p[0] > barrelIn);
  const how = mv.measured
    ? load.confidence === "high"
      ? `From this load's chronograph series at ${barrelIn} in.`
      : `A point in this load's data at ${barrelIn} in; the notes say which lengths were measured.`
    : mv.extrapolated
      ? `Extended past the measured ${pts[0][0]}–${pts[pts.length - 1][0]} in: a rough guess beyond a couple of inches.`
      : lo && hi
        ? `Interpolated between the ${lo[0]} in and ${hi[0]} in points.`
        : "";

  const rows = useMemo(
    () =>
      trajectoryTable({
        muzzleVelocityFps: mv.fps,
        bc: load.bc,
        dragModel: load.dragModel,
        weightGr: load.weightGr,
        sightHeightIn: sightIn,
        zero,
        maxYd: tableRangeYd,
        units,
      }),
    [mv.fps, load.bc, load.dragModel, load.weightGr, sightIn, zero, tableRangeYd, units],
  );

  const metric = units === "metric";
  const path = (inch: number) => (metric ? (inch * 2.54).toFixed(1) : inch.toFixed(1));
  const signed = (s: string) => (Number(s) > 0 ? `+${s}` : Number(s) === 0 ? "0.0" : s);
  const barrelOptions = [...new Set([...presets, ...(presets.includes(barrelIn) ? [] : [barrelIn])])];

  return (
    <>
      <div className="load-grid">
        <aside className="load-side">{side}</aside>
        <section className="card load-main" aria-labelledby="mv-title">
          <div className="card-head">
            <h2 id="mv-title">Muzzle velocity by barrel length</h2>
            <div className="chart-legend">
              <span>
                <span className="swatch" style={{ borderRadius: "50%", background: "var(--ink)", width: 8, height: 8 }} />
                Data point
              </span>
              <span>
                <span style={{ width: 16, height: 2, background: "var(--brass)", display: "inline-block" }} />
                Interpolated
              </span>
            </div>
          </div>
          <div className="card-body">
            <div className="vp-top">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span id="barrel-label" className="muted" style={{ fontSize: 13 }}>
                  Barrel length, inches
                </span>
                <div className="barrels" role="group" aria-labelledby="barrel-label">
                  {barrelOptions.map((b) => (
                    <button
                      key={b}
                      type="button"
                      aria-pressed={b === barrelIn}
                      onClick={() => {
                        setBarrelIn(b);
                        setCustom("");
                      }}
                    >
                      {b}
                    </button>
                  ))}
                  <label>
                    <span className="sr-only">Other barrel length, inches</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={2}
                      max={40}
                      step={0.1}
                      placeholder="other"
                      value={custom}
                      onChange={(ev) => {
                        setCustom(ev.target.value);
                        const n = Number(ev.target.value);
                        if (ev.target.value && Number.isFinite(n) && n >= 2 && n <= 40) setBarrelIn(n);
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="readout" aria-live="polite">
                <div>
                  <b>
                    {mv.extrapolated && <span className="approx">≈</span>}
                    {v.value}
                  </b>
                  <span>{v.unit} at the muzzle</span>
                </div>
                <div>
                  <b className="sm">{e.value}</b>
                  <span>{e.unit}</span>
                </div>
              </div>
            </div>
            <Chart load={load} barrelIn={barrelIn} mvFps={mv.fps} units={units} />
            <p className="muted" style={{ margin: "8px 0 0", fontSize: 13 }}>
              {barrelIn} in = {Math.round(barrelIn * MM_PER_IN)} mm. {how}
            </p>
            <div className="series">
              <table>
                <tbody>
                  <tr>
                    <th scope="row">in</th>
                    {pts.map(([l]) => (
                      <td key={l}>{l}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">{v.unit}</th>
                    {pts.map(([l, f]) => (
                      <td key={l}>{fmtVelocity(f, units).value}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <section className="card" style={{ marginTop: 20 }} aria-labelledby="traj-title">
        <div className="card-head">
          <h2 id="traj-title">Trajectory from a {trim(barrelIn, 1)} in barrel</h2>
          <a
            href={zeroTargetsUrl({ ...load, barrelIn, mvFps: mv.fps, metric })}
            style={{ fontSize: 13, color: "var(--ink-2)" }}
          >
            Print a zeroing target for this load
          </a>
        </div>
        <div className="traj-settings">
          <label className="field">
            Zero
            <select value={zero} onChange={(ev) => setZero(Number(ev.target.value))}>
              {ZEROS.map((z) => (
                <option key={z} value={z}>
                  {z} {metric ? "m" : "yd"}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Sight height
            <select value={sightIn} onChange={(ev) => setSightIn(Number(ev.target.value))}>
              {SIGHT_HEIGHTS.map((s) => (
                <option key={s} value={s}>
                  {metric ? `${Math.round(s * MM_PER_IN)} mm` : `${s} in`}
                </option>
              ))}
            </select>
          </label>
          <span className="fixed">{metric ? `${Math.round(WIND_MPH * 0.44704 * 10) / 10} m/s` : `${WIND_MPH} mph`} full-value crosswind</span>
          <span className="fixed">Sea level, {metric ? "15 °C" : "59 °F"}</span>
          <span style={{ marginLeft: "auto" }}>
            <UnitsToggle />
          </span>
        </div>
        <div className="table-wrap" style={{ padding: "0 8px 4px" }}>
          <table className="data-table traj" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th className="num">Range {metric ? "m" : "yd"}</th>
                <th className="num">Path {metric ? "cm" : "in"}</th>
                <th className="num">Come-up {metric ? "mil" : "MOA"}</th>
                <th className="num">Wind drift {metric ? "cm" : "in"}</th>
                <th className="num">Velocity {v.unit}</th>
                <th className="num">Energy {e.unit}</th>
                <th className="num">Time s</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.range} data-zero={r.range === zero} data-sub={r.subsonic}>
                  <td className="num" style={{ fontWeight: 600 }}>
                    {r.range}
                  </td>
                  <td className="num">{signed(path(r.pathIn))}</td>
                  <td className="num">{Math.abs(r.comeUp) < 0.05 ? "0.0" : `${r.comeUp > 0 ? "↑" : "↓"} ${Math.abs(r.comeUp).toFixed(1)}`}</td>
                  <td className="num">{path(r.windIn)}</td>
                  <td className="num">{fmtVelocity(r.velocityFps, units).value}</td>
                  <td className="num">{fmtEnergy(r.energyFtLb, units).value}</td>
                  <td className="num">{r.timeS.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="fine">
          Point-mass solver with the standard {load.dragModel} drag table, computed in your browser.
          {rows.some((r) => r.subsonic) && " Velocities in orange are below the speed of sound."} Your rifle, lot and weather will differ.
        </p>
      </section>
    </>
  );
}
