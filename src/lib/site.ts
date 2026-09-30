// Where the repository lives. Set NEXT_PUBLIC_REPO_URL on a fork's deployment to point the edit
// links at the fork.

export const REPO_URL = (process.env.NEXT_PUBLIC_REPO_URL ?? "https://github.com/dukechain2333/ammo-wiki").replace(/\/$/, "");
export const BRANCH = "main";
export const SITE_NAME = "Ammo Wiki";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ammo-wiki.vercel.app").replace(/\/$/, "");
export const ZERO_TARGETS_URL = "https://zero-targets.williamq.me";

export const editUrl = (file: string) => `${REPO_URL}/edit/${BRANCH}/${file}`;
export const historyUrl = (file: string) => `${REPO_URL}/commits/${BRANCH}/${file}`;
export const blobUrl = (file: string) => `${REPO_URL}/blob/${BRANCH}/${file}`;

/** GitHub's "new file" page, in the caliber's folder, prefilled with a template. */
export const newLoadUrl = (caliber: string, template: string) =>
  `${REPO_URL}/new/${BRANCH}/data/loads/${caliber}?filename=new-load.yaml&value=${encodeURIComponent(template)}`;

export const issueUrl = (template: string, title?: string) =>
  `${REPO_URL}/issues/new?template=${template}${title ? `&title=${encodeURIComponent(title)}` : ""}`;

/** zero-targets with this load's bullet and velocity, for a printable zeroing target. */
export function zeroTargetsUrl(p: { weightGr: number; bc: number; dragModel: string; barrelIn: number; mvFps: number; metric: boolean }) {
  const q = new URLSearchParams({
    ammo: "custom",
    bullet: `${p.weightGr}-${p.bc}-${p.dragModel}`,
    barrel: String(p.barrelIn),
    mv: String(Math.round(p.mvFps)),
  });
  if (p.metric) q.set("u", "metric");
  return `${ZERO_TARGETS_URL}/?${q}`;
}
