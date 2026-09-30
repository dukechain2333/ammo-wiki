import type { Metadata } from "next";
import Link from "next/link";
import { getBrands } from "@/lib/data";

export const metadata: Metadata = { title: "Brands" };

export default function BrandsPage() {
  const brands = getBrands();
  return (
    <div className="wrap">
      <section className="section">
        <div className="eyebrow">Brands</div>
        <h1 style={{ fontSize: 44 }}>Brands</h1>
        <p className="lede">
          {brands.length} makers. Generic and military-spec types (M193, M855, M80…) have no brand; they are listed on each
          caliber page.
        </p>
        <div className="list-grid">
          {brands.map((b) => (
            <Link key={b.slug} href={`/brands/${b.slug}`}>
              <span>{b.name}</span>
              <span className="mono">{b.loads.length}</span>
            </Link>
          ))}
        </div>
      </section>
      <div className="page-end" />
    </div>
  );
}
