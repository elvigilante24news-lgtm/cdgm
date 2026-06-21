import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest, CreateNotificacionInput } from '../types';
import { sendPaymentReminderEmail } from '../services/email.service'; // FIX: envío real de email para recordatorios

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

    const notificacion = await prisma.notificacion.findUnique({ where: { id } });

    if (!notificacion) {
      res.status(404).json({ success: false, error: 'Notificacion no encontrada' });
      return;
    }

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
    const { userId, titulo, mensaje, tipo, enviarEmail } = req.body as CreateNotificacionInput;

    if (!userId || !titulo || !mensaje) {
      res.status(400).json({ success: false, error: 'userId, titulo y mensaje son requeridos' });
      return;
    }

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

    // FIX: si se solicita explícitamente, además del registro interno se envía el email real
    // (usado por el botón "recordatorio de pago" del admin — no bloquea la respuesta si falla)
    if (enviarEmail) {
      sendPaymentReminderEmail({
        to: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        montoDeuda: user.monto_deuda ?? 0,
        fechaVencimiento: user.fecha_vencimiento,
      }).catch((err) => console.error('Email de recordatorio falló:', err));
    }

    res.status(201).json({ success: true, data: notificacion, message: 'Notificacion enviada correctamente' });
  } catch (error) {
    console.error('Error creando notificacion:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

// FIX: nuevo endpoint para envío masivo a todos los matriculados (1 sola query)
export const crearNotificacionMasiva = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { titulo, mensaje, tipo } = req.body as { titulo: string; mensaje: string; tipo?: string };

    if (!titulo || !mensaje) {
      res.status(400).json({ success: false, error: 'titulo y mensaje son requeridos' });
      return;
    }

    const matriculados = await prisma.user.findMany({
      where: { tipo: 'matriculado' },
      select: { id: true },
    });

    if (matriculados.length === 0) {
      res.status(200).json({ success: true, data: { count: 0 }, message: 'No hay usuarios matriculados' });
      return;
    }

    await prisma.notificacion.createMany({
      data: matriculados.map((u) => ({
        user_id: u.id,
        titulo: titulo.trim(),
        mensaje: mensaje.trim(),
        tipo: (tipo || 'info') as 'info' | 'warning' | 'success',
      })),
    });

    res.status(201).json({
      success: true,
      data: { count: matriculados.length },
      message: `Notificación enviada a ${matriculados.length} usuario${matriculados.length === 1 ? '' : 's'}`,
    });
  } catch (error) {
    console.error('Error creando notificacion masiva:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};