import { defineConfig } from "cypress";

/**
 * E2E runs expect the full dev stack on localhost:
 *   npm run dev      (vercel dev on :3000 — serves /api)
 *   npm run dev:web  (Vite on :5173, proxying /api → :3000)
 * The browser must drive :5173 — vercel dev answers Vite module paths with
 * the SPA rewrite (500s), see the verify skill notes.
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
