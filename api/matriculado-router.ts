import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import {
  findAllMatriculados,
  findMatriculadoById,
  createMatriculado,
  updateMatriculado,
  deleteMatriculado,
  searchMatriculados,
  findMatriculadosAlDia,
} from "./queries/matriculados";
import { hashSync } from "bcryptjs";

export const matriculadoRouter = createRouter({
  list: publicQuery.query(() => findAllMatriculados()),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const m = await findMatriculadoById(input.id);
      if (!m) throw new TRPCError({ code: "NOT_FOUND", message: "Matriculado no encontrado" });
      return m;
    }),

  search: publicQuery
    .input(z.object({ query: z.string() }))
    .query(({ input }) => searchMatriculados(input.query)),

  create: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        nombre: z.string().min(1),
        apellido: z.string().min(1),
        dni: z.string().min(1),
        ciudad: z.string().min(1),
        celular: z.string().min(1),
        domicilio: z.string().min(1),
        estudio: z.string().optional(),
        instagram: z.string().optional(),
        facebook: z.string().optional(),
        paginaWeb: z.string().optional(),
        linkedin: z.string().optional(),
        behance: z.string().optional(),
        numeroMatricula: z.string().optional(),
        estado: z.enum(["activo", "suspendido", "baja"]).optional(),
        estadoPago: z.enum(["al_dia", "deuda"]).optional(),
        montoDeuda: z.number().optional(),
        fechaVencimiento: z.string().optional(),
      })
    )
    .mutation(({ input }) =>
      createMatriculado({
        ...input,
        password: hashSync(input.password, 10),
        tipo: "matriculado",
      })
    ),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          nombre: z.string().optional(),
          apellido: z.string().optional(),
          dni: z.string().optional(),
          ciudad: z.string().optional(),
          celular: z.string().optional(),
          email: z.string().email().optional(),
          domicilio: z.string().optional(),
          estudio: z.string().optional(),
          instagram: z.string().optional(),
          facebook: z.string().optional(),
          paginaWeb: z.string().optional(),
          linkedin: z.string().optional(),
          behance: z.string().optional(),
          fotoPerfil: z.string().optional(),
          numeroMatricula: z.string().optional(),
          estado: z.enum(["activo", "suspendido", "baja"]).optional(),
          estadoPago: z.enum(["al_dia", "deuda"]).optional(),
          montoDeuda: z.number().optional(),
          fechaVencimiento: z.string().optional(),
          fechaUltimoPago: z.string().optional(),
        }),
      })
    )
    .mutation(({ input }) => updateMatriculado(input.id, input.data)),

  updatePassword: publicQuery
    .input(
      z.object({
        id: z.number(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(({ input }) =>
      updateMatriculado(input.id, { password: hashSync(input.newPassword, 10) })
    ),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteMatriculado(input.id)),

  alDia: publicQuery.query(() => findMatriculadosAlDia()),

  // Admin actions
  updateEstado: publicQuery
    .input(
      z.object({
        id: z.number(),
        estado: z.enum(["activo", "suspendido", "baja"]),
      })
    )
    .mutation(({ input }) => updateMatriculado(input.id, { estado: input.estado })),

  updateEstadoPago: publicQuery
    .input(
      z.object({
        id: z.number(),
        estadoPago: z.enum(["al_dia", "deuda"]),
        montoDeuda: z.number().optional(),
      })
    )
    .mutation(({ input }) =>
      updateMatriculado(input.id, {
        estadoPago: input.estadoPago,
        montoDeuda: input.estadoPago === "deuda" ? input.montoDeuda : null,
        fechaUltimoPago: input.estadoPago === "al_dia" ? new Date().toISOString().split("T")[0] : undefined,
      })
    ),
});
