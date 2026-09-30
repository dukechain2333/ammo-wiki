import Link from "next/link";
import { CaliberCards } from "@/components/caliber-cards";
import { CatalogProvider, CatalogTable, HeroSearch } from "@/components/catalog";
import { getBrands, getCalibers, getLoads, getSourceIndex } from "@/lib/data";
import { allBarrelPresets, brandNames, caliberChips, caliberNames, catalogRows } from "@/lib/rows";

export default function Home() {
  const loads = getLoads();
  const calibers = getCalibers();
  const n = (c: string) => loads.filter((l) => l.confidence === c).length;
  const conf = [
    { key: "high", count: n("high"), color: "var(--hi)", text: "high: own chronograph series" },
    { key: "medium", count: n("medium"), color: "var(--mid-bar)", text: "medium" },
    { key: "low", count: n("low"), color: "var(--low-bar)", text: "low: one reading or maker rating" },
  ];
  const built = new Date().toISOString().slice(0, 10);

  return (
    <CatalogProvider syncUrl>
      <section className="hero">
        <div className="wrap">
          <div className="hero-main">
            <div className="eyebrow">Open ammunition reference</div>
            <h1>
              Every load,
              <br />
              measured and sourced.
            </h1>
            <p className="lede">
              Bullet weight, ballistic coefficient and muzzle velocity by barrel length for factory and military ammunition.
              Each number links to the chronograph test or spec sheet it came from, and anyone can correct it with a pull
              request.
            </p>
            <HeroSearch />
          </div>

          <div className="card stats">
            <div className="stat-row">
              <div className="stat">
                <b>{loads.length}</b>
                <span>loads</span>
              </div>
              <div className="stat">
                <b>{calibers.length}</b>
                <span>calibers</span>
              </div>
              <div className="stat">
                <b>{getBrands().length}</b>
                <span>brands</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600 }}>How much of the velocity data is measured</span>
                <Link href="/contribute#confidence" style={{ color: "var(--ink-2)" }}>
                  What this means
                </Link>
              </div>
              <div className="stack-bar" role="img" aria-label={conf.map((c) => `${c.count} ${c.key}`).join(", ")}>
                {conf.map((c) => (
                  <div key={c.key} style={{ width: `${(100 * c.count) / loads.length}%`, background: c.color }} />
                ))}
              </div>
              <div className="legend">
                {conf.map((c) => (
                  <span key={c.key}>
                    <span className="swatch" style={{ background: c.color }} />
                    {c.count} {c.text}
                  </span>
                ))}
              </div>
            </div>
            <div className="stats-foot">
              Built {built} · {getSourceIndex().length} sources · data CC BY-SA 4.0
            </div>
          </div>
        </div>
      </section>

      <div className="wrap">
        <section id="calibers" className="section">
          <div className="section-head">
            <h2>Calibers</h2>
            <span className="muted" style={{ fontSize: 13 }}>
              Cartridges drawn to scale
            </span>
          </div>
          <CaliberCards calibers={calibers} loads={loads} />
        </section>

        <section id="catalog" className="section" style={{ scrollMarginTop: 16 }}>
          <div className="section-head">
            <h2>Catalog</h2>
            <span className="muted" style={{ fontSize: 13 }}>
              MV is muzzle velocity at the barrel length you pick
            </span>
          </div>
          <CatalogTable
            rows={catalogRows()}
            calibers={caliberChips()}
            brands={brandNames()}
            barrelOptions={allBarrelPresets()}
            caliberNames={caliberNames()}
          />
        </section>
      </div>

      <section className="cta">
        <div className="wrap">
          <div>
            <h2>Have a chronograph test we don’t?</h2>
            <p>
              Every load is one YAML file in the repository. Add a file or fix a number, open a pull request, and the checks and
              a preview build run on it before anyone merges.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <ol>
              <li>
                <span>01</span>data/loads/556-nato/your-load.yaml
              </li>
              <li>
                <span>02</span>npm run validate
              </li>
              <li>
                <span>03</span>open a pull request
              </li>
            </ol>
            <Link href="/contribute" className="btn btn-brass" style={{ alignSelf: "flex-start" }}>
              Read the contributor guide
            </Link>
          </div>
        </div>
      </section>
    </CatalogProvider>
  );
}
