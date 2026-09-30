import type { Metadata } from "next";
import { CaliberCards } from "@/components/caliber-cards";
import { getCalibers, getLoads } from "@/lib/data";

export const metadata: Metadata = { title: "Calibers" };

export default function CalibersPage() {
  return (
    <div className="wrap">
      <section className="section">
        <div className="eyebrow">Calibers</div>
        <h1 style={{ fontSize: 44 }}>Calibers</h1>
        <p className="lede">Cartridges drawn to scale. A new caliber is one file in data/calibers/ plus a folder of loads.</p>
        <CaliberCards calibers={getCalibers()} loads={getLoads()} />
      </section>
      <div className="page-end" />
    </div>
  );
}
