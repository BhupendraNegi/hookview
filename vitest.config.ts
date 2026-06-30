import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Project root, so "@/..." imports resolve the same as in tsconfig.
const root = fileURLToPath(new URL(".", import.meta.url)).replace(/\/$/, "");

export default defineConfig({
  resolve: {
    alias: { "@": root },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
