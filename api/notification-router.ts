import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  findNotificationsByMatriculadoId,
  createNotification,
  markNotificationAsRead,
  deleteNotification,
} from "./queries/matriculados";

export const notificationRouter = createRouter({
  listByMatriculado: publicQuery
    .input(z.object({ matriculadoId: z.number() }))
    .query(({ input }) => findNotificationsByMatriculadoId(input.matriculadoId)),

  create: publicQuery
    .input(
      z.object({
        matriculadoId: z.number(),
        titulo: z.string().min(1),
        mensaje: z.string().min(1),
        tipo: z.enum(["info", "warning", "success", "error"]).default("info"),
      })
    )
    .mutation(({ input }) => createNotification(input)),

  markAsRead: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => markNotificationAsRead(input.id)),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteNotification(input.id)),
});
