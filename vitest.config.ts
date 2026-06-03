import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    passWithNoTests: false,
    include: ["packages/**/*.test.ts"]
  }
});
