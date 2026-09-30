// Checks every file under data/ against the schema and the links between files.
// Run with `npm run validate`; CI runs it on every pull request.

import { readDataset } from "../src/lib/dataset";

const { data, errors, warnings } = readDataset(process.cwd());
const gh = process.env.GITHUB_ACTIONS === "true";

for (const w of warnings) console.log(gh ? `::warning file=${w.file}::${w.message}` : `warning  ${w.file}: ${w.message}`);
for (const e of errors) console.log(gh ? `::error file=${e.file}::${e.message}` : `error    ${e.file}: ${e.message}`);

console.log(
  `\n${data.loads.length} loads, ${data.calibers.length} calibers, ${Object.keys(data.sources).length} shared sources: ` +
    `${errors.length} error${errors.length === 1 ? "" : "s"}, ${warnings.length} warning${warnings.length === 1 ? "" : "s"}`,
);
process.exit(errors.length ? 1 : 0);
