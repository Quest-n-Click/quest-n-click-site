import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The classic data model: fetch() with `next.revalidate` for GitHub, force-dynamic for the docs store.
  cacheComponents: false,
  // The demo lives at /demo/ (its service worker's scope): Next must not strip that slash. proxy.ts keeps the
  // trailing-slash redirect for every other page.
  skipTrailingSlashRedirect: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Screenshots are shipped as webp at their final size; the archive's images are served by a route handler.
    formats: ["image/webp"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
