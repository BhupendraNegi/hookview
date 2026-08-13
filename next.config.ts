import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle so the Docker runtime image stays lean.
  output: "standalone",
  // Next 16 otherwise appends its own agent-rules block to CLAUDE.md on every
  // `next dev`. This file is hand-maintained; keep Next out of it.
  agentRules: false,
};

export default nextConfig;
