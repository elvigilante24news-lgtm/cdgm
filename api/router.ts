import { authRouter } from "./auth-router";
import { matriculadoAuthRouter } from "./matriculado-auth-router";
import { matriculadoRouter } from "./matriculado-router";
import { notificationRouter } from "./notification-router";
import { configRouter } from "./config-router";
import { contentRouter } from "./content-router";
import { directorioRouter } from "./directorio-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  matriculadoAuth: matriculadoAuthRouter,
  matriculado: matriculadoRouter,
  notification: notificationRouter,
  config: configRouter,
  content: contentRouter,
  directorio: directorioRouter,
});

export type AppRouter = typeof appRouter;
