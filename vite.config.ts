import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), tsconfigPaths(), svgr()],
  server: {
    // The Fastify API (npm run dev:server) is proxied under the same origin so
    // the httpOnly refresh cookie is first-party and no CORS setup is needed.
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
