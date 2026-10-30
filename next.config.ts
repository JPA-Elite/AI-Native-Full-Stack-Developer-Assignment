import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // libsql ships native bindings and mammoth reads from disk; keep both outside
  // the server bundle. Uploads are capped at 4 MB in the API layer so requests
  // stay under Vercel's serverless body limit.
  serverExternalPackages: ["@libsql/client", "libsql", "mammoth"],
};

export default nextConfig;
