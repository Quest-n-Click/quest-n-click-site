import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The classic data model: fetch() with `next.revalidate` for GitHub, force-dynamic for the docs store.
  cacheComponents: false,
  // `/demo/` keeps its slash: the game is built for that base and its service worker is scoped there.
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
