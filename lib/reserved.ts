// Slugs that must never be used as a campaign slug, because they collide with
// real routes/assets or are reserved for future admin tooling.
const RESERVED_SLUGS = new Set([
  "api",
  "admin",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "public",
  "static",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
