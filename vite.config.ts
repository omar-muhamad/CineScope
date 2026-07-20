import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), tsconfigPaths(), svgr()],
  server: {
    // Only used by the optional UI-only mode (npm run dev:web): /api is
    // proxied to `vercel dev` (npm run dev, port 3000) so the session cookie
    // stays first-party. Note the /api/saved/:list/:media/:id DELETE rewrite
    // lives in vercel.json — full API testing happens under `npm run dev`.
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
