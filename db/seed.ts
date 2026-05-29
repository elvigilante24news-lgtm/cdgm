import { getDb } from "../api/queries/connection";
import * as schema from "./schema";
import { hashSync } from "bcryptjs";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // Seed matriculados (original mock data)
  const matriculadosData = [
    {
      email: "admin@colegiodg.com",
      password: hashSync("admin123", 10),
      tipo: "administrador" as const,
      nombre: "Administrador",
      apellido: "Sistema",
      dni: "12345678",
      ciudad: "Posadas",
      celular: "3764123456",
      domicilio: "Av. Lavalle 1234",
      estudio: null,
      instagram: null,
      facebook: null,
      paginaWeb: null,
      linkedin: null,
      behance: null,
      fotoPerfil: null,
      numeroMatricula: null,
      estado: "activo" as const,
      estadoPago: "al_dia" as const,
      montoDeuda: null,
      fechaVencimiento: null,
      fechaUltimoPago: null,
    },
    {
      email: "maria.gonzalez@email.com",
      password: hashSync("user123", 10),
      tipo: "matriculado" as const,
      nombre: "Maria",
      apellido: "Gonzalez",
      dni: "23456789",
      ciudad: "Posadas",
      celular: "3764987654",
      domicilio: "Calle San Martin 567",
      estudio: "MG Diseno Grafico",
      instagram: "@mariagonzalez.design",
      facebook: "MariaGonzalezDesign",
      paginaWeb: null,
      linkedin: "maria-gonzalez-design",
      behance: "mariagonzalez",
      fotoPerfil: null,
      numeroMatricula: "DG-001",
      estado: "activo" as const,
      estadoPago: "al_dia" as const,
      montoDeuda: null,
      fechaVencimiento: "2025-03-31",
      fechaUltimoPago: "2024-01-15",
    },
    {
      email: "carlos.rodriguez@email.com",
      password: hashSync("user123", 10),
      tipo: "matriculado" as const,
      nombre: "Carlos",
      apellido: "Rodriguez",
      dni: "34567890",
      ciudad: "Obera",
      celular: "3755123456",
      domicilio: "Av. de las Americas 890",
      estudio: null,
      instagram: "@carlosrodriguez.art",
      facebook: null,
      paginaWeb: "www.carlosrodriguez.com",
      linkedin: null,
      behance: "carlosrodriguez",
      fotoPerfil: null,
      numeroMatricula: "DG-002",
      estado: "activo" as const,
      estadoPago: "deuda" as const,
      montoDeuda: 15000,
      fechaVencimiento: "2024-03-31",
      fechaUltimoPago: null,
    },
    {
      email: "laura.martinez@email.com",
      password: hashSync("user123", 10),
      tipo: "matriculado" as const,
      nombre: "Laura",
      apellido: "Martinez",
      dni: "45678901",
      ciudad: "Eldorado",
      celular: "3751987654",
      domicilio: "Calle Belgrano 234",
      estudio: "Visual Studio LM",
      instagram: "@lauramartinez.visual",
      facebook: null,
      paginaWeb: null,
      linkedin: "laura-martinez-graphic",
      behance: "lauramartinez",
      fotoPerfil: null,
      numeroMatricula: "DG-003",
      estado: "activo" as const,
      estadoPago: "al_dia" as const,
      montoDeuda: null,
      fechaVencimiento: "2025-03-31",
      fechaUltimoPago: "2024-02-20",
    },
    {
      email: "juan.perez@email.com",
      password: hashSync("user123", 10),
      tipo: "matriculado" as const,
      nombre: "Juan",
      apellido: "Perez",
      dni: "56789012",
      ciudad: "Puerto Iguazu",
      celular: "3757123456",
      domicilio: "Av. Victoria Aguirre 456",
      estudio: null,
      instagram: null,
      facebook: "JuanPerezDesign",
      paginaWeb: "www.juanperezdesign.com",
      linkedin: null,
      behance: null,
      fotoPerfil: null,
      numeroMatricula: "DG-004",
      estado: "suspendido" as const,
      estadoPago: "deuda" as const,
      montoDeuda: 30000,
      fechaVencimiento: "2023-12-31",
      fechaUltimoPago: null,
    },
    {
      email: "ana.lopez@email.com",
      password: hashSync("user123", 10),
      tipo: "matriculado" as const,
      nombre: "Ana",
      apellido: "Lopez",
      dni: "67890123",
      ciudad: "San Ignacio",
      celular: "3762123456",
      domicilio: "Calle Rivadavia 789",
      estudio: null,
      instagram: "@analopez.creative",
      facebook: null,
      paginaWeb: null,
      linkedin: null,
      behance: "analopez",
      fotoPerfil: null,
      numeroMatricula: "DG-005",
      estado: "activo" as const,
      estadoPago: "al_dia" as const,
      montoDeuda: null,
      fechaVencimiento: "2025-03-31",
      fechaUltimoPago: "2024-03-10",
    },
    {
      email: "pedro.sanchez@email.com",
      password: hashSync("user123", 10),
      tipo: "matriculado" as const,
      nombre: "Pedro",
      apellido: "Sanchez",
      dni: "78901234",
      ciudad: "Apostoles",
      celular: "3758123456",
      domicilio: "Av. San Martin 321",
      estudio: null,
      instagram: "@pedrosanchez.design",
      facebook: "PedroSanchezDesign",
      paginaWeb: "www.pedrosanchez.design",
      linkedin: "pedro-sanchez-designer",
      behance: null,
      fotoPerfil: null,
      numeroMatricula: "DG-006",
      estado: "activo" as const,
      estadoPago: "al_dia" as const,
      montoDeuda: null,
      fechaVencimiento: "2025-03-31",
      fechaUltimoPago: "2024-01-25",
    },
    {
      email: "sofia.torres@email.com",
      password: hashSync("user123", 10),
      tipo: "matriculado" as const,
      nombre: "Sofia",
      apellido: "Torres",
      dni: "89012345",
      ciudad: "Garupa",
      celular: "3763123456",
      domicilio: "Calle Las Heras 654",
      estudio: null,
      instagram: "@sofiatorres.art",
      facebook: null,
      paginaWeb: null,
      linkedin: null,
      behance: "sofiatorres",
      fotoPerfil: null,
      numeroMatricula: "DG-007",
      estado: "activo" as const,
      estadoPago: "deuda" as const,
      montoDeuda: 15000,
      fechaVencimiento: "2024-03-31",
      fechaUltimoPago: null,
    },
  ];

  for (const m of matriculadosData) {
    await db.insert(schema.matriculados).values(m);
  }
  console.log(`Inserted ${matriculadosData.length} matriculados`);

  // Seed notifications
  const notificationsData = [
    {
      matriculadoId: 2,
      titulo: "Bienvenida al sistema",
      mensaje: "Te damos la bienvenida al nuevo sistema de matriculas del Colegio.",
      tipo: "info" as const,
      leida: true,
    },
    {
      matriculadoId: 3,
      titulo: "Matricula vencida",
      mensaje: "Tu matricula esta vencida. Por favor realiza el pago para mantener tus servicios activos.",
      tipo: "warning" as const,
      leida: false,
    },
    {
      matriculadoId: 5,
      titulo: "Suspension de servicios",
      mensaje: "Tus servicios han sido suspendidos por falta de pago. Contacta al administrador.",
      tipo: "error" as const,
      leida: false,
    },
    {
      matriculadoId: 8,
      titulo: "Recordatorio de pago",
      mensaje: "Recorda que tu matricula vence el 31 de marzo.",
      tipo: "warning" as const,
      leida: false,
    },
  ];

  for (const n of notificationsData) {
    await db.insert(schema.notifications).values(n);
  }
  console.log(`Inserted ${notificationsData.length} notifications`);

  // Seed system config
  const configData = [
    { configKey: "precioMatricula", configValue: "15000" },
    { configKey: "fechaInicioPago", configValue: "2024-01-01" },
    { configKey: "fechaVencimientoPago", configValue: "2024-03-31" },
  ];

  for (const c of configData) {
    await db.insert(schema.systemConfig).values(c);
  }
  console.log(`Inserted ${configData.length} config entries`);

  // Seed site content (home page)
  const siteContentData = [
    { page: "home", section: "hero", contentKey: "badge", contentValue: "Sistema de Matriculas Profesionales" },
    { page: "home", section: "hero", contentKey: "title", contentValue: "Colegio de " },
    { page: "home", section: "hero", contentKey: "highlightText", contentValue: "Disenadores Graficos" },
    { page: "home", section: "hero", contentKey: "subtitle", contentValue: " de Misiones" },
    { page: "home", section: "hero", contentKey: "description", contentValue: "Sistema integral de gestion de matriculas profesionales. Forma parte de nuestra gran comunidad." },
    { page: "home", section: "hero", contentKey: "primaryButtonText", contentValue: "Acceder al sistema" },
    { page: "home", section: "hero", contentKey: "secondaryButtonText", contentValue: "Ver Directorio" },
    { page: "home", section: "previewCards", contentKey: "matriculaTitle", contentValue: "Sistema de Matriculas Profesionales" },
    { page: "home", section: "previewCards", contentKey: "matriculaSubtitle", contentValue: "Colegio de Disenadores Graficos de Misiones" },
    { page: "home", section: "previewCards", contentKey: "profesionalesTitle", contentValue: "Profesionales" },
    { page: "home", section: "previewCards", contentKey: "profesionalesSubtitle", contentValue: "500+ matriculados" },
    { page: "home", section: "previewCards", contentKey: "tarifarioTitle", contentValue: "Acceso al Tarifario para Profesionales" },
    { page: "home", section: "previewCards", contentKey: "tarifarioSubtitle", contentValue: "Valores actualizados" },
    { page: "home", section: "footer", contentKey: "description", contentValue: "Representando y regulando la actividad del diseno grafico en la provincia de Misiones." },
    { page: "home", section: "footer", contentKey: "email", contentValue: "contacto@colegiodgmisiones.org" },
    { page: "home", section: "footer", contentKey: "direccion", contentValue: "Posadas, Misiones, Argentina" },
    { page: "dashboard", section: "welcome", contentKey: "title", contentValue: "Bienvenido!" },
    { page: "dashboard", section: "welcome", contentKey: "subtitle", contentValue: "Este es tu panel de control personalizado." },
    { page: "dashboard", section: "cards", contentKey: "estadoMatriculaTitle", contentValue: "Estado de Matricula" },
    { page: "dashboard", section: "cards", contentKey: "estadoMatriculaAlDia", contentValue: "Al dia" },
    { page: "dashboard", section: "cards", contentKey: "estadoMatriculaDeuda", contentValue: "En deuda" },
    { page: "dashboard", section: "cards", contentKey: "proximoVencimientoTitle", contentValue: "Proximo Vencimiento" },
    { page: "dashboard", section: "cards", contentKey: "notificacionesTitle", contentValue: "Notificaciones" },
    { page: "dashboard", section: "cards", contentKey: "notificacionesEmpty", contentValue: "No tenes notificaciones pendientes" },
    { page: "dashboard", section: "cards", contentKey: "accesoDirectoTitle", contentValue: "Acceso Directo" },
    { page: "dashboard", section: "cards", contentKey: "accesoDirectoDirectorio", contentValue: "Ver Directorio" },
    { page: "dashboard", section: "cards", contentKey: "accesoDirectoTarifario", contentValue: "Ver Tarifario" },
    { page: "dashboard", section: "cards", contentKey: "tarifarioTitle", contentValue: "Tarifario de Referencia" },
    { page: "dashboard", section: "cards", contentKey: "tarifarioDescription", contentValue: "Valores orientativos para servicios de diseno grafico profesional." },
  ];

  for (const sc of siteContentData) {
    await db.insert(schema.siteContent).values(sc);
  }
  console.log(`Inserted ${siteContentData.length} site content entries`);

  console.log("Seeding complete!");
  process.exit(0);
}

seed();
