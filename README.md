# Ammo Wiki

An open, sourced reference of factory and military ammunition: bullet weight, ballistic coefficient and
**muzzle velocity by barrel length**, with the chronograph test or spec sheet behind every number.
Anyone can add a load or correct one with a pull request.

- 154 loads in 5.56 NATO / .223 Rem, .300 Blackout, 9mm Luger, 7.62x39, .308 Win and 6.5 Creedmoor
- A page per load: specifications, velocity-by-barrel chart, a trajectory table computed in the browser
  for any barrel length, notes and sources
- Catalog search by caliber, brand, weight or the code on the box; pages per caliber, brand and source
- Imperial or metric units, light and dark themes, works on phones
- The whole dataset as JSON at `/api/loads.json`, one load at `/api/loads/<id>`

The data was seeded from the load catalog of
[zero-targets](https://github.com/dukechain2333/zero-targets) (printable zeroing targets), which shares
the load ids and the ballistic solver. Each load page links to zero-targets with its bullet and
velocity filled in.

## Contributing

Every load is one YAML file under `data/loads/<caliber>/`. See [CONTRIBUTING.md](CONTRIBUTING.md), or
use the **Edit this load** button on any page.

```bash
npm install
npm run validate   # check data/ against the schema
npm run dev        # http://localhost:3000
npm test
npm run lint
npm run build
```

## Project layout

```
data/                     calibers, loads (one file each) and shared sources: the wiki's content
schema/                   JSON Schemas generated from src/lib/schema.ts, for editor autocomplete
scripts/                  validate, new-load, build-schema
src/lib/                  schema, data loading and checks, velocity interpolation, search, trajectory
src/lib/ballistics/       point-mass solver (RK4, G1/G7 drag tables), tested against py-ballisticcalc
src/components/           catalog table, velocity chart and trajectory table, cartridge drawings
src/app/                  pages and the JSON API
.github/                  CI (validate, lint, test, build), pull request and issue templates
```

The UI was designed on a Claude Design canvas first (catalog, load page, contributor guide and a phone
layout) and built from it.

## Deploying to Vercel

Import the repository in Vercel (framework preset: Next.js). No environment variables are required.
Every page is prerendered at build time, and Vercel builds a preview for each pull request, so
reviewers can see a data change on the real page before merging.

Optional environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://ammo-wiki.vercel.app` | Canonical URL for the sitemap and metadata |
| `NEXT_PUBLIC_REPO_URL` | `https://github.com/dukechain2333/ammo-wiki` | Where the edit and history links point |

## License

Code: [MIT](LICENSE). Data in `data/`: [CC BY-SA 4.0](data/LICENSE.md).

Numbers are for reference. Chronograph your own ammunition, and confirm your zero at the real distance.
