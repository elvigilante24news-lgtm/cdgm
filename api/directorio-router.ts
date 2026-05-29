import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { findDirectorioMatriculados } from "./queries/matriculados";

export const directorioRouter = createRouter({
  list: publicQuery.query(() => findDirectorioMatriculados()),

  search: publicQuery
    .input(
      z.object({
        nombre: z.string().optional(),
        matricula: z.string().optional(),
        ciudad: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const all = await findDirectorioMatriculados();
      return all.filter((m) => {
        const fullName = `${m.nombre} ${m.apellido}`.toLowerCase();
        const matchName =
          !input.nombre ||
          input.nombre === "" ||
          fullName.includes(input.nombre.toLowerCase());
        const matchMatricula =
          !input.matricula ||
          input.matricula === "" ||
          (m.numeroMatricula || "")
            .toLowerCase()
            .includes(input.matricula.toLowerCase());
        const matchCiudad =
          !input.ciudad ||
          input.ciudad === "" ||
          input.ciudad === "todas" ||
          m.ciudad === input.ciudad;
        return matchName && matchMatricula && matchCiudad;
      });
    }),
});
