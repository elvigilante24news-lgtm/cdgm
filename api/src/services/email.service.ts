import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = process.env.EMAIL_FROM || 'onboarding@resend.dev';

// PORTAL_URL: siempre apunta a la raíz del portal con HashRouter (/#/)
// FRONTEND_URL puede ser solo el dominio (https://cdgm.org.ar) o incluir la subcarpeta
// En cualquier caso construimos la URL correcta sin duplicar rutas.
function getPortalUrl(): string {
  const base = (process.env.FRONTEND_URL || 'https://cdgm.org.ar').replace(/\/$/, '');
  // Si ya incluye /portal-matriculados, no lo agregamos de nuevo
  if (base.includes('portal-matriculados')) {
    return `${base}/#/`;
  }
  return `${base}/portal-matriculados/#/`;
}

const PORTAL_URL = getPortalUrl();

interface WelcomeEmailParams {
  to: string;
  nombre: string;
  apellido: string;
  password: string;
  numeroMatricula?: string | null;
  precioMatricula: number;
  fechaVencimiento?: string | null;
}

interface ReminderEmailParams {
  to: string;
  nombre: string;
  apellido: string;
  montoDeuda: number;
  fechaVencimiento?: string | null;
}

export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<void> {
  const { to, nombre, apellido, password, numeroMatricula, precioMatricula, fechaVencimiento } = params;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bienvenido al Portal CDGM</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#0ea5e9;padding:32px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">CDGM</h1>
            <p style="color:#e0f2fe;margin:8px 0 0;font-size:14px;">Colegio de Diseñadores Gráficos de Misiones</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">¡Bienvenido, ${nombre}!</h2>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Tu cuenta en el Portal de Matriculados del CDGM fue creada exitosamente.
              A continuación encontrás tus datos de acceso:
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 10px;color:#0369a1;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Datos de acceso</p>
                <p style="margin:0 0 6px;color:#1e293b;font-size:15px;"><strong>Email:</strong> ${to}</p>
                <p style="margin:0 0 6px;color:#1e293b;font-size:15px;"><strong>Contraseña:</strong> ${password}</p>
                ${numeroMatricula ? `<p style="margin:0;color:#1e293b;font-size:15px;"><strong>N° de Matrícula:</strong> ${numeroMatricula}</p>` : ''}
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;margin-bottom:32px;">
              <tr><td style="padding:16px 24px;">
                <p style="margin:0 0 6px;color:#92400e;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Información de matrícula</p>
                <p style="margin:0 0 4px;color:#1e293b;font-size:14px;">Monto: <strong>$${precioMatricula.toLocaleString('es-AR')}</strong></p>
                ${fechaVencimiento ? `<p style="margin:0;color:#1e293b;font-size:14px;">Fecha de vencimiento: <strong>${new Date(fechaVencimiento + 'T00:00:00').toLocaleDateString('es-AR')}</strong></p>` : ''}
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="${PORTAL_URL}" style="display:inline-block;background:#0ea5e9;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                  Ingresar al portal
                </a>
              </td></tr>
            </table>
            <p style="color:#94a3b8;font-size:12px;text-align:center;margin:24px 0 0;">
              Te recomendamos cambiar tu contraseña al ingresar por primera vez.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">
              © ${new Date().getFullYear()} Colegio de Diseñadores Gráficos de Misiones — 
              <a href="${PORTAL_URL}" style="color:#0ea5e9;text-decoration:none;">Portal de Matriculados</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Bienvenido al Portal CDGM, ${nombre} ${apellido}`,
      html,
    });
    console.log(`Email de bienvenida enviado a ${to}`);
  } catch (err) {
    console.error('Error enviando email de bienvenida:', err);
  }
}

export async function sendPaymentReminderEmail(params: ReminderEmailParams): Promise<void> {
  const { to, nombre, apellido, montoDeuda, fechaVencimiento } = params;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#f59e0b;padding:28px 40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">Recordatorio de Pago</h1>
          <p style="color:#fef3c7;margin:6px 0 0;font-size:13px;">Colegio de Diseñadores Gráficos de Misiones</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="color:#1e293b;font-size:15px;">Hola <strong>${nombre} ${apellido}</strong>,</p>
          <p style="color:#475569;font-size:15px;line-height:1.6;">
            Te recordamos que tenés una matrícula pendiente de pago:
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;margin:16px 0 24px;">
            <tr><td style="padding:16px 24px;">
              <p style="margin:0 0 6px;color:#1e293b;font-size:15px;">Monto adeudado: <strong style="color:#dc2626;">$${montoDeuda.toLocaleString('es-AR')}</strong></p>
              ${fechaVencimiento ? `<p style="margin:0;color:#1e293b;font-size:14px;">Vencimiento: <strong>${new Date(fechaVencimiento + 'T00:00:00').toLocaleDateString('es-AR')}</strong></p>` : ''}
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${PORTAL_URL}" style="display:inline-block;background:#f59e0b;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">
                Ir al portal y pagar
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} CDGM</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: 'Recordatorio de pago de matrícula — CDGM',
      html,
    });
    console.log(`Recordatorio de pago enviado a ${to}`);
  } catch (err) {
    console.error('Error enviando recordatorio de pago:', err);
  }
}