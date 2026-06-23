import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Dirección "from" configurable — registrá tu dominio en resend.com/domains
// Mientras no tengas dominio propio verificado, usá: onboarding@resend.dev (solo para pruebas)
const FROM_ADDRESS = process.env.EMAIL_FROM || 'onboarding@resend.dev';
// FIX: los botones de los emails deben apuntar a la app (portal-matriculados),
// no solo al dominio raíz — FRONTEND_URL sigue usándose para CORS en index.ts.
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://cdgm.org.ar';
const PORTAL_URL = `${FRONTEND_URL.replace(/\/$/, '')}/portal-matriculados/`;

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
        <!-- Header -->
        <tr>
          <td style="background:#0ea5e9;padding:32px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">CDGM</h1>
            <p style="color:#e0f2fe;margin:8px 0 0;font-size:14px;">Colegio de Diseñadores Gráficos de Misiones</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">¡Bienvenido, ${nombre}!</h2>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Tu cuenta en el Portal de Matriculados del CDGM fue creada exitosamente.
              A continuación encontrás tus datos de acceso:
            </p>
            <!-- Credentials box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 10px;color:#0369a1;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Datos de acceso</p>
                <p style="margin:0 0 6px;color:#1e293b;font-size:15px;"><strong>Email:</strong> ${to}</p>
                <p style="margin:0 0 6px;color:#1e293b;font-size:15px;"><strong>Contraseña:</strong> ${password}</p>
                ${numeroMatricula ? `<p style="margin:0;color:#1e293b;font-size:15px;"><strong>N° de Matrícula:</strong> ${numeroMatricula}</p>` : ''}
              </td></tr>
            </table>
            <!-- Payment info -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;margin-bottom:32px;">
              <tr><td style="padding:16px 24px;">
                <p style="margin:0 0 6px;color:#92400e;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Información de matrícula</p>
                <p style="margin:0 0 4px;color:#1e293b;font-size:14px;">Monto: <strong>$${precioMatricula.toLocaleString('es-AR')}</strong></p>
                ${fechaVencimiento ? `<p style="margin:0;color:#1e293b;font-size:14px;">Fecha de vencimiento: <strong>${new Date(fechaVencimiento).toLocaleDateString('es-AR')}</strong></p>` : ''}
              </td></tr>
            </table>
            <!-- CTA -->
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
        <!-- Footer -->
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
  } catch (err) {
    // No bloqueamos la creación del usuario si falla el email
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
              ${fechaVencimiento ? `<p style="margin:0;color:#1e293b;font-size:14px;">Vencimiento: <strong>${new Date(fechaVencimiento).toLocaleDateString('es-AR')}</strong></p>` : ''}
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
  } catch (err) {
    console.error('Error enviando recordatorio de pago:', err);
  }
}

// FIX: nueva función — email con el código de recuperación de contraseña
interface ResetCodeEmailParams {
  to: string;
  nombre: string;
  codigo: string;
}

export async function sendPasswordResetEmail(params: ResetCodeEmailParams): Promise<void> {
  const { to, nombre, codigo } = params;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Recuperación de contraseña — CDGM</title>
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
        <tr><td style="padding:40px 40px 32px;">
          <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Hola, ${nombre}</h2>
          <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Recibimos una solicitud para restablecer tu contraseña. Usá el siguiente código para continuar.
            Es válido por <strong>15 minutos</strong>.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;margin-bottom:24px;">
            <tr><td style="padding:24px;text-align:center;">
              <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#0284c7;">${codigo}</span>
            </td></tr>
          </table>
          <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0;">
            Si no solicitaste este cambio, podés ignorar este email — tu contraseña actual seguirá funcionando con normalidad.
          </p>
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
      subject: 'Código de recuperación de contraseña — CDGM',
      html,
    });
  } catch (err) {
    console.error('Error enviando email de recuperación:', err);
    throw err; // FIX: este sí lo propagamos — si el email falla, el front debe saberlo
  }
}

// FIX: nueva función — email genérico para cualquier notificación del admin
// (antes las notificaciones solo se guardaban en la DB y nunca llegaban al correo)
interface GenericNotificationEmailParams {
  to: string;
  nombre: string;
  titulo: string;
  mensaje: string;
  tipo?: 'info' | 'warning' | 'success' | 'error';
}

const TIPO_COLORS: Record<string, { bg: string; border: string; accent: string }> = {
  info:    { bg: '#f0f9ff', border: '#bae6fd', accent: '#0284c7' },
  success: { bg: '#f0fdf4', border: '#bbf7d0', accent: '#16a34a' },
  warning: { bg: '#fff7ed', border: '#fed7aa', accent: '#f59e0b' },
  error:   { bg: '#fef2f2', border: '#fecaca', accent: '#dc2626' },
};

export async function sendGenericNotificationEmail(params: GenericNotificationEmailParams): Promise<void> {
  const { to, nombre, titulo, mensaje, tipo } = params;
  const colors = TIPO_COLORS[tipo || 'info'] || TIPO_COLORS.info;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${titulo} — CDGM</title>
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
        <tr><td style="padding:40px 40px 32px;">
          <p style="color:#1e293b;font-size:15px;margin:0 0 16px;">Hola <strong>${nombre}</strong>,</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:${colors.bg};border:1px solid ${colors.border};border-radius:8px;margin-bottom:8px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 8px;color:${colors.accent};font-size:17px;font-weight:700;">${titulo}</p>
              <p style="margin:0;color:#334155;font-size:15px;line-height:1.6;white-space:pre-line;">${mensaje}</p>
            </td></tr>
          </table>
          <p style="color:#94a3b8;font-size:13px;margin:24px 0 0;">
            Podés ver todas tus notificaciones ingresando a tu panel en el Portal de Matriculados.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
            <tr><td align="center">
              <a href="${PORTAL_URL}" style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">
                Ir al portal
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
      subject: `${titulo} — CDGM`,
      html,
    });
  } catch (err) {
    console.error('Error enviando notificacion por email:', err);
  }
}