import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Confidence, CONFIDENCE_LABEL, CONFIDENCE_TEXT, Meter } from "@/components/confidence";
import { PencilIcon } from "@/components/icons";
import { VelocityPanel } from "@/components/velocity-panel";
import { brandSlug, followersOf, getCaliber, getLoad, getLoads } from "@/lib/data";
import type { Load } from "@/lib/dataset";
import { estimateMuzzleVelocity, sectionalDensity } from "@/lib/mv";
import { blobUrl, editUrl, historyUrl, issueUrl } from "@/lib/site";
import { fmtInt, G_PER_GR, MM_PER_IN } from "@/lib/units";

export const dynamicParams = false;

export function generateStaticParams() {
  return getLoads().map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: PageProps<"/loads/[id]">): Promise<Metadata> {
  const { id } = await params;
  const l = getLoad(id);
  if (!l) return {};
  const cal = getCaliber(l.caliber)!;
  const mv = estimateMuzzleVelocity(l, cal.defaultBarrelIn);
  return {
    title: l.name,
    description: `${l.name} (${cal.short}): ${l.weightGr} gr, BC ${l.bc} ${l.dragModel}, about ${fmtInt(mv.fps)} fps from a ${cal.defaultBarrelIn} in barrel. Muzzle velocity by barrel length with sources.`,
  };
}

const PLATFORM = { ar15: "AR-15 size", ar10: "AR-10 size" } as const;

function host(url?: string) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Loads to list under the sources: siblings made to the same type, the factory loads made to this type, or near weights. */
function relatedLoads(l: Load): { title: string; loads: Load[] } {
  if (l.sameAs) {
    const target = getLoad(l.sameAs)!;
    return { title: `Other loads made to ${target.name}`, loads: [target, ...followersOf(target.id).filter((x) => x.id !== l.id)] };
  }
  const followers = followersOf(l.id);
  if (followers.length) return { title: `Factory loads made to this type`, loads: followers };
  const near = getLoads()
    .filter((x) => x.caliber === l.caliber && x.id !== l.id && Math.abs(x.weightGr - l.weightGr) <= 3)
    .slice(0, 8);
  return { title: `Other ${l.weightGr} gr loads in this caliber`, loads: near };
}

export default async function LoadPage({ params }: PageProps<"/loads/[id]">) {
  const { id } = await params;
  const l = getLoad(id);
  if (!l) notFound();
  const cal = getCaliber(l.caliber)!;
  const sameAs = l.sameAs ? getLoad(l.sameAs) : undefined;
  const followers = followersOf(l.id);
  const related = relatedLoads(l);
  const ref = cal.defaultBarrelIn;
  const lengths = l.mvByBarrel.map((p) => p[0]);
  const defaultBarrel = cal.barrelPresetsIn.includes(ref) ? ref : cal.barrelPresetsIn[Math.floor(cal.barrelPresetsIn.length / 2)];

  const spec: { k: string; v: React.ReactNode; sub?: React.ReactNode }[] = [
    { k: "Caliber", v: <Link href={`/calibers/${cal.id}`}>{cal.short}</Link>, sub: cal.name !== cal.short ? cal.name : undefined },
    ...(l.brand ? [{ k: "Maker", v: <Link href={`/brands/${brandSlug(l.brand)}`}>{l.brand}</Link> }] : []),
    { k: "Bullet weight", v: `${l.weightGr} gr`, sub: `${(l.weightGr * G_PER_GR).toFixed(2)} g` },
    { k: "Bullet diameter", v: `${l.diameterIn.toFixed(3)} in`, sub: `${(l.diameterIn * MM_PER_IN).toFixed(2)} mm` },
    { k: "Ballistic coefficient", v: `${l.bc.toFixed(3)} ${l.dragModel}` },
    { k: "Sectional density", v: sectionalDensity(l.weightGr, l.diameterIn).toFixed(3), sub: "lb/in²" },
    { k: "Platform", v: PLATFORM[l.platform] },
    {
      k: "Velocity data",
      v: `${l.mvByBarrel.length} ${l.mvByBarrel.length === 1 ? "point" : "points"}`,
      sub: lengths.length > 1 ? `${lengths[0]} – ${lengths[lengths.length - 1]} in barrels` : `${lengths[0]} in barrel`,
    },
    ...(l.standard ? [{ k: "Stands in for", v: l.standard }] : []),
    ...(l.sku
      ? [
          {
            k: "Box codes",
            v: (
              <span className="tags">
                {l.sku.map((s) => (
                  <span key={s} className="tag">
                    {s}
                  </span>
                ))}
              </span>
            ),
          },
        ]
      : []),
  ];

  const side = (
    <>
      <section className="card" aria-labelledby="spec-title">
        <div className="card-head">
          <h2 id="spec-title">Specifications</h2>
        </div>
        <dl className="spec">
          {spec.map((row) => (
            <div key={row.k}>
              <dt>{row.k}</dt>
              <dd>
                {row.v}
                {row.sub && <small>{row.sub}</small>}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="card card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }} aria-label="Velocity data confidence">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Meter level={l.confidence} large />
          <span style={{ fontFamily: "var(--font-cond)", fontSize: 18, fontWeight: 700 }}>{CONFIDENCE_LABEL[l.confidence]} confidence</span>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "var(--ink-2)" }}>
          {CONFIDENCE_TEXT[l.confidence]} Values between points are interpolated.
        </p>
        <Link href="/contribute#confidence" style={{ fontSize: 13, color: "var(--ink-2)" }}>
          How confidence is graded
        </Link>
      </section>
    </>
  );

  return (
    <div className="wrap">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Catalog</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/calibers/${cal.id}`}>{cal.name}</Link>
        {l.brand && (
          <>
            <span aria-hidden="true">/</span>
            <Link href={`/brands/${brandSlug(l.brand)}`}>{l.brand}</Link>
          </>
        )}
      </nav>

      <section className="title-block">
        <div className="title-main">
          <div className="eyebrow">{l.brand ? `Factory load · ${l.brand}` : `Standard type · ${cal.short}`}</div>
          <h1>{l.name}</h1>
          <div className="title-meta">
            {sameAs && (
              <>
                <span>Made to</span>
                <Link href={`/loads/${sameAs.id}`}>{sameAs.name}</Link>
              </>
            )}
            {!l.brand && followers.length > 0 && (
              <a href="#related">
                {followers.length} factory {followers.length === 1 ? "load" : "loads"} made to this type
              </a>
            )}
            {!sameAs && !followers.length && <span>{cal.name}</span>}
          </div>
        </div>
        <div className="actions">
          <a href={editUrl(l.file)} className="btn btn-primary">
            <PencilIcon />
            Edit this load
          </a>
          <a href={issueUrl("correction.yml", `Correction: ${l.id}`)} className="btn">
            Report a problem
          </a>
        </div>
      </section>

      <VelocityPanel
        load={{ confidence: l.confidence, weightGr: l.weightGr, bc: l.bc, dragModel: l.dragModel, mvByBarrel: l.mvByBarrel }}
        presets={cal.barrelPresetsIn}
        defaultBarrelIn={defaultBarrel}
        tableRangeYd={cal.tableRangeYd}
        defaultZero={cal.tableRangeYd <= 150 ? 50 : 100}
        side={side}
      />

      <div className="two-col">
        <section className="card card-body prose">
          {l.notes && (
            <>
              <h2>Notes</h2>
              <p>{l.notes}</p>
            </>
          )}
          <h2>Sources</h2>
          <ol className="sources">
            {l.sources.map((s, i) => (
              <li key={i}>
                {s.url ? <a href={s.url}>{s.label}</a> : s.label}
                {host(s.url) && <span className="muted"> · {host(s.url)}</span>}
              </li>
            ))}
          </ol>
        </section>

        {related.loads.length > 0 && (
          <section id="related" className="card card-body prose" style={{ gap: 6 }}>
            <h2>{related.title}</h2>
            <ul className="related">
              {related.loads.map((r) => (
                <li key={r.id}>
                  <Link href={`/loads/${r.id}`}>
                    <span>{r.name}</span>
                    <span className="mono">
                      {fmtInt(estimateMuzzleVelocity(r, ref).fps)} fps
                      <Confidence level={r.confidence} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="muted" style={{ fontSize: 12, margin: 0 }}>
              Muzzle velocity at {ref} in.
            </p>
          </section>
        )}
      </div>

      <div className="file-strip">
        <span style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span className="muted">Source file</span>
          <code>{l.file}</code>
        </span>
        <nav aria-label="This file on GitHub">
          <a href={blobUrl(l.file)}>View on GitHub</a>
          <a href={historyUrl(l.file)}>History</a>
          <a href={`/api/loads/${l.id}`}>JSON</a>
        </nav>
      </div>
      <div className="page-end" />
    </div>
  );
}
