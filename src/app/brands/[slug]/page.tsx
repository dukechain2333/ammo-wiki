import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogProvider, CatalogTable } from "@/components/catalog";
import { getBrands, getCalibers } from "@/lib/data";
import { allBarrelPresets, caliberNames, catalogRows } from "@/lib/rows";

export const dynamicParams = false;

export function generateStaticParams() {
  return getBrands().map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: PageProps<"/brands/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const b = getBrands().find((x) => x.slug === slug);
  return b ? { title: `${b.name} ammunition`, description: `${b.loads.length} ${b.name} loads with muzzle velocity by barrel length and sources.` } : {};
}

export default async function BrandPage({ params }: PageProps<"/brands/[slug]">) {
  const { slug } = await params;
  const b = getBrands().find((x) => x.slug === slug);
  if (!b) notFound();
  const rows = catalogRows((l) => l.brand === b.name);
  const chips = getCalibers()
    .map((c) => ({ id: c.id, short: c.short, count: rows.filter((r) => r.caliber === c.id).length }))
    .filter((c) => c.count > 0);

  return (
    <div className="wrap">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/brands">Brands</Link>
        <span aria-hidden="true">/</span>
        <span>{b.name}</span>
      </nav>
      <section className="section" style={{ paddingTop: 16, paddingBottom: 24 }}>
        <div className="eyebrow">Brand</div>
        <h1 style={{ fontSize: 44 }}>{b.name}</h1>
        <p className="lede">
          {b.loads.length} {b.loads.length === 1 ? "load" : "loads"} in {chips.length} {chips.length === 1 ? "caliber" : "calibers"}.
        </p>
      </section>
      <CatalogProvider>
        <CatalogTable
          rows={rows}
          calibers={chips}
          brands={[]}
          barrelOptions={allBarrelPresets()}
          caliberNames={caliberNames()}
          showCaliberChips={chips.length > 1}
          showBrandFilter={false}
        />
      </CatalogProvider>
      <div className="page-end" />
    </div>
  );
}
