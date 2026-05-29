import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest, UpdateConfiguracionInput } from '../types';

export const obtenerConfiguracion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    let config = await prisma.configuracionSistema.findFirst();

    // Si no existe, crear una por defecto (singleton)
    if (!config) {
      config = await prisma.configuracionSistema.create({
        data: {
          precio_matricula: 15000,
          fecha_inicio_pago: new Date().toISOString().split('T')[0],
          fecha_vencimiento_pago: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        },
      });
    }

    res.status(200).json({ success: true, data: config });
  } catch (error) {
    console.error('Error obteniendo configuracion:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const actualizarConfiguracion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { precioMatricula, fechaInicioPago, fechaVencimientoPago } = req.body as UpdateConfiguracionInput;

    const updateData: Record<string, unknown> = {};

    if (precioMatricula !== undefined) {
      if (typeof precioMatricula !== 'number' || precioMatricula < 0) {
        res.status(400).json({ success: false, error: 'precioMatricula debe ser un numero positivo' });
        return;
      }
      updateData.precio_matricula = precioMatricula;
    }

    if (fechaInicioPago !== undefined) {
      // Validar formato de fecha ISO
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(fechaInicioPago)) {
        res.status(400).json({ success: false, error: 'fechaInicioPago debe tener formato YYYY-MM-DD' });
        return;
      }
      updateData.fecha_inicio_pago = fechaInicioPago;
    }

    if (fechaVencimientoPago !== undefined) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(fechaVencimientoPago)) {
        res.status(400).json({ success: false, error: 'fechaVencimientoPago debe tener formato YYYY-MM-DD' });
        return;
      }
      updateData.fecha_vencimiento_pago = fechaVencimientoPago;
    }

    // Obtener o crear la configuracion
    let config = await prisma.configuracionSistema.findFirst();

    if (!config) {
      config = await prisma.configuracionSistema.create({
        data: {
          precio_matricula: precioMatricula ?? 15000,
          fecha_inicio_pago: fechaInicioPago ?? new Date().toISOString().split('T')[0],
          fecha_vencimiento_pago: fechaVencimientoPago ?? new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        },
      });
    } else {
      config = await prisma.configuracionSistema.update({
        where: { id: config.id },
        data: updateData,
      });
    }

    res.status(200).json({ success: true, data: config, message: 'Configuracion actualizada correctamente' });
  } catch (error) {
    console.error('Error actualizando configuracion:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};
