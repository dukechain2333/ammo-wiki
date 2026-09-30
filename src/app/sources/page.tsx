import type { Metadata } from "next";
import Link from "next/link";
import { getSourceIndex } from "@/lib/data";
import { blobUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Sources" };

export default function SourcesPage() {
  const sources = getSourceIndex();
  const shared = sources.filter((s) => s.id);
  const single = sources.filter((s) => !s.id);
  const list = (items: typeof sources) => (
    <ul className="source-list">
      {items.map((s) => (
        <li key={s.key}>
          <span style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
            {s.url ? <a href={s.url}>{s.label}</a> : <span>{s.label}</span>}
            {s.id && <span className="tag">{s.id}</span>}
          </span>
          <span className="cites">
            <span className="muted">
              Cited by {s.loads.length} {s.loads.length === 1 ? "load" : "loads"}:
            </span>
            {s.loads.map((l) => (
              <Link key={l.id} href={`/loads/${l.id}`}>
                {l.short}
              </Link>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="wrap">
      <section className="section">
        <div className="eyebrow">Sources</div>
        <h1 style={{ fontSize: 44 }}>Where the numbers come from</h1>
        <p className="lede">
          {sources.length} sources: chronograph tests, makers’ spec pages and manuals. Shared ones live in{" "}
          <a href={blobUrl("data/sources.yaml")}>data/sources.yaml</a> and loads cite them by id.
        </p>
        <div className="card">
          <div className="card-head">
            <h2>Shared sources</h2>
            <span className="muted" style={{ fontSize: 13 }}>
              {shared.length}
            </span>
          </div>
          {list(shared)}
        </div>
        <div className="card">
          <div className="card-head">
            <h2>Cited in a load file</h2>
            <span className="muted" style={{ fontSize: 13 }}>
              {single.length}
            </span>
          </div>
          {list(single)}
        </div>
      </section>
      <div className="page-end" />
    </div>
  );
}
