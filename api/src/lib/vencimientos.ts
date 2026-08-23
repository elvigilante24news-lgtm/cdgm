import { prisma } from './prisma';

// Lógica de vencimiento de matrícula anual.
//
// Regla de negocio:
// - Si hoy ya pasó la "Fecha Vencimiento" configurada en el panel admin,
//   los usuarios que NO pagaron dentro de la ventana actual se marcan como "deuda".
// - Un usuario se considera al día si su fecha_ultimo_pago está DENTRO de la ventana
//   de pago actual (>= fecha_inicio_pago).
// - Un usuario que pagó HOY nunca es reseteado, incluso si el vencimiento ya pasó,
//   porque su fecha_ultimo_pago >= fecha_inicio_pago.
//
// Se ejecuta de forma "lazy" (sin cron job) en cada llamada a /auth/me y login.

export async function marcarVencidosComoDeuda(): Promise<void> {
  try {
    const config = await prisma.configuracionSistema.findFirst();
    if (!config) return;

    const hoy = new Date().toISOString().split('T')[0];

    // Si todavía no venció el plazo, no hay nada que marcar
    if (hoy <= config.fecha_vencimiento_pago) return;

    // Marcar como deuda a los que están "al_dia" pero:
    // - Nunca pagaron (fecha_ultimo_pago null)
    // - O pagaron ANTES del inicio de la ventana actual (pago de año anterior)
    //
    // IMPORTANTE: si fecha_ultimo_pago >= fecha_inicio_pago, el usuario pagó
    // dentro de la ventana actual y NO se toca, aunque hoy sea posterior al vencimiento.
    // Esto protege a quienes pagan tarde pero dentro del año en curso.
    await prisma.user.updateMany({
      where: {
        tipo: 'matriculado',
        estado_pago: 'al_dia',
        OR: [
          { fecha_ultimo_pago: null },
          { fecha_ultimo_pago: { lt: config.fecha_inicio_pago } },
        ],
      },
      data: {
        estado_pago: 'deuda',
        monto_deuda: config.precio_matricula,
        fecha_vencimiento: config.fecha_vencimiento_pago,
      },
    });
  } catch (error) {
    console.error('Error marcando usuarios vencidos como deuda:', error);
  }
}