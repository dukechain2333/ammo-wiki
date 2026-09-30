// Writes schema/*.schema.json from src/lib/schema.ts. Editors with the YAML extension use them for
// autocomplete and inline errors (see the `# yaml-language-server: $schema=` line in each file).
// Run `npm run schema` after changing src/lib/schema.ts; CI fails if the files are out of date.

import { readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { CaliberSchema, LoadSchema, SourcesFileSchema } from "../src/lib/schema";

const targets = [
  { file: "schema/load.schema.json", schema: LoadSchema, title: "Ammo Wiki load" },
  { file: "schema/caliber.schema.json", schema: CaliberSchema, title: "Ammo Wiki caliber" },
  { file: "schema/sources.schema.json", schema: SourcesFileSchema, title: "Ammo Wiki shared sources" },
];

const check = process.argv.includes("--check");
let stale = 0;
for (const t of targets) {
  const json = { title: t.title, ...z.toJSONSchema(t.schema, { target: "draft-7", io: "input" }) };
  const text = `${JSON.stringify(json, null, 2)}\n`;
  if (check) {
    let current = "";
    try {
      current = readFileSync(t.file, "utf8");
    } catch {}
    if (current !== text) {
      console.log(`${t.file} is out of date: run npm run schema`);
      stale++;
    }
  } else {
    writeFileSync(t.file, text);
    console.log(`wrote ${t.file}`);
  }
}
process.exit(stale ? 1 : 0);
