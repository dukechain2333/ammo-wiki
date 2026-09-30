import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { z } from "zod";
import { CONFIDENCE_LABEL, CONFIDENCE_TEXT, Meter } from "@/components/confidence";
import { getLoad } from "@/lib/data";
import { LoadSchema, type Confidence } from "@/lib/schema";
import { blobUrl, issueUrl, REPO_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contribute",
  description: "Add a load or correct a number: every load is a YAML file on GitHub, reviewed through pull requests.",
};

const EXAMPLE_ID = "fed-blk-ae-220-sub";

function fields() {
  return Object.entries(LoadSchema.shape).map(([key, schema]) => {
    const optional = schema instanceof z.ZodOptional;
    const description = z.globalRegistry.get(schema)?.description ?? schema.description ?? "";
    return { key, optional, description };
  });
}

const LEVELS: { level: Confidence; title: string }[] = [
  { level: "high", title: "The load’s own chronograph series" },
  { level: "medium", title: "A couple of lengths measured" },
  { level: "low", title: "One reading or the maker’s rating" },
];

export default function ContributePage() {
  const example = getLoad(EXAMPLE_ID)!;
  const yaml = readFileSync(path.join(process.cwd(), "data", "loads", example.caliber, `${example.id}.yaml`), "utf8");

  return (
    <div className="wrap">
      <section className="section" style={{ paddingBottom: 8 }}>
        <div className="eyebrow">Contributor guide</div>
        <h1 style={{ fontSize: "clamp(36px, 5vw, 52px)" }}>Add or correct a load</h1>
        <p className="lede" style={{ maxWidth: 720 }}>
          Ammo Wiki is a folder of YAML files on GitHub. Every page on this site is built from them, so a pull request is all it
          takes to add a load, fix a number or attach a better source. No account here, no database.
        </p>
      </section>

      <section className="steps" style={{ paddingTop: 24 }}>
        <div className="card step">
          <span className="n">01</span>
          <h2>Copy a similar load</h2>
          <p>
            Loads live in one folder per caliber. The file name is the load’s id: lowercase words joined by hyphens, and it
            never changes once merged.
          </p>
          <code>data/loads/&lt;caliber&gt;/&lt;id&gt;.yaml</code>
        </div>
        <div className="card step">
          <span className="n">02</span>
          <h2>Fill in what you know and cite it</h2>
          <p>Weight, BC and at least one velocity reading with its barrel length. List the sources the numbers came from.</p>
          <code>sources: [...]</code>
        </div>
        <div className="card step">
          <span className="n">03</span>
          <h2>Open a pull request</h2>
          <p>
            A check validates every file against the schema, and Vercel posts a preview link so the reviewer can see the page
            before merging.
          </p>
          <code>npm run validate</code>
        </div>
      </section>

      <section className="row-flex" style={{ paddingTop: 40 }}>
        <div className="code-card">
          <div className="bar">
            <span>{example.file}</span>
            <a href={blobUrl(example.file)} style={{ color: "inherit" }}>
              YAML
            </a>
          </div>
          <pre>{yaml}</pre>
        </div>
        <div className="card fields">
          <div className="card-head">
            <h2>Fields</h2>
            <a href={blobUrl("schema/load.schema.json")} style={{ fontSize: 13, color: "var(--ink-2)" }}>
              JSON Schema
            </a>
          </div>
          <table>
            <tbody>
              {fields().map((f) => (
                <tr key={f.key}>
                  <th scope="row">
                    {f.key}
                    <small className={f.optional ? undefined : "req"}>{f.optional ? "optional" : "required"}</small>
                  </th>
                  <td>{f.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="confidence" className="section">
        <h2 style={{ fontSize: 28 }}>Grading velocity data</h2>
        <p className="lede" style={{ fontSize: 15, maxWidth: 760 }}>
          Muzzle velocity changes with barrel length, so a load’s <code>mvByBarrel</code> is a curve, not one number.{" "}
          <code>confidence</code> says how much of that curve somebody actually measured. Where only a few lengths were
          measured, the other points follow a similar load’s measured curve; say so in <code>notes</code>.
        </p>
        <div className="levels">
          {LEVELS.map(({ level, title }) => (
            <div key={level} className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Meter level={level} large />
                <span className="conf-label mono" data-level={level} style={{ fontSize: 14 }}>
                  {level}
                </span>
              </div>
              <p style={{ fontWeight: 600 }}>{title}</p>
              <p style={{ fontSize: 14, color: "var(--ink-2)" }}>
                {CONFIDENCE_TEXT[level]}
                {level === "low" && " Useful for comparison; chronograph your own before trusting a drop table."}
              </p>
              <span className="sr-only">{CONFIDENCE_LABEL[level]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="two-col" style={{ paddingTop: 40 }}>
        <div className="card card-body prose" style={{ gap: 10 }}>
          <h2 style={{ fontSize: 22, textTransform: "none", letterSpacing: 0 }}>What gets merged</h2>
          <ul className="checklist">
            <li>Every number has a source a reviewer can open: a chronograph test, a maker’s spec page, a military manual.</li>
            <li>
              Barrel lengths are the barrels the test used, not a guess. Say what the gun was in <code>notes</code>.
            </li>
            <li>
              A maker’s rating alone is fine: mark it <code>low</code> and give the test barrel if the maker states it.
            </li>
            <li>One load per file. A different bullet weight, or a box code with different velocity, is a new file.</li>
            <li>
              A source cited by several loads goes in <code>data/sources.yaml</code> and is cited by id.
            </li>
          </ul>
        </div>
        <div className="card card-body prose" style={{ gap: 10 }}>
          <h2 style={{ fontSize: 22, textTransform: "none", letterSpacing: 0 }}>Check it before you push</h2>
          <pre className="code-block">{`npm install
npm run validate   # schema, ids, links between loads
npm run dev        # preview at localhost:3000`}</pre>
          <p style={{ fontSize: 14, color: "var(--ink-2)" }}>
            No local setup? Use <strong>Edit this load</strong> on any load page, or <strong>Add a load on GitHub</strong> on a
            caliber page. GitHub forks the repository and opens the file in the browser; the same checks run on your pull
            request. Not sure about a number? <a href={issueUrl("new-load.yml")}>Open an issue</a> with your source instead.
          </p>
          <p style={{ fontSize: 14, color: "var(--ink-2)" }}>
            Full details are in <a href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}>CONTRIBUTING.md</a>.
          </p>
        </div>
      </section>
      <div className="page-end" />
    </div>
  );
}
