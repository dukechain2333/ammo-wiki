// Builds the client catalog's rows and filter options from the dataset (server side).

import "server-only";
import type { CaliberChip, CatalogRow } from "./catalog";
import { followersOf, getCalibers, getLoads } from "./data";
import type { Load } from "./dataset";
import { normalize } from "./search";

const ownText = (l: Load) => `${l.brand ?? ""} ${l.name} ${l.standard ?? ""} ${l.short} ${l.sku?.join(" ") ?? ""} ${l.weightGr}gr ${l.dragModel}`;

export function catalogRows(filter: (l: Load) => boolean = () => true): CatalogRow[] {
  const calibers = new Map(getCalibers().map((c) => [c.id, c]));
  const order = new Map(getCalibers().map((c, i) => [c.id, i]));
  const loads = getLoads().filter(filter);
  // Within a caliber: standard types first (by weight), then factory loads by brand, weight and name.
  loads.sort(
    (a, b) =>
      order.get(a.caliber)! - order.get(b.caliber)! ||
      Number(a.brand != null) - Number(b.brand != null) ||
      (a.brand ?? "").localeCompare(b.brand ?? "") ||
      a.weightGr - b.weightGr ||
      a.name.localeCompare(b.name),
  );
  return loads.map((l) => {
    const cal = calibers.get(l.caliber)!;
    const followers = followersOf(l.id);
    // A standard type also answers to the factory loads made to it, so "XM855" finds M855.
    const haystack = normalize(`${cal.name} ${cal.short} ${cal.aliases.join(" ")} ${ownText(l)} ${followers.map(ownText).join(" ")}`);
    return {
      id: l.id,
      caliber: l.caliber,
      brand: l.brand,
      name: l.name,
      sku: l.sku,
      isStandard: !l.brand || l.standard != null,
      standard: l.standard,
      followers: followers.length,
      weightGr: l.weightGr,
      bc: l.bc,
      dragModel: l.dragModel,
      confidence: l.confidence,
      mvByBarrel: l.mvByBarrel,
      sourceCount: l.sources.length,
      haystack,
    };
  });
}

export function caliberChips(): CaliberChip[] {
  const loads = getLoads();
  return getCalibers().map((c) => ({ id: c.id, short: c.short, count: loads.filter((l) => l.caliber === c.id).length }));
}

export const caliberNames = () => Object.fromEntries(getCalibers().map((c) => [c.id, c.short]));

export const brandNames = (loads: Load[] = getLoads()) => [...new Set(loads.flatMap((l) => (l.brand ? [l.brand] : [])))].sort();

/** Barrel lengths for the catalog's "MV at barrel" picker: every caliber's presets. */
export const allBarrelPresets = () => [...new Set(getCalibers().flatMap((c) => c.barrelPresetsIn))].sort((a, b) => a - b);
