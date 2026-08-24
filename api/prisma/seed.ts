import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de la base de datos...');

  // 1. Crear usuario administrador
  const adminExists = await prisma.user.findUnique({
    where: { email: 'admin@colegiodg.com' },
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@colegiodg.com',
        password: hashedPassword,
        tipo: 'administrador',
        nombre: 'Administrador',
        apellido: 'Sistema',
        dni: '12345678',
        ciudad: 'Posadas',
        celular: '3764123456',
        domicilio: 'Av. Lavalle 1234',
        estudio: null,
        foto_perfil: null,
        numero_matricula: null,
        estado: 'activo',
        estado_pago: 'al_dia',
        monto_deuda: null,
        fecha_vencimiento: null,
        fecha_ultimo_pago: null,
        instagram: null,
        facebook: null,
        pagina_web: null,
        linkedin: null,
        behance: null,
      },
    });
    console.log('Admin creado:', admin.email);
  } else {
    console.log('El usuario admin ya existe, omitiendo...');
  }

  // 2. Crear configuracion del sistema (singleton)
  const configExists = await prisma.configuracionSistema.findFirst();

  if (!configExists) {
    const config = await prisma.configuracionSistema.create({
      data: {
        precio_matricula: 15000,
        fecha_inicio_pago: '2024-01-01',
        fecha_vencimiento_pago: '2025-12-31',
      },
    });
    console.log('Configuracion del sistema creada:', config);
  } else {
    console.log('La configuracion del sistema ya existe, omitiendo...');
  }

  // 3. Crear contenido web inicial (singleton)
  const contenidoExists = await prisma.contenidoWeb.findFirst();

  if (!contenidoExists) {
    const contenido = await prisma.contenidoWeb.create({
      data: {
        home_content: {
          badge: "Colegio de Disenadores Graficos de Misiones",
          heroTitle: "Excelencia Profesional en",
          heroHighlight: "Diseno Grafico",
          heroDescription: "Unimos a los disenadores graficos de Misiones para promover la excelencia profesional, la formacion continua y el desarrollo de la actividad en nuestra provincia.",
          heroCtaPrimary: "Ver Directorio",
          heroCtaSecondary: "Sobre Nosotros",
          featuresTitle: "Por que Elegirnos",
          featuresSubtitle: "Beneficios de ser parte de nuestra comunidad",
          features: [
            {
              title: "Validacion Profesional",
              description: "Matricula oficial que avala tu ejercicio profesional en toda la provincia de Misiones.",
              icon: "Shield"
            },
            {
              title: "Red de Contactos",
              description: "Conecta con otros profesionales del diseno y amplia tus oportunidades de networking.",
              icon: "Users"
            },
            {
              title: "Formacion Continua",
              description: "Acceso a capacitaciones, talleres y eventos exclusivos para miembros.",
              icon: "GraduationCap"
            }
          ],
          directorioPreviewTitle: "Nuestros Profesionales",
          directorioPreviewSubtitle: "Conoce a los disenadores graficos matriculados",
          statsTitle: "Nuestra Comunidad en Numeros",
          stats: [
            { value: "150+", label: "Matriculados Activos" },
            { value: "12", label: "Anos de Trayectoria" },
            { value: "50+", label: "Eventos Realizados" }
          ],
          footer: {
            telefono: "+54 376 412-3456",
            email: "colegiodgmisiones@gmail.com",
            horario: "Lunes a Viernes: 9:00 - 17:00",
            copyright: "Colegio de Disenadores Graficos de Misiones. Todos los derechos reservados."
          }
        },
        dashboard_content: {
          welcomeTitle: "Bienvenido a tu Portal",
          welcomeSubtitle: "Gestion profesional simplificada",
          quickActionsTitle: "Acciones Rapidas",
          quickActions: [
            { label: "Mi Perfil", icon: "User", path: "/dashboard/perfil" },
            { label: "Notificaciones", icon: "Bell", path: "/dashboard/notificaciones" },
            { label: "Directorio", icon: "Users", path: "/dashboard/directorio" }
          ],
          adminActions: [
            { label: "Gestionar Usuarios", icon: "Users", path: "/dashboard/admin/usuarios" },
            { label: "Configuracion", icon: "Settings", path: "/dashboard/admin/configuracion" },
            { label: "Contenido Web", icon: "FileText", path: "/dashboard/admin/contenido" }
          ]
        },
      },
    });
    console.log('Contenido web creado:', contenido.id);
  } else {
    console.log('El contenido web ya existe, omitiendo...');
  }

  console.log('Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
