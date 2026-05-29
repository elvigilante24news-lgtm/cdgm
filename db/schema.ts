import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  bigint,
  boolean,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// ─── Auth Users (Kimi OAuth) ───
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Matriculados (Colegio Members) ───
export const matriculados = mysqlTable("matriculados", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  tipo: mysqlEnum("tipo", ["matriculado", "administrador"])
    .default("matriculado")
    .notNull(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  apellido: varchar("apellido", { length: 255 }).notNull(),
  dni: varchar("dni", { length: 20 }).notNull(),
  ciudad: varchar("ciudad", { length: 255 }).notNull(),
  celular: varchar("celular", { length: 50 }).notNull(),
  domicilio: varchar("domicilio", { length: 255 }).notNull(),
  estudio: varchar("estudio", { length: 255 }),
  // Social media
  instagram: varchar("instagram", { length: 255 }),
  facebook: varchar("facebook", { length: 255 }),
  paginaWeb: varchar("paginaWeb", { length: 255 }),
  linkedin: varchar("linkedin", { length: 255 }),
  behance: varchar("behance", { length: 255 }),
  fotoPerfil: text("fotoPerfil"),
  numeroMatricula: varchar("numeroMatricula", { length: 50 }),
  estado: mysqlEnum("estado", ["activo", "suspendido", "baja"])
    .default("activo")
    .notNull(),
  estadoPago: mysqlEnum("estadoPago", ["al_dia", "deuda"])
    .default("deuda")
    .notNull(),
  montoDeuda: int("montoDeuda"),
  fechaVencimiento: varchar("fechaVencimiento", { length: 50 }),
  fechaUltimoPago: varchar("fechaUltimoPago", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Matriculado = typeof matriculados.$inferSelect;
export type InsertMatriculado = typeof matriculados.$inferInsert;

// ─── Notifications ───
export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  matriculadoId: bigint("matriculadoId", {
    mode: "number",
    unsigned: true,
  }).notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  mensaje: text("mensaje").notNull(),
  tipo: mysqlEnum("tipo", ["info", "warning", "success", "error"])
    .default("info")
    .notNull(),
  leida: boolean("leida").default(false).notNull(),
  fecha: timestamp("fecha").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ─── System Config ───
export const systemConfig = mysqlTable("system_config", {
  id: serial("id").primaryKey(),
  configKey: varchar("configKey", { length: 255 }).notNull().unique(),
  configValue: text("configValue").notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = typeof systemConfig.$inferInsert;

// ─── Site Content ───
export const siteContent = mysqlTable("site_content", {
  id: serial("id").primaryKey(),
  page: varchar("page", { length: 50 }).notNull(),
  section: varchar("section", { length: 50 }).notNull(),
  contentKey: varchar("contentKey", { length: 255 }).notNull(),
  contentValue: text("contentValue").notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type SiteContent = typeof siteContent.$inferSelect;
export type InsertSiteContent = typeof siteContent.$inferInsert;

// ─── Relations ───
export const matriculadosRelations = relations(
  matriculados,
  ({ many }) => ({
    notifications: many(notifications),
  })
);

export const notificationsRelations = relations(
  notifications,
  ({ one }) => ({
    matriculado: one(matriculados, {
      fields: [notifications.matriculadoId],
      references: [matriculados.id],
    }),
  })
);
