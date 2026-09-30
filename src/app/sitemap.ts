import type { MetadataRoute } from "next";
import { getBrands, getCalibers, getLoads } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/calibers", "/brands", "/sources", "/contribute"];
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}` })),
    ...getCalibers().map((c) => ({ url: `${SITE_URL}/calibers/${c.id}` })),
    ...getBrands().map((b) => ({ url: `${SITE_URL}/brands/${b.slug}` })),
    ...getLoads().map((l) => ({ url: `${SITE_URL}/loads/${l.id}` })),
  ];
}
