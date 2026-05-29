import { getDb } from "./connection";
import { matriculados, notifications } from "@db/schema";
import { eq, and, like, or } from "drizzle-orm";

// Find all matriculados
export async function findAllMatriculados() {
  return getDb().query.matriculados.findMany({
    orderBy: (m, { desc }) => [desc(m.createdAt)],
  });
}

// Find matriculado by id
export async function findMatriculadoById(id: number) {
  return getDb().query.matriculados.findFirst({
    where: eq(matriculados.id, id),
  });
}

// Find matriculado by email
export async function findMatriculadoByEmail(email: string) {
  return getDb().query.matriculados.findFirst({
    where: eq(matriculados.email, email),
  });
}

// Create matriculado
export async function createMatriculado(data: typeof matriculados.$inferInsert) {
  const result = await getDb()
    .insert(matriculados)
    .values(data)
    .$returningId();
  return findMatriculadoById(result[0].id);
}

// Update matriculado
export async function updateMatriculado(
  id: number,
  data: Partial<typeof matriculados.$inferInsert>
) {
  await getDb().update(matriculados).set(data).where(eq(matriculados.id, id));
  return findMatriculadoById(id);
}

// Delete matriculado
export async function deleteMatriculado(id: number) {
  await getDb().delete(matriculados).where(eq(matriculados.id, id));
}

// Search matriculados
export async function searchMatriculados(query: string) {
  return getDb()
    .select()
    .from(matriculados)
    .where(
      or(
        like(matriculados.nombre, `%${query}%`),
        like(matriculados.apellido, `%${query}%`),
        like(matriculados.numeroMatricula, `%${query}%`),
        like(matriculados.ciudad, `%${query}%`)
      )
    );
}

// Find matriculados al dia (for directorio)
export async function findMatriculadosAlDia() {
  return getDb()
    .select()
    .from(matriculados)
    .where(
      and(
        eq(matriculados.estadoPago, "al_dia"),
        eq(matriculados.estado, "activo")
      )
    );
}

// Find matriculados for directorio (public - activos y al dia)
export async function findDirectorioMatriculados() {
  return findMatriculadosAlDia();
}

// Get matriculado notifications
export async function findNotificationsByMatriculadoId(matriculadoId: number) {
  return getDb()
    .select()
    .from(notifications)
    .where(eq(notifications.matriculadoId, matriculadoId))
    .orderBy(notifications.fecha);
}

// Create notification
export async function createNotification(
  data: typeof notifications.$inferInsert
) {
  const result = await getDb()
    .insert(notifications)
    .values(data)
    .$returningId();
  return getDb().query.notifications.findFirst({
    where: eq(notifications.id, result[0].id),
  });
}

// Mark notification as read
export async function markNotificationAsRead(id: number) {
  await getDb()
    .update(notifications)
    .set({ leida: true })
    .where(eq(notifications.id, id));
}

// Delete notification
export async function deleteNotification(id: number) {
  await getDb().delete(notifications).where(eq(notifications.id, id));
}
