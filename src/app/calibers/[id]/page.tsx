import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cartridge } from "@/components/cartridge";
import { CatalogProvider, CatalogTable } from "@/components/catalog";
import { getCaliber, getCalibers, getLoads } from "@/lib/data";
import { brandNames, caliberNames, catalogRows } from "@/lib/rows";
import { editUrl, newLoadUrl } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCalibers().map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/calibers/[id]">): Promise<Metadata> {
  const c = getCaliber((await params).id);
  return c ? { title: c.name, description: c.description } : {};
}

const TEMPLATE = (caliber: string, diameter: number) => `# yaml-language-server: $schema=../../../schema/load.schema.json
# Rename this file to <id>.yaml. See CONTRIBUTING.md for every field.
id: brand-product-weight
caliber: ${caliber}
brand: Brand
name: Brand Product 00 gr BULLET
short: Short name
sku: [BOXCODE]
weightGr: 0
diameterIn: ${diameter}
bc: 0
dragModel: G1
platform: ar15
confidence: low
# [barrel length in, muzzle velocity fps], shortest barrel first
mvByBarrel:
  - [16, 0]
notes: >-
  How and where the velocity was measured.
sources:
  - label: Where the numbers came from
    url: https://
`;

export default async function CaliberPage({ params }: PageProps<"/calibers/[id]">) {
  const c = getCaliber((await params).id);
  if (!c) notFound();
  const loads = getLoads().filter((l) => l.caliber === c.id);
  const standard = loads.filter((l) => !l.brand).length;
  const w = loads.map((l) => l.weightGr);
  const rows = catalogRows((l) => l.caliber === c.id);

  return (
    <div className="wrap">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/calibers">Calibers</Link>
        <span aria-hidden="true">/</span>
        <span>{c.name}</span>
      </nav>
      <section className="caliber-hero">
        <div className="drawing">
          <Cartridge drawing={c.drawing} scale={3.2} height={250} title={`${c.short} cartridge outline`} />
        </div>
        <div className="text">
          <div className="eyebrow">Caliber · {c.bulletDiameterIn.toFixed(3)} in bullet</div>
          <h1>{c.name}</h1>
          <p className="lede">{c.description}</p>
          {c.aliases.length > 0 && (
            <div className="aliases" aria-label="Also known as">
              {c.aliases.map((a) => (
                <span key={a} className="tag">
                  {a}
                </span>
              ))}
            </div>
          )}
          <div className="stat-row" style={{ maxWidth: 520, marginTop: 8 }}>
            <div className="stat">
              <b>{loads.length}</b>
              <span>loads</span>
            </div>
            <div className="stat">
              <b>{standard}</b>
              <span>{standard === 1 ? "standard type" : "standard types"}</span>
            </div>
            <div className="stat">
              <b>{w.length ? `${Math.min(...w)}–${Math.max(...w)}` : "–"}</b>
              <span>grains</span>
            </div>
          </div>
        </div>
      </section>

      <CatalogProvider defaultBarrelIn={c.defaultBarrelIn}>
        <CatalogTable
          rows={rows}
          calibers={[]}
          brands={brandNames(loads)}
          barrelOptions={c.barrelPresetsIn}
          caliberNames={caliberNames()}
          showCaliberChips={false}
        />
      </CatalogProvider>

      <div className="file-strip">
        <span>
          Missing a load? Add <code>data/loads/{c.id}/&lt;id&gt;.yaml</code>
        </span>
        <nav>
          <a href={newLoadUrl(c.id, TEMPLATE(c.id, c.bulletDiameterIn))}>Add a load on GitHub</a>
          <a href={editUrl(c.file)}>Edit this caliber</a>
        </nav>
      </div>
      <div className="page-end" />
    </div>
  );
}
