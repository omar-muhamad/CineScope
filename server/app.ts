import Fastify, { type FastifyError } from "fastify";
import cookie from "@fastify/cookie";

import { env } from "./env";
import { authRoutes } from "./routes/auth";
import { savedRoutes } from "./routes/saved";

/**
 * Build the API. In dev the Vite server proxies `/api` here (see
 * vite.config.ts), so the browser sees a single origin and the refresh cookie
 * stays first-party — no CORS involved. Keep that same-origin setup (a proxy
 * or rewrite) in production too.
 */
export const buildApp = () => {
  const app = Fastify({
    logger: {
      level: env.isProduction ? "info" : "debug",
    },
  });

  app.register(cookie);
  // Declared up-front so every request object has a stable shape; requireAuth
  // overwrites it with the real user id on protected routes.
  app.decorateRequest("userId", "");

  app.get("/api/health", async () => ({ status: "ok" }));
  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(savedRoutes, { prefix: "/api/saved" });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    // Ajv schema failures carry a client-safe message; everything else is a
    // server bug and gets logged but not leaked.
    if (error.validation) {
      return reply
        .code(400)
        .send({ code: "INVALID_INPUT", message: error.message });
    }
    request.log.error(error);
    return reply
      .code(500)
      .send({ code: "INTERNAL", message: "Something went wrong." });
  });

  return app;
};
