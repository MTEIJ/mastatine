import type { MetadataRoute } from "next";
import { getNews } from "@/lib/news";
import { getPublicCommittees } from "@/lib/committees";
import { siteUrl } from "@/lib/env";


const PAGES = ["/", "/about", "/board", "/committees", "/history", "/membership", "/news", "/mastapps", "/mastapps/activities", "/mastapps/quotes", "/newsletter", "/contact", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [news, committees] = await Promise.all([getNews(), getPublicCommittees().catch(() => [])]);
  return [
    ...PAGES.map((path) => ({ url: `${base}${path === "/" ? "" : path}` })),
    ...committees.map((c) => ({ url: `${base}/committees/${c.slug}` })),
    ...news.map((post) => ({ url: `${base}/news/${post.slug}`, lastModified: post.date })),
  ];
}
