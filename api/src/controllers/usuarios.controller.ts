import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { AuthRequest, CreateUsuarioInput, UpdateUsuarioInput, UpdateEstadoInput, UpdatePagoInput, UpdateFotoInput } from '../types';
import { sendWelcomeEmail } from '../services/email.service';

// Select base (sin notificaciones) — para lista del admin
const userSelect = {
  id: true,
  email: true,
  tipo: true,
  nombre: true,
  apellido: true,
  dni: true,
  ciudad: true,
  celular: true,
  domicilio: true,
  estudio: true,
  foto_perfil: true,
  numero_matricula: true,
  estado: true,
  estado_pago: true,
  monto_deuda: true,
  fecha_vencimiento: true,
  fecha_ultimo_pago: true,
  instagram: true,
  facebook: true,
  pagina_web: true,
  linkedin: true,
  behance: true,
  created_at: true,
  updated_at: true,
};

// Select con notificaciones — para perfil propio del usuario
const userSelectConNotifs = {
  ...userSelect,
  notificaciones: {
    orderBy: { fecha: 'desc' as const },
    take: 50,
  },
};

// Helper para obtener la configuracion del sistema
const getConfiguracion = async () => {
  return prisma.configuracionSistema.findFirst();
};

export const listarUsuarios = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: userSelect,
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const obtenerUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    if (req.user.tipo !== 'administrador' && req.user.id !== id) {
      res.status(403).json({ success: false, error: 'No tiene permiso para ver este usuario' });
      return;
    }

    // FIX: incluir notificaciones al obtener el perfil propio
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelectConNotifs,
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      return;
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const crearUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      email, password, nombre, apellido, dni, ciudad, celular, domicilio, estudio,
      numero_matricula, instagram, facebook, pagina_web, linkedin, behance,
    } = req.body as CreateUsuarioInput;

    if (!email || !password || !nombre || !apellido || !dni || !ciudad || !celular || !domicilio) {
      res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
      return;
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existingEmail) {
      res.status(409).json({ success: false, error: 'El email ya esta registrado' });
      return;
    }

    const existingDni = await prisma.user.findUnique({ where: { dni: dni.trim() } });
    if (existingDni) {
      res.status(409).json({ success: false, error: 'El DNI ya esta registrado' });
      return;
    }

    if (numero_matricula) {
      const existingMat = await prisma.user.findUnique({ where: { numero_matricula: numero_matricula.trim() } });
      if (existingMat) {
        res.status(409).json({ success: false, error: 'El numero de matricula ya esta registrado' });
        return;
      }
    }

    const config = await getConfiguracion();
    const precioMatricula = config?.precio_matricula ?? 15000;
    const fechaVencimiento = config?.fecha_vencimiento_pago ?? new Date().toISOString().split('T')[0];

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        tipo: 'matriculado',
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim(),
        ciudad: ciudad.trim(),
        celular: celular.trim(),
        domicilio: domicilio.trim(),
        estudio: estudio?.trim() || null,
        numero_matricula: numero_matricula?.trim() || null,
        estado: 'activo',
        estado_pago: 'deuda',
        monto_deuda: precioMatricula,
        fecha_vencimiento: fechaVencimiento,
        instagram: instagram?.trim() || null,
        facebook: facebook?.trim() || null,
        pagina_web: pagina_web?.trim() || null,
        linkedin: linkedin?.trim() || null,
        behance: behance?.trim() || null,
      },
      select: userSelect,
    });

    // Notificación de bienvenida en el sistema
    await prisma.notificacion.create({
      data: {
        user_id: newUser.id,
        titulo: 'Bienvenido al CDGM',
        mensaje: `Hola ${newUser.nombre}, tu registro como matriculado fue exitoso. Tu número de matrícula es ${newUser.numero_matricula || 'pendiente de asignación'}. Recordá regularizar tu situación de pago antes del ${fechaVencimiento}.`,
        tipo: 'success',
      },
    });

    // FIX: enviar email de bienvenida con credenciales (no bloquea si falla)
    sendWelcomeEmail({
      to: newUser.email,
      nombre: newUser.nombre,
      apellido: newUser.apellido,
      password,           // password sin hashear para enviar en el mail
      numeroMatricula: newUser.numero_matricula,
      precioMatricula,
      fechaVencimiento,
    }).catch((err) => console.error('Email de bienvenida falló:', err));

    res.status(201).json({ success: true, data: newUser, message: 'Usuario creado correctamente' });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const actualizarUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    if (req.user.tipo !== 'administrador' && req.user.id !== id) {
      res.status(403).json({ success: false, error: 'No tiene permiso para editar este usuario' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      return;
    }

    const {
      nombre, apellido, ciudad, celular, domicilio, estudio,
      numero_matricula, instagram, facebook, pagina_web, linkedin, behance,
    } = req.body as UpdateUsuarioInput;

    if (numero_matricula && numero_matricula !== user.numero_matricula) {
      const existingMat = await prisma.user.findUnique({ where: { numero_matricula: numero_matricula.trim() } });
      if (existingMat) {
        res.status(409).json({ success: false, error: 'El numero de matricula ya esta registrado' });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        nombre: nombre?.trim(),
        apellido: apellido?.trim(),
        ciudad: ciudad?.trim(),
        celular: celular?.trim(),
        domicilio: domicilio?.trim(),
        estudio: estudio === undefined ? undefined : (estudio?.trim() || null),
        numero_matricula: numero_matricula === undefined ? undefined : (numero_matricula?.trim() || null),
        instagram: instagram === undefined ? undefined : (instagram?.trim() || null),
        facebook: facebook === undefined ? undefined : (facebook?.trim() || null),
        pagina_web: pagina_web === undefined ? undefined : (pagina_web?.trim() || null),
        linkedin: linkedin === undefined ? undefined : (linkedin?.trim() || null),
        behance: behance === undefined ? undefined : (behance?.trim() || null),
      },
      select: userSelect,
    });

    res.status(200).json({ success: true, data: updatedUser, message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const actualizarEstado = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { estado } = req.body as UpdateEstadoInput;

    if (!estado || !['activo', 'suspendido', 'baja'].includes(estado)) {
      res.status(400).json({ success: false, error: 'Estado invalido. Valores permitidos: activo, suspendido, baja' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { estado },
      select: userSelect,
    });

    const estadoMessages: Record<string, string> = {
      activo: 'Tu cuenta fue activada. Ya podés acceder a todas las funcionalidades del portal.',
      suspendido: 'Tu cuenta fue suspendida por falta de pago. Regularizá tu situación para recuperar el acceso.',
      baja: 'Tu cuenta fue dada de baja. Si creés que es un error, contactá al administrador.',
    };

    await prisma.notificacion.create({
      data: {
        user_id: id,
        titulo: `Estado de cuenta: ${estado}`,
        mensaje: estadoMessages[estado],
        tipo: estado === 'activo' ? 'success' : 'warning',
      },
    });

    res.status(200).json({ success: true, data: updatedUser, message: 'Estado actualizado correctamente' });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const actualizarPago = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // FIX: aceptamos tanto camelCase (desde admin) como snake_case (legacy)
    const body = req.body as UpdatePagoInput & { estado_pago?: string; monto_deuda?: number };
    const estadoPago = (body.estadoPago || body.estado_pago) as 'al_dia' | 'deuda' | undefined;
    const montoDeuda = body.montoDeuda ?? body.monto_deuda;

    if (!estadoPago || !['al_dia', 'deuda'].includes(estadoPago)) {
      res.status(400).json({ success: false, error: 'Estado de pago invalido. Valores permitidos: al_dia, deuda' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      return;
    }

    const updateData: Record<string, unknown> = { estado_pago: estadoPago };

    if (estadoPago === 'al_dia') {
      updateData.fecha_ultimo_pago = new Date().toISOString().split('T')[0];
      updateData.monto_deuda = null;
    } else {
      updateData.monto_deuda = montoDeuda ?? user.monto_deuda;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: userSelect,
    });

    const pagoMessages: Record<string, { titulo: string; mensaje: string; tipo: 'success' | 'warning' }> = {
      al_dia: {
        titulo: 'Pago registrado ✓',
        mensaje: 'Tu pago fue registrado exitosamente. Tu matrícula está al día.',
        tipo: 'success',
      },
      deuda: {
        titulo: 'Recordatorio de pago',
        mensaje: `Se registró una deuda de $${(montoDeuda ?? user.monto_deuda ?? 0).toLocaleString('es-AR')} en tu cuenta. Por favor regularizá tu situación antes del vencimiento.`,
        tipo: 'warning',
      },
    };

    await prisma.notificacion.create({
      data: {
        user_id: id,
        titulo: pagoMessages[estadoPago].titulo,
        mensaje: pagoMessages[estadoPago].mensaje,
        tipo: pagoMessages[estadoPago].tipo,
      },
    });

    res.status(200).json({ success: true, data: updatedUser, message: 'Estado de pago actualizado correctamente' });
  } catch (error) {
    console.error('Error actualizando pago:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const actualizarFoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { fotoBase64 } = req.body as UpdateFotoInput;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    if (req.user.tipo !== 'administrador' && req.user.id !== id) {
      res.status(403).json({ success: false, error: 'No tiene permiso para editar este usuario' });
      return;
    }

    if (!fotoBase64 || typeof fotoBase64 !== 'string') {
      res.status(400).json({ success: false, error: 'fotoBase64 es requerido y debe ser un string' });
      return;
    }

    if (!fotoBase64.startsWith('data:image/')) {
      res.status(400).json({ success: false, error: 'La imagen debe ser un base64 valido (data:image/...)' });
      return;
    }

    const base64Length = fotoBase64.length * (3 / 4);
    if (base64Length > 5 * 1024 * 1024) {
      res.status(400).json({ success: false, error: 'La imagen no debe superar los 5MB' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { foto_perfil: fotoBase64 },
      select: userSelect,
    });

    res.status(200).json({ success: true, data: updatedUser, message: 'Foto de perfil actualizada correctamente' });
  } catch (error) {
    console.error('Error actualizando foto:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};
