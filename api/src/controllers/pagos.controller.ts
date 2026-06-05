import { Request, Response } from 'express';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types';

function getMPClient(): MercadoPagoConfig {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado en variables de entorno');
  }
  return new MercadoPagoConfig({ accessToken, options: { timeout: 10000 } });
}

/**
 * POST /api/pagos/preferencia
 * Usuario autenticado solicita un link de pago para su matrícula.
 * Devuelve { init_point, sandbox_init_point, preference_id }
 */
export const crearPreferencia = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    const [user, config] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user.id } }),
      prisma.configuracionSistema.findFirst(),
    ]);

    if (!user) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      return;
    }

    if (user.estado_pago === 'al_dia') {
      res.status(400).json({ success: false, error: 'Tu matrícula ya se encuentra al día' });
      return;
    }

    if (user.estado === 'suspendido' || user.estado === 'baja') {
      res.status(403).json({ success: false, error: 'Tu cuenta está suspendida. Contactá al administrador.' });
      return;
    }

    const precio = config?.precio_matricula ?? 15000;
    const currentYear = new Date().getFullYear();
    const frontendUrl = (process.env.FRONTEND_URL || 'https://c2851498.ferozo.com').replace(/\/$/, '');
    const backendUrl  = (process.env.BACKEND_URL  || 'https://cdgm-production.up.railway.app').replace(/\/$/, '');

    const client = getMPClient();
    const preferenceClient = new Preference(client);

    const preferenceData = await preferenceClient.create({
      body: {
        items: [
          {
            id: `matricula-${user.id}-${currentYear}`,
            title: `Matrícula CDGM ${currentYear}`,
            description: 'Matrícula anual — Colegio de Diseñadores Gráficos de Misiones',
            quantity: 1,
            unit_price: precio,
            currency_id: 'ARS',
          },
        ],
        payer: {
          name:    user.nombre,
          surname: user.apellido,
          email:   user.email,
        },
        external_reference: user.id,
        back_urls: {
          success: `${frontendUrl}#/pago/exitoso`,
          failure: `${frontendUrl}#/pago/fallido`,
          pending: `${frontendUrl}#/pago/pendiente`,
        },
        auto_return: 'approved',
        // MP llama a este endpoint cuando se procesa un pago
        notification_url: `${backendUrl}/api/pagos/webhook`,
        statement_descriptor: 'CDGM MATRICULA',
        expires: false,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        init_point:         preferenceData.init_point,
        sandbox_init_point: preferenceData.sandbox_init_point,
        preference_id:      preferenceData.id,
      },
    });
  } catch (error: any) {
    console.error('Error creando preferencia MercadoPago:', error);
    res.status(500).json({
      success: false,
      error: error.message?.includes('MERCADOPAGO_ACCESS_TOKEN')
        ? 'El sistema de pagos no está configurado. Contactá al administrador.'
        : 'Error al iniciar el proceso de pago. Intentá de nuevo.',
    });
  }
};

/**
 * POST /api/pagos/webhook
 * MercadoPago llama a este endpoint al procesar un pago.
 * Siempre responde 200 para evitar reintentos de MP.
 */
export const procesarWebhook = async (req: Request, res: Response): Promise<void> => {
  // Responder inmediatamente 200 a MP para evitar reintentos
  res.status(200).json({ success: true });

  try {
    const { type, id: queryId } = req.query;
    const body = req.body;

    // MP envía el ID del pago de distintas formas según la versión del webhook
    const paymentId =
      (type === 'payment' && queryId)
        ? String(queryId)
        : body?.data?.id
        ? String(body.data.id)
        : null;

    if (!paymentId || (type && type !== 'payment')) {
      // No es una notificación de pago (puede ser test o merchant_order)
      return;
    }

    const client = getMPClient();
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: paymentId });

    if (payment.status !== 'approved') {
      console.log(`Webhook MP: pago ${paymentId} con estado "${payment.status}" — no se actualiza`);
      return;
    }

    const userId = payment.external_reference;
    if (!userId) {
      console.error('Webhook MP: pago aprobado sin external_reference');
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.error(`Webhook MP: usuario ${userId} no encontrado`);
      return;
    }

    if (user.estado_pago === 'al_dia') {
      // Ya fue procesado (idempotencia)
      return;
    }

    const monto = payment.transaction_amount ?? 0;

    await prisma.user.update({
      where: { id: userId },
      data: {
        estado_pago: 'al_dia',
        monto_deuda: null,
        fecha_ultimo_pago: new Date().toISOString().split('T')[0],
      },
    });

    await prisma.notificacion.create({
      data: {
        user_id: userId,
        titulo: '¡Pago de matrícula acreditado! ✓',
        mensaje: `Tu pago de $${monto.toLocaleString('es-AR')} fue procesado y acreditado exitosamente. Tu matrícula está al día y tu tarjeta aparece en el directorio de matriculados.`,
        tipo: 'success',
      },
    });

    console.log(`Webhook MP: matrícula de usuario ${userId} actualizada a al_dia (pago ${paymentId})`);
  } catch (err) {
    // Nunca re-lanzar — ya respondimos 200
    console.error('Error procesando webhook MercadoPago:', err);
  }
};
