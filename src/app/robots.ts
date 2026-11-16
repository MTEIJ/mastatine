import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { siteUrl } from "@/lib/env";

export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection(); // SITE_URL is a runtime setting, so it must not be baked in at build time
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/app", "/login", "/api/", "/newsletter/confirm", "/newsletter/unsubscribe"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
