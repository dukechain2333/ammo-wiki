# Ammo Wiki

- Content lives in `data/` (YAML); `src/lib/schema.ts` is the single source of truth for its shape.
  After changing the schema, run `npm run schema` and commit `schema/*.json` (CI checks they match).
- `npm run validate`, `npm test`, `npm run lint` and `npm run build` must pass.
- All pages are statically generated from `data/` at build time; nothing reads the filesystem at runtime.
- Load ids are public URLs and are shared with zero-targets: never rename one.
