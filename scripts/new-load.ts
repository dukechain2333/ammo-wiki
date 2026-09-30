// Starts a new load file: npm run new-load -- <caliber> <id> [--like <existing-id>]
// With --like, the new file is a copy of that load with the id changed, so you only edit what differs.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { readDataset } from "../src/lib/dataset";
import { SLUG } from "../src/lib/schema";

const args = process.argv.slice(2);
const likeAt = args.indexOf("--like");
const like = likeAt >= 0 ? args.splice(likeAt, 2)[1] : undefined;
const [caliber, id] = args;

const fail = (msg: string) => {
  console.error(msg);
  process.exit(1);
};

if (!caliber || !id) fail("usage: npm run new-load -- <caliber> <id> [--like <existing-id>]");
const { data } = readDataset(process.cwd());
const cal = data.calibers.find((c) => c.id === caliber);
if (!cal) fail(`no caliber "${caliber}"; choose one of: ${data.calibers.map((c) => c.id).join(", ")}`);
if (!SLUG.test(id)) fail(`id "${id}" must be lowercase letters and digits joined by hyphens, e.g. fed-xm193`);
if (data.loads.some((l) => l.id === id)) fail(`a load with id "${id}" already exists`);
const file = path.join("data", "loads", caliber, `${id}.yaml`);
if (existsSync(file)) fail(`${file} already exists`);

let text: string;
if (like) {
  const src = data.loads.find((l) => l.id === like);
  if (!src) fail(`no load "${like}" to copy`);
  text = readFileSync(src!.file, "utf8").replace(/^id: .*$/m, `id: ${id}`).replace(/^caliber: .*$/m, `caliber: ${caliber}`);
} else {
  text = `# yaml-language-server: $schema=../../../schema/load.schema.json
id: ${id}
caliber: ${caliber}
brand: Maker
name: Maker Product 00 gr BULLET
short: Short name
sku: [BOXCODE]
weightGr: 0
diameterIn: ${cal!.bulletDiameterIn}
bc: 0
dragModel: G1
platform: ar15
confidence: low
# [barrel length in, muzzle velocity fps], shortest barrel first
mvByBarrel:
  - [${cal!.defaultBarrelIn}, 0]
notes: >-
  How and where the velocity was measured: the gun, barrel length, chronograph, number of shots.
sources:
  - label: Where the numbers came from
    url: https://
`;
}
writeFileSync(file, text);
console.log(`created ${file}\nEdit it, then run npm run validate.`);
