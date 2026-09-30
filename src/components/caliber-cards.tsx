import Link from "next/link";
import type { Caliber, Load } from "@/lib/dataset";
import { Cartridge } from "./cartridge";

export function CaliberCards({ calibers, loads }: { calibers: Caliber[]; loads: Load[] }) {
  return (
    <div className="caliber-grid">
      {calibers.map((c) => {
        const own = loads.filter((l) => l.caliber === c.id);
        const w = own.map((l) => l.weightGr);
        return (
          <Link key={c.id} href={`/calibers/${c.id}`} className="caliber-card">
            <div className="stage">
              <Cartridge drawing={c.drawing} />
            </div>
            <div className="body">
              <span className="name">{c.short}</span>
              <span className="alt">{c.aliases.slice(0, 2).join(" · ") || c.name}</span>
              <span className="meta">
                <span>{own.length} loads</span>
                {w.length > 0 && <span>{Math.min(...w) === Math.max(...w) ? `${w[0]} gr` : `${Math.min(...w)}–${Math.max(...w)} gr`}</span>}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
