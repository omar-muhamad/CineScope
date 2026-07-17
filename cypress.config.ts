import { defineConfig } from "cypress";

/**
 * E2E runs expect the full dev stack on localhost:
 *   npm run dev:server  (API on :3001, proxied under /api)
 *   npm run dev         (Vite on :5173)
 */
export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: "src/tests/cypress/e2e/**/*.cy.{js,ts}",
    supportFile: "src/tests/cypress/support/e2e.js",
    fixturesFolder: "src/tests/cypress/fixtures",
    video: false,
  },
});
