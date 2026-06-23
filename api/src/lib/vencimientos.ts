import { prisma } from './prisma';

// FIX: lógica real de vencimiento de matrícula.
//
// Regla de negocio (definida por el cliente):
// - "Fecha Inicio Pago" y "Fecha Vencimiento" en Configuración del Sistema
//   determinan la ventana de pago de la matrícula vigente.
// - Si hoy ya pasó la "Fecha Vencimiento" y un matriculado no pagó dentro de esa
//   ventana (es decir, su último pago fue antes de "Fecha Inicio Pago", o nunca pagó),
//   su cuenta debe figurar como "En deuda" en el listado del admin.
//
// No usamos un cron job — se ejecuta de forma perezosa (lazy) cada vez que se
// lee la lista de usuarios o el perfil propio, así no depende de tareas
// programadas en Railway y siempre refleja el estado real al momento de mirar.
export async function marcarVencidosComoDeuda(): Promise<void> {
  try {
    const config = await prisma.configuracionSistema.findFirst();
    if (!config) return; // Todavía no se configuró nada, nada que marcar

    const hoy = new Date().toISOString().split('T')[0];

    // Si todavía no llegamos a la fecha de vencimiento, no hay nada que marcar
    if (hoy <= config.fecha_vencimiento_pago) return;

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
    // No bloqueamos la respuesta principal si esto falla — se reintenta en la próxima lectura
    console.error('Error marcando usuarios vencidos como deuda:', error);
  }
}