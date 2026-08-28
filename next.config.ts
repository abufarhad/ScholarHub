import type { NextConfig } from "next";

// GitHub Pages *project* sites are served at https://<user>.github.io/<repo>/,
// so every asset/route needs a `/repo` prefix. The deploy workflow sets
// NEXT_PUBLIC_BASE_PATH from GITHUB_REPOSITORY automatically; local `npm run
// build` defaults to no prefix, matching serving the export from `/`.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: {
    // The static export has no server to run Next's image optimization API.
    unoptimized: true,
  },
};

export default nextConfig;
