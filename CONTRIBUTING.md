# Contributing to Ammo Wiki

Ammo Wiki is a folder of YAML files. Every page on the site is built from them, so adding a load,
fixing a number or attaching a better source is a pull request that changes one file.

## The quick way: in the browser

- **Fix a load:** open its page on the site and press **Edit this load**. GitHub forks the repository,
  opens the file, and offers to open a pull request when you save.
- **Add a load:** open the caliber's page and press **Add a load on GitHub**. You get a new file in the
  right folder with every field filled in with a placeholder.
- **Not sure about a number?** [Open an issue](../../issues/new/choose) with your source instead.

The checks below run on every pull request, and Vercel posts a preview link so you and the reviewer
can see the page before it is merged.

## Working locally

```bash
npm install
npm run new-load -- 556-nato hdy-556-62-fmj --like fed-xm855   # start from a similar load
npm run validate   # schema, ids, links between files
npm run dev        # http://localhost:3000
npm test
```

VS Code with the YAML extension (`redhat.vscode-yaml`, recommended by the repo) autocompletes the
fields and underlines mistakes as you type, from the `# yaml-language-server: $schema=` line at the
top of each file.

## Where things live

```
data/calibers/<caliber>.yaml       one file per caliber: names, aliases, barrel presets, drawing
data/loads/<caliber>/<id>.yaml     one file per load
data/sources.yaml                  sources cited by several loads, by id
schema/*.schema.json               generated from src/lib/schema.ts (npm run schema)
```

## A load file

```yaml
# yaml-language-server: $schema=../../../schema/load.schema.json
id: fed-blk-ae-220-sub            # same as the file name; never change it once merged
caliber: 300-blk                  # same as the folder name
brand: Federal                    # leave out for generic and military-spec types (M193, M855...)
name: Federal American Eagle Suppressor 220 gr OTM subsonic
short: .300 BLK AE 220 sub        # 32 characters at most
sku: [AE300BLKSUP2]               # box codes, so searches find it
sameAs: blk-220-sub               # the standard type this load is made to (optional)
weightGr: 220
diameterIn: 0.308
bc: 0.65
dragModel: G1                     # G1 or G7: the drag table the BC is for
platform: ar15                    # ar15 or ar10: receiver size, sets the default rail-to-bore height
confidence: medium                # see below
# [barrel length in, muzzle velocity fps], shortest barrel first
mvByBarrel:
  - [7.5, 940]
  - [10.5, 980]
  - [16.5, 1030]
notes: >-
  Measured at 10.5 and 16 in (AmmoMan, International Sportsman); other lengths follow the Sellier
  & Bellot 200 gr subsonic curve. Maker's rating: 1,000 fps (test barrel not stated).
sources:
  - ammoman-300blk-subsonic       # an id from data/sources.yaml
  - label: Federal AE300BLKSUP2   # or a label and a link
    url: https://www.federalpremium.com/rifle/american-eagle/american-eagle-rifle-suppressor/11-AE300BLKSUP2.html
```

Every field is described in [`schema/load.schema.json`](schema/load.schema.json) and on the site's
Contribute page.

### Units

Everything is stored in imperial units: grains, inches, feet per second. The site converts to metric
for display. (1 g = 15.432 gr, 1 mm = 0.03937 in, 1 m/s = 3.2808 fps.)

### Velocity and confidence

Muzzle velocity changes with barrel length, so `mvByBarrel` is a curve, not one number. The site
interpolates between points and extends the end slopes a little past them. `confidence` says how much
of the curve somebody actually measured:

| confidence | meaning |
| --- | --- |
| `high` | The load's own chronograph series across the barrel lengths in the file: a cut-down test, or several rifles of different lengths. |
| `medium` | Measured at two or three lengths; a similar load's measured curve, scaled to those readings, fills the rest. |
| `low` | One reading or only the maker's rating, placed on a similar load's curve. |

When only some points are measured, say which in `notes`, and which load's curve filled the rest.

### What gets merged

- Every number has a source a reviewer can open: a chronograph test, a maker's spec page, a manual.
- Barrel lengths are the barrels the test actually used. Name the gun in `notes`.
- A maker's rating alone is fine: mark it `low`, and give the test barrel if the maker states it
  (many use 24 in).
- One load per file. A different bullet weight, or a box code with different velocity, is a new file.
- A source cited by more than one load goes in `data/sources.yaml` and is cited by id.
- Don't rename ids: pages and other tools link to them. If a load was filed under the wrong id, ask
  in the pull request.

### YAML gotchas

- Text that looks like a number must be quoted: `sku: ["80263"]`, `aliases: ["308"]`. The validator
  tells you when it finds one.
- Put text containing `: ` or starting with a quote, `[`, `{` or `#` in double quotes.
- Long `notes` read best as a folded block (`notes: >-` then indented lines).

## Adding a caliber

1. Add `data/calibers/<id>.yaml` (copy an existing one). `drawing` is the cartridge outline in
   millimetres, from the case head: case length, overall length, base, shoulder and neck diameters,
   where the shoulder starts and ends, and the bullet diameter. SAAMI or C.I.P. drawings have them.
2. Create `data/loads/<id>/` and add at least one load.
3. Add the caliber to the list in `.github/ISSUE_TEMPLATE/new-load.yml`.

## Changing the site

The site is Next.js (App Router) and every page is prerendered at build time.

```
src/lib/schema.ts        the data schemas (run npm run schema after changing them)
src/lib/dataset.ts       reads data/ and checks the links between files
src/lib/ballistics/      point-mass trajectory solver, shared with zero-targets
src/components/          catalog table, velocity chart and trajectory table, header, drawings
src/app/                 pages; /api/loads.json serves the whole dataset
```

Run `npm run lint`, `npm test` and `npm run build` before opening a pull request.

## License

By contributing, you agree that your changes to `data/` are licensed under
[CC BY-SA 4.0](data/LICENSE.md) and your changes to the code under the [MIT license](LICENSE).
