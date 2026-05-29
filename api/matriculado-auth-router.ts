import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import { findMatriculadoByEmail, findMatriculadoById } from "./queries/matriculados";
import { compareSync } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { env } from "./lib/env";

const SECRET = new TextEncoder().encode(env.jwtSecret);

async function createToken(matriculadoId: number, tipo: string) {
  return new SignJWT({ matriculadoId, tipo })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyMatriculadoToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET, { clockTolerance: 60 });
    return payload as { matriculadoId: number; tipo: string };
  } catch {
    return null;
  }
}

export const matriculadoAuthRouter = createRouter({
  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const matriculado = await findMatriculadoByEmail(input.email);
      if (!matriculado) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Credenciales incorrectas",
        });
      }

      const validPassword = compareSync(input.password, matriculado.password);
      if (!validPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Credenciales incorrectas",
        });
      }

      const token = await createToken(matriculado.id, matriculado.tipo);

      return {
        token,
        user: {
          id: matriculado.id,
          email: matriculado.email,
          tipo: matriculado.tipo,
          nombre: matriculado.nombre,
          apellido: matriculado.apellido,
          dni: matriculado.dni,
          ciudad: matriculado.ciudad,
          celular: matriculado.celular,
          domicilio: matriculado.domicilio,
          estudio: matriculado.estudio,
          fotoPerfil: matriculado.fotoPerfil,
          numeroMatricula: matriculado.numeroMatricula,
          estado: matriculado.estado,
          estadoPago: matriculado.estadoPago,
          montoDeuda: matriculado.montoDeuda,
          fechaVencimiento: matriculado.fechaVencimiento,
          fechaUltimoPago: matriculado.fechaUltimoPago,
          redes: {
            instagram: matriculado.instagram,
            facebook: matriculado.facebook,
            paginaWeb: matriculado.paginaWeb,
            linkedin: matriculado.linkedin,
            behance: matriculado.behance,
          },
        },
      };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    const authHeader = ctx.req.headers.get("x-matriculado-token");
    if (!authHeader) return null;

    const payload = await verifyMatriculadoToken(authHeader);
    if (!payload) return null;

    const matriculado = await findMatriculadoById(payload.matriculadoId);
    if (!matriculado) return null;

    return {
      id: matriculado.id,
      email: matriculado.email,
      tipo: matriculado.tipo,
      nombre: matriculado.nombre,
      apellido: matriculado.apellido,
      dni: matriculado.dni,
      ciudad: matriculado.ciudad,
      celular: matriculado.celular,
      domicilio: matriculado.domicilio,
      estudio: matriculado.estudio,
      fotoPerfil: matriculado.fotoPerfil,
      numeroMatricula: matriculado.numeroMatricula,
      estado: matriculado.estado,
      estadoPago: matriculado.estadoPago,
      montoDeuda: matriculado.montoDeuda,
      fechaVencimiento: matriculado.fechaVencimiento,
      fechaUltimoPago: matriculado.fechaUltimoPago,
      redes: {
        instagram: matriculado.instagram,
        facebook: matriculado.facebook,
        paginaWeb: matriculado.paginaWeb,
        linkedin: matriculado.linkedin,
        behance: matriculado.behance,
      },
    };
  }),
});
