import { Request, Response } from 'express';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types';

function getMPClient(): MercadoPagoConfig {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado en variables de entorno');
  }
  return new MercadoPagoConfig({ accessToken, options: { timeout: 15000 } });
}

/**
 * POST /api/pagos/preferencia
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

    // FIX: Math.round() — MP Argentina (ARS) exige entero, sin decimales
    const precio = Math.round(config?.precio_matricula ?? 15000);
    const currentYear = new Date().getFullYear();

    const frontendUrl = (process.env.FRONTEND_URL || 'https://c2851498.ferozo.com').replace(/\/$/, '');
    const backendUrl  = (process.env.BACKEND_URL || '').replace(/\/$/, '');

    const client = getMPClient();
    const preferenceClient = new Preference(client);

    // FIX: notification_url SOLO si BACKEND_URL está bien configurado
    // Si apunta a una URL muerta, MP rechaza el checkout en producción
    const notificationUrl = backendUrl
      ? `${backendUrl}/api/pagos/webhook`
      : undefined;

    if (notificationUrl) {
      console.log(`MP: notification_url = ${notificationUrl}`);
    } else {
      console.warn('MP: BACKEND_URL no configurado — webhook desactivado para esta preferencia');
    }

    const preferenceBody: any = {
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
      // back_urls con query params (sin #) para compatibilidad con MP
      back_urls: {
        success: `${frontendUrl}?pago=exitoso`,
        failure: `${frontendUrl}?pago=fallido`,
        pending: `${frontendUrl}?pago=pendiente`,
      },
      auto_return: 'approved',
      statement_descriptor: 'CDGM MATRICULA',
      expires: false,
    };

    // Solo añadir notification_url si tenemos una URL válida
    if (notificationUrl) {
      preferenceBody.notification_url = notificationUrl;
    }

    console.log(`MP: creando preferencia para usuario ${user.id}, precio ARS $${precio}`);

    const preferenceData = await preferenceClient.create({ body: preferenceBody });

    console.log(`MP: preferencia creada OK — id: ${preferenceData.id}`);

    res.status(200).json({
      success: true,
      data: {
        init_point:         preferenceData.init_point,
        sandbox_init_point: preferenceData.sandbox_init_point,
        preference_id:      preferenceData.id,
      },
    });
  } catch (error: any) {
    // FIX: loguear el error COMPLETO de MP para poder diagnosticar
    console.error('Error creando preferencia MercadoPago:', JSON.stringify(error, null, 2));

    const mpError = error?.cause ?? error?.message ?? 'Error desconocido';
    console.error('Detalle MP:', mpError);

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
  res.status(200).json({ success: true });

  try {
    const { type, id: queryId } = req.query;
    const body = req.body;

    const paymentId =
      (type === 'payment' && queryId)
        ? String(queryId)
        : body?.data?.id
        ? String(body.data.id)
        : null;

    if (!paymentId || (type && type !== 'payment')) return;

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

    if (user.estado_pago === 'al_dia') return; // idempotencia

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
    console.error('Error procesando webhook MercadoPago:', err);
  }
};