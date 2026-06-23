import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types';

export const obtenerContenido = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    let contenido = await prisma.contenidoWeb.findFirst();

    // Si no existe, crear uno por defecto (singleton)
    if (!contenido) {
      contenido = await prisma.contenidoWeb.create({
        data: {
          home_content: {
            badge: "Colegio de Disenadores Graficos de Misiones",
            heroTitle: "Excelencia Profesional en",
            heroHighlight: "Diseno Grafico",
            heroDescription: "Unimos a los disenadores graficos de Misiones para promover la excelencia profesional.",
            heroCtaPrimary: "Ver Directorio",
            heroCtaSecondary: "Sobre Nosotros",
          },
          dashboard_content: {
            welcomeTitle: "Bienvenido a tu Portal",
            quickActions: [],
          },
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        home_content: contenido.home_content,
        dashboard_content: contenido.dashboard_content,
      },
    });
  } catch (error) {
    console.error('Error obteniendo contenido:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const actualizarHomeContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { homeContent } = req.body;

    if (!homeContent || typeof homeContent !== 'object') {
      res.status(400).json({ success: false, error: 'homeContent es requerido y debe ser un objeto JSON' });
      return;
    }

    let contenido = await prisma.contenidoWeb.findFirst();

    if (!contenido) {
      contenido = await prisma.contenidoWeb.create({
        data: {
          home_content: homeContent,
          dashboard_content: {},
        },
      });
    } else {
      contenido = await prisma.contenidoWeb.update({
        where: { id: contenido.id },
        data: { home_content: homeContent },
      });
    }

    res.status(200).json({
      success: true,
      data: { home_content: contenido.home_content },
      message: 'Contenido de home actualizado correctamente',
    });
  } catch (error) {
    console.error('Error actualizando home content:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const actualizarDashboardContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { dashboardContent } = req.body;

    if (!dashboardContent || typeof dashboardContent !== 'object') {
      res.status(400).json({ success: false, error: 'dashboardContent es requerido y debe ser un objeto JSON' });
      return;
    }

    let contenido = await prisma.contenidoWeb.findFirst();

    if (!contenido) {
      contenido = await prisma.contenidoWeb.create({
        data: {
          home_content: {},
          dashboard_content: dashboardContent,
        },
      });
    } else {
      contenido = await prisma.contenidoWeb.update({
        where: { id: contenido.id },
        data: { dashboard_content: dashboardContent },
      });
    }

    res.status(200).json({
      success: true,
      data: { dashboard_content: contenido.dashboard_content },
      message: 'Contenido de dashboard actualizado correctamente',
    });
  } catch (error) {
    console.error('Error actualizando dashboard content:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

// FIX: el frontend llamaba a PUT /contenido (sin sufijo) con { home_content, dashboard_content }
// en snake_case combinados, pero esa ruta nunca existió — solo existían /home y /dashboard por
// separado, con nombres de campo distintos (homeContent/dashboardContent). Resultado: 404 silencioso
// en cada intento de guardar, atrapado por el catch de saveToAPI sin mostrar error al usuario.
export const actualizarContenidoCompleto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { home_content, dashboard_content } = req.body as { home_content?: object; dashboard_content?: object };

    if (!home_content && !dashboard_content) {
      res.status(400).json({ success: false, error: 'Se requiere home_content y/o dashboard_content' });
      return;
    }

    let contenido = await prisma.contenidoWeb.findFirst();

    if (!contenido) {
      contenido = await prisma.contenidoWeb.create({
        data: {
          home_content: home_content ?? {},
          dashboard_content: dashboard_content ?? {},
        },
      });
    } else {
      const updateData: Record<string, object> = {};
      if (home_content !== undefined) updateData.home_content = home_content;
      if (dashboard_content !== undefined) updateData.dashboard_content = dashboard_content;

      contenido = await prisma.contenidoWeb.update({
        where: { id: contenido.id },
        data: updateData,
      });
    }

    res.status(200).json({
      success: true,
      data: { home_content: contenido.home_content, dashboard_content: contenido.dashboard_content },
      message: 'Contenido actualizado correctamente',
    });
  } catch (error) {
    console.error('Error actualizando contenido completo:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};