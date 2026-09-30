// Reads data/ and checks it: each file against its schema, then the links between files. Used by the
// site build (which refuses bad data) and by `npm run validate` (which lists every problem at once).

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import YAML from "yaml";
import type { z } from "zod";
import {
  CaliberSchema,
  LoadSchema,
  SourcesFileSchema,
  type CaliberFile,
  type InlineSource,
  type LoadFile,
} from "./schema";

export interface Source extends InlineSource {
  /** Id in data/sources.yaml, for shared sources. */
  id?: string;
}

export interface Load extends Omit<LoadFile, "sources"> {
  sources: Source[];
  /** Path of the file, relative to the repository root. */
  file: string;
}

export interface Caliber extends CaliberFile {
  file: string;
}

export interface Dataset {
  calibers: Caliber[];
  loads: Load[];
  sources: Record<string, InlineSource>;
}

export interface Problem {
  file: string;
  message: string;
}

export interface DatasetResult {
  data: Dataset;
  errors: Problem[];
  warnings: Problem[];
}

const rel = (root: string, p: string) => path.relative(root, p).split(path.sep).join("/");

function parseFile<S extends z.ZodType>(root: string, file: string, schema: S, errors: Problem[]): z.infer<S> | null {
  const where = rel(root, file);
  let raw: unknown;
  try {
    const doc = YAML.parseDocument(readFileSync(file, "utf8"), { prettyErrors: true, uniqueKeys: true });
    if (doc.errors.length) {
      for (const e of doc.errors) errors.push({ file: where, message: e.message });
      return null;
    }
    raw = doc.toJS();
  } catch (e) {
    errors.push({ file: where, message: (e as Error).message });
    return null;
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const at = issue.path.length ? `${issue.path.join(".")}: ` : "";
      errors.push({ file: where, message: `${at}${issue.message}` });
    }
    return null;
  }
  return parsed.data;
}

const yamlFiles = (dir: string) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((d) => d.isFile() && /\.ya?ml$/.test(d.name))
        .map((d) => path.join(dir, d.name))
        .sort()
    : [];

const stem = (file: string) => path.basename(file).replace(/\.ya?ml$/, "");

export function readDataset(root: string): DatasetResult {
  const errors: Problem[] = [];
  const warnings: Problem[] = [];
  const dataDir = path.join(root, "data");

  // Shared sources.
  const sourcesFile = path.join(dataDir, "sources.yaml");
  const sources = (existsSync(sourcesFile) && parseFile(root, sourcesFile, SourcesFileSchema, errors)) || {};

  // Calibers.
  const calibers: Caliber[] = [];
  for (const file of yamlFiles(path.join(dataDir, "calibers"))) {
    const c = parseFile(root, file, CaliberSchema, errors);
    if (!c) continue;
    if (c.id !== stem(file)) errors.push({ file: rel(root, file), message: `id "${c.id}" must match the file name "${stem(file)}"` });
    calibers.push({ ...c, file: rel(root, file) });
  }
  calibers.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const caliberIds = new Set(calibers.map((c) => c.id));

  // Loads, one folder per caliber.
  const loadsDir = path.join(dataDir, "loads");
  const folders = existsSync(loadsDir)
    ? readdirSync(loadsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()
    : [];
  const loads: Load[] = [];
  const seen = new Map<string, string>();
  const citedIds = new Set<string>();
  for (const folder of folders) {
    if (!caliberIds.has(folder))
      errors.push({ file: `data/loads/${folder}/`, message: `no caliber "${folder}" in data/calibers/` });
    for (const file of yamlFiles(path.join(loadsDir, folder))) {
      const where = rel(root, file);
      const l = parseFile(root, file, LoadSchema, errors);
      if (!l) continue;
      if (l.id !== stem(file)) errors.push({ file: where, message: `id "${l.id}" must match the file name "${stem(file)}"` });
      if (l.caliber !== folder) errors.push({ file: where, message: `caliber "${l.caliber}" must match the folder "${folder}"` });
      const dup = seen.get(l.id);
      if (dup) errors.push({ file: where, message: `id "${l.id}" is already used by ${dup}` });
      seen.set(l.id, where);

      const resolved: Source[] = [];
      for (const s of l.sources) {
        if (typeof s === "string") {
          citedIds.add(s);
          const shared = sources[s];
          if (shared) resolved.push({ id: s, ...shared });
          else errors.push({ file: where, message: `sources: no source "${s}" in data/sources.yaml` });
        } else resolved.push(s);
      }
      loads.push({ ...l, sources: resolved, file: where });
    }
  }

  // Links between loads, and a few plausibility checks that only warn.
  const byId = new Map(loads.map((l) => [l.id, l]));
  for (const l of loads) {
    if (l.sameAs) {
      const target = byId.get(l.sameAs);
      if (!target) errors.push({ file: l.file, message: `sameAs: no load with id "${l.sameAs}"` });
      else if (target.caliber !== l.caliber) errors.push({ file: l.file, message: `sameAs: "${l.sameAs}" is a different caliber` });
      else if (target.brand) errors.push({ file: l.file, message: `sameAs: "${l.sameAs}" is a factory load, not a standard type` });
    }
    const cal = calibers.find((c) => c.id === l.caliber);
    if (cal && Math.abs(cal.bulletDiameterIn - l.diameterIn) > 0.005)
      warnings.push({ file: l.file, message: `diameterIn ${l.diameterIn} differs from the caliber's ${cal.bulletDiameterIn}` });
    const mv = l.mvByBarrel;
    for (let i = 1; i < mv.length; i++)
      if (mv[i][1] < mv[i - 1][1] - 25)
        warnings.push({ file: l.file, message: `velocity drops from ${mv[i - 1][1]} to ${mv[i][1]} fps between ${mv[i - 1][0]} and ${mv[i][0]} in` });
    if (l.brand && !l.sku) warnings.push({ file: l.file, message: "factory load without sku: box codes help people find it" });
  }
  for (const id of Object.keys(sources))
    if (!citedIds.has(id)) warnings.push({ file: "data/sources.yaml", message: `source "${id}" is not cited by any load` });

  return { data: { calibers, loads, sources }, errors, warnings };
}
