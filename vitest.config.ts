import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.{ts,mjs}"],
    exclude: ["node_modules", ".next", ".stryker-tmp", "e2e"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
