import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest, CreateNotificacionInput } from '../types';

export const listarNotificaciones = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    const notificaciones = await prisma.notificacion.findMany({
      where: { user_id: req.user.id },
      orderBy: { fecha: 'desc' },
    });

    res.status(200).json({ success: true, data: notificaciones });
  } catch (error) {
    console.error('Error listando notificaciones:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const marcarComoLeida = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    const { id } = req.params;

    const notificacion = await prisma.notificacion.findUnique({
      where: { id },
    });

    if (!notificacion) {
      res.status(404).json({ success: false, error: 'Notificacion no encontrada' });
      return;
    }

    // Verificar que la notificacion pertenezca al usuario autenticado
    if (notificacion.user_id !== req.user.id) {
      res.status(403).json({ success: false, error: 'No tiene permiso para modificar esta notificacion' });
      return;
    }

    const updatedNotif = await prisma.notificacion.update({
      where: { id },
      data: { leida: true },
    });

    res.status(200).json({ success: true, data: updatedNotif, message: 'Notificacion marcada como leida' });
  } catch (error) {
    console.error('Error marcando notificacion como leida:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const crearNotificacion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, titulo, mensaje, tipo } = req.body as CreateNotificacionInput;

    if (!userId || !titulo || !mensaje) {
      res.status(400).json({ success: false, error: 'userId, titulo y mensaje son requeridos' });
      return;
    }

    // Verificar que el usuario destino existe
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuario destino no encontrado' });
      return;
    }

    const notificacion = await prisma.notificacion.create({
      data: {
        user_id: userId,
        titulo: titulo.trim(),
        mensaje: mensaje.trim(),
        tipo: tipo || 'info',
      },
    });

    res.status(201).json({ success: true, data: notificacion, message: 'Notificacion enviada correctamente' });
  } catch (error) {
    console.error('Error creando notificacion:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};
