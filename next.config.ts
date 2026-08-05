import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit .next/standalone: a self-contained server plus only the node_modules
  // files the traced routes actually need. Keeps the runtime image small and
  // means the production stage never installs dependencies.
  output: "standalone",

  // Pin the file-tracing root to this project.
  //
  // Next infers the root from the nearest lockfile walking upwards. A stray
  // package.json/package-lock.json anywhere above the project (e.g. in $HOME)
  // silently makes that directory the root, and the standalone output then
  // lands at .next/standalone/<...nested path...>/server.js instead of
  // .next/standalone/server.js — which breaks the Dockerfile's COPY.
  // next build always runs with cwd set to the project root, so this is stable
  // both locally and inside the image.
  outputFileTracingRoot: process.cwd(),

  // Don't leak the framework version in response headers.
  poweredByHeader: false,
};

export default nextConfig;
