// Server-side access to the dataset. Read once per build; bad data fails the build with the same
// messages `npm run validate` prints.

import "server-only";
import { readDataset, type Caliber, type Dataset, type Load } from "./dataset";

let cached: Dataset | null = null;

export function getDataset(): Dataset {
  if (cached) return cached;
  const { data, errors } = readDataset(process.cwd());
  if (errors.length) {
    throw new Error(`Invalid data (run npm run validate):\n${errors.map((e) => `  ${e.file}: ${e.message}`).join("\n")}`);
  }
  cached = data;
  return data;
}

export const getLoads = () => getDataset().loads;
export const getCalibers = () => getDataset().calibers;
export const getLoad = (id: string): Load | undefined => getLoads().find((l) => l.id === id);
export const getCaliber = (id: string): Caliber | undefined => getCalibers().find((c) => c.id === id);

/** Factory loads made to a standard type, e.g. Federal XM193 and PMC X-TAC for M193. */
export const followersOf = (id: string) => getLoads().filter((l) => l.sameAs === id);

export const brandSlug = (brand: string) =>
  brand
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function getBrands(): { name: string; slug: string; loads: Load[] }[] {
  const map = new Map<string, Load[]>();
  for (const l of getLoads()) if (l.brand) map.set(l.brand, [...(map.get(l.brand) ?? []), l]);
  return [...map]
    .map(([name, loads]) => ({ name, slug: brandSlug(name), loads }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Every distinct source with the loads that cite it, shared sources first. */
export function getSourceIndex(): { key: string; id?: string; label: string; url?: string; loads: Load[] }[] {
  const map = new Map<string, { key: string; id?: string; label: string; url?: string; loads: Load[] }>();
  for (const l of getLoads()) {
    for (const s of l.sources) {
      const key = s.id ?? `${s.label}\u0000${s.url ?? ""}`;
      const entry = map.get(key) ?? { key, id: s.id, label: s.label, url: s.url, loads: [] };
      entry.loads.push(l);
      map.set(key, entry);
    }
  }
  return [...map.values()].sort((a, b) => Number(!a.id) - Number(!b.id) || b.loads.length - a.loads.length || a.label.localeCompare(b.label));
}
