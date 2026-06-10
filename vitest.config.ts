import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // svgr mirrors vite.config so `*.svg?react` imports render as components in tests.
  plugins: [tsconfigPaths(), svgr()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "src/tests/setup.ts",
  },
});
