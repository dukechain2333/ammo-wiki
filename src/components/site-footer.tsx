import Link from "next/link";
import { REPO_URL, ZERO_TARGETS_URL } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <span>
          Data <a href={`${REPO_URL}/blob/main/data/LICENSE.md`}>CC BY-SA 4.0</a> · Code{" "}
          <a href={`${REPO_URL}/blob/main/LICENSE`}>MIT</a> · Velocity data seeded from{" "}
          <a href={ZERO_TARGETS_URL}>zero-targets</a> · <Link href="/contribute">Contribute</Link>
        </span>
        <span>Numbers are for reference. Chronograph your own ammunition.</span>
      </div>
    </footer>
  );
}
