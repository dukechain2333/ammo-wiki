"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CONFIDENCE_RANK, type CaliberChip, type CatalogRow } from "@/lib/catalog";
import { energyFtLb, estimateMuzzleVelocity } from "@/lib/mv";
import { matches, queryPatterns } from "@/lib/search";
import { barrel as fmtBarrel, energy as fmtEnergy, velocity as fmtVelocity, weight as fmtWeight } from "@/lib/units";
import { Confidence } from "./confidence";
import { SearchIcon, SortIcon } from "./icons";
import { UnitsToggle, useUnits } from "./units";

type View = "all" | "standard" | "factory";
type SortKey = "default" | "name" | "weight" | "bc" | "mv" | "energy" | "confidence";

interface State {
  q: string;
  caliber: string;
  view: View;
  brand: string;
  minConfidence: number;
  barrelIn: number;
  sort: SortKey;
  desc: boolean;
}

const CatalogContext = createContext<{ state: State; set: (patch: Partial<State>) => void } | null>(null);

const useCatalog = () => {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("Catalog parts must sit inside <CatalogProvider>");
  return ctx;
};

/**
 * Holds the catalog's filters so the hero search and the table below can share them. With `syncUrl`,
 * the query and caliber are read from and written to the address bar (?q=…&cal=…).
 */
export function CatalogProvider({
  children,
  syncUrl = false,
  defaultBarrelIn = 16,
}: {
  children: React.ReactNode;
  syncUrl?: boolean;
  defaultBarrelIn?: number;
}) {
  const [state, setState] = useState<State>({
    q: "",
    caliber: "all",
    view: "all",
    brand: "",
    minConfidence: 0,
    barrelIn: defaultBarrelIn,
    sort: "default",
    desc: false,
  });
  const set = (patch: Partial<State>) => setState((s) => ({ ...s, ...patch }));

  const loaded = useRef(false);
  useEffect(() => {
    if (!syncUrl) return;
    const p = new URLSearchParams(window.location.search);
    const patch: Partial<State> = {};
    if (p.get("q")) patch.q = p.get("q")!;
    if (p.get("cal")) patch.caliber = p.get("cal")!;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the address bar only exists in the browser
    if (Object.keys(patch).length) setState((s) => ({ ...s, ...patch }));
    loaded.current = true;
  }, [syncUrl]);
  useEffect(() => {
    if (!syncUrl || !loaded.current) return;
    const p = new URLSearchParams(window.location.search);
    if (state.q) p.set("q", state.q);
    else p.delete("q");
    if (state.caliber !== "all") p.set("cal", state.caliber);
    else p.delete("cal");
    const qs = p.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
  }, [syncUrl, state.q, state.caliber]);

  return <CatalogContext.Provider value={{ state, set }}>{children}</CatalogContext.Provider>;
}

const TRIES = ["XM855", "77 gr", "Gold Dot", "subsonic", "ELD Match"];

/** The large search box in the home page hero. */
export function HeroSearch() {
  const { state, set } = useCatalog();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const jump = () => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <>
      <form
        role="search"
        className="big-search"
        action="/"
        onSubmit={(e) => {
          e.preventDefault();
          jump();
        }}
      >
        <SearchIcon size={20} />
        <label htmlFor="hero-q" className="sr-only">
          Search loads
        </label>
        <input
          ref={input}
          id="hero-q"
          name="q"
          type="search"
          autoComplete="off"
          placeholder="Search by caliber, brand, weight or box code"
          value={state.q}
          onChange={(e) => set({ q: e.target.value })}
        />
        <span className="kbd" aria-hidden="true">
          /
        </span>
      </form>
      <div className="tries">
        <span className="muted">Try</span>
        {TRIES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              set({ q: t, caliber: "all" });
              jump();
            }}
          >
            {t}
          </button>
        ))}
      </div>
    </>
  );
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const PAGE = 60;

export function CatalogTable({
  rows,
  calibers,
  brands,
  barrelOptions,
  caliberNames,
  showCaliberChips = true,
  showBrandFilter = true,
}: {
  rows: CatalogRow[];
  calibers: CaliberChip[];
  brands: string[];
  barrelOptions: number[];
  /** Caliber id -> short name, for the caliber column. */
  caliberNames: Record<string, string>;
  showCaliberChips?: boolean;
  showBrandFilter?: boolean;
}) {
  const { state, set } = useCatalog();
  const { units } = useUnits();
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    const patterns = queryPatterns(state.q);
    const out = rows.filter(
      (r) =>
        (state.caliber === "all" || r.caliber === state.caliber) &&
        (state.view === "all" || (state.view === "standard" ? r.isStandard : !r.isStandard)) &&
        (!state.brand || r.brand === state.brand) &&
        CONFIDENCE_RANK[r.confidence] >= state.minConfidence &&
        (!patterns.length || matches(r.haystack, patterns)),
    );
    const withMv = out.map((r) => {
      const mv = estimateMuzzleVelocity(r, state.barrelIn);
      return { r, mv, energy: energyFtLb(r.weightGr, mv.fps) };
    });
    if (state.sort === "default") return withMv;
    const key = {
      name: (x: (typeof withMv)[number]) => x.r.name,
      weight: (x: (typeof withMv)[number]) => x.r.weightGr,
      bc: (x: (typeof withMv)[number]) => x.r.bc,
      mv: (x: (typeof withMv)[number]) => x.mv.fps,
      energy: (x: (typeof withMv)[number]) => x.energy,
      confidence: (x: (typeof withMv)[number]) => CONFIDENCE_RANK[x.r.confidence],
    }[state.sort];
    const dir = state.desc ? -1 : 1;
    return [...withMv].sort((a, b) => {
      const ka = key(a);
      const kb = key(b);
      return (typeof ka === "string" ? ka.localeCompare(kb as string) : (ka as number) - (kb as number)) * dir;
    });
  }, [rows, state]);

  const visible = showAll ? filtered : filtered.slice(0, PAGE);
  const showCaliberCol = showCaliberChips && state.caliber === "all";
  const barrelLabel = fmtBarrel(state.barrelIn, units);

  const sortButton = (key: SortKey, label: React.ReactNode) => {
    const active = state.sort === key;
    return (
      <button
        type="button"
        className="sort"
        data-active={active}
        onClick={() =>
          set(active ? (state.desc ? { sort: "default", desc: false } : { desc: true }) : { sort: key, desc: key !== "name" })
        }
        aria-label={`Sort by ${typeof label === "string" ? label : key}`}
      >
        {label}
        <SortIcon dir={active ? (state.desc ? "desc" : "asc") : null} />
      </button>
    );
  };
  const ariaSort = (key: SortKey) => (state.sort === key ? (state.desc ? "descending" : "ascending") : undefined);

  const caliberCount = (id: string) => calibers.find((c) => c.id === id)?.count ?? 0;
  const total = state.caliber === "all" ? rows.length : caliberCount(state.caliber);

  return (
    <div className="section" style={{ paddingTop: 0 }}>
      {showCaliberChips && (
        <div className="chips" role="group" aria-label="Caliber">
          <button type="button" className="pill" aria-pressed={state.caliber === "all"} onClick={() => set({ caliber: "all" })}>
            All <span className="count">{rows.length}</span>
          </button>
          {calibers.map((c) => (
            <button key={c.id} type="button" className="pill" aria-pressed={state.caliber === c.id} onClick={() => set({ caliber: c.id })}>
              {c.short} <span className="count">{c.count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="card filters">
        <label className="inline-search">
          <SearchIcon />
          <span className="sr-only">Filter loads</span>
          <input type="search" placeholder="Filter" value={state.q} onChange={(e) => set({ q: e.target.value })} />
        </label>
        <div className="seg" role="group" aria-label="Kind of load">
          {(
            [
              ["all", "All loads"],
              ["standard", "Standard types"],
              ["factory", "Factory"],
            ] as const
          ).map(([v, label]) => (
            <button key={v} type="button" aria-pressed={state.view === v} onClick={() => set({ view: v })}>
              {label}
            </button>
          ))}
        </div>
        {showBrandFilter && (
          <label className="field">
            <span className="sr-only">Brand</span>
            <select value={state.brand} onChange={(e) => set({ brand: e.target.value })}>
              <option value="">Any brand</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="field">
          <span className="sr-only">Velocity data confidence</span>
          <select value={state.minConfidence} onChange={(e) => set({ minConfidence: Number(e.target.value) })}>
            <option value={0}>Any confidence</option>
            <option value={3}>High confidence</option>
            <option value={2}>Medium or better</option>
          </select>
        </label>
        <span className="grow" />
        <label className="field">
          MV at barrel
          <select value={state.barrelIn} onChange={(e) => set({ barrelIn: Number(e.target.value) })} className="mono">
            {barrelOptions.map((b) => {
              const f = fmtBarrel(b, units);
              return (
                <option key={b} value={b}>
                  {f.value} {f.unit}
                </option>
              );
            })}
          </select>
        </label>
        <UnitsToggle />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data-table" style={{ minWidth: showCaliberCol ? 980 : 860 }}>
            <thead>
              <tr>
                <th aria-sort={ariaSort("name")}>{sortButton("name", "Load")}</th>
                {showCaliberCol && <th>Caliber</th>}
                <th className="num" aria-sort={ariaSort("weight")}>
                  {sortButton("weight", "Bullet")}
                </th>
                <th className="num" aria-sort={ariaSort("bc")}>
                  {sortButton("bc", "BC")}
                </th>
                <th className="num" aria-sort={ariaSort("mv")}>
                  {sortButton("mv", `MV @ ${barrelLabel.value}${units === "metric" ? " mm" : "″"}`)}
                </th>
                <th className="num" aria-sort={ariaSort("energy")}>
                  {sortButton("energy", "Energy")}
                </th>
                <th aria-sort={ariaSort("confidence")}>{sortButton("confidence", "Velocity data")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(({ r, mv, energy }) => {
                const v = fmtVelocity(mv.fps, units);
                const e = fmtEnergy(energy, units);
                const w = fmtWeight(r.weightGr, units);
                const meta = !r.brand
                  ? r.followers
                    ? `Standard type · ${plural(r.followers, "factory load")}`
                    : "Standard type"
                  : r.standard
                    ? `${r.brand} · as ${r.standard}`
                    : [r.brand, ...(r.sku?.slice(0, 3) ?? [])].join(" · ");
                return (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/loads/${r.id}`} className="load-link">
                        <b>{r.name}</b>
                        <small>{meta}</small>
                      </Link>
                    </td>
                    {showCaliberCol && <td style={{ whiteSpace: "nowrap" }}>{caliberNames[r.caliber]}</td>}
                    <td className="num">
                      {w.value} <span className="unit">{w.unit}</span>
                    </td>
                    <td className="num">
                      {r.bc.toFixed(3)} <span className="unit">{r.dragModel}</span>
                    </td>
                    <td className="num" style={{ fontWeight: 600 }} title={mv.extrapolated ? "Outside the barrel lengths that were measured" : undefined}>
                      {mv.extrapolated && <span className="approx">≈</span>}
                      {v.value} <span className="unit">{v.unit}</span>
                    </td>
                    <td className="num">
                      {e.value} <span className="unit">{e.unit}</span>
                    </td>
                    <td>
                      <Confidence level={r.confidence} extra={<span className="muted">{plural(r.sourceCount, "source")}</span>} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filtered.length && (
            <p className="empty">
              No loads match. <Link href="/contribute">Add one</Link>?
            </p>
          )}
        </div>
        <div className="table-foot">
          <span>
            {filtered.length === total ? `${plural(total, "load")}` : `${filtered.length} of ${plural(total, "load")}`}
            {filtered.some((x) => x.mv.extrapolated) && " · ≈ outside the measured barrel lengths"}
          </span>
          {filtered.length > PAGE && (
            <button type="button" className="btn" onClick={() => setShowAll((s) => !s)}>
              {showAll ? `Show the first ${PAGE}` : `Show all ${filtered.length}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
