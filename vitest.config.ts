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
    // The auth seam (setup.ts module mock + test-utils seedSession) is built
    // from vi.fn()s — reset them between tests so call history and per-test
    // mockResolvedValue overrides never leak across tests. (vi.fn(impl)
    // factory implementations survive a reset.)
    resetMocks: true,
    restoreMocks: true,
  },
});
