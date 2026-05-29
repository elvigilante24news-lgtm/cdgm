import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { AuthRequest, CreateUsuarioInput, UpdateUsuarioInput, UpdateEstadoInput, UpdatePagoInput, UpdateFotoInput } from '../types';

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

// Helper para obtener la configuracion del sistema
const getConfiguracion = async () => {
  const config = await prisma.configuracionSistema.findFirst();
  return config;
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

    // Un matriculado solo puede ver su propio perfil
    if (req.user.tipo !== 'administrador' && req.user.id !== id) {
      res.status(403).json({ success: false, error: 'No tiene permiso para ver este usuario' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
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
      email,
      password,
      nombre,
      apellido,
      dni,
      ciudad,
      celular,
      domicilio,
      estudio,
      numero_matricula,
      instagram,
      facebook,
      pagina_web,
      linkedin,
      behance,
    } = req.body as CreateUsuarioInput;

    // Validaciones
    if (!email || !password || !nombre || !apellido || !dni || !ciudad || !celular || !domicilio) {
      res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
      return;
    }

    // Verificar que el email no exista
    const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existingEmail) {
      res.status(409).json({ success: false, error: 'El email ya esta registrado' });
      return;
    }

    // Verificar que el DNI no exista
    const existingDni = await prisma.user.findUnique({ where: { dni: dni.trim() } });
    if (existingDni) {
      res.status(409).json({ success: false, error: 'El DNI ya esta registrado' });
      return;
    }

    // Verificar que la matricula no exista si se proporciona
    if (numero_matricula) {
      const existingMat = await prisma.user.findUnique({ where: { numero_matricula: numero_matricula.trim() } });
      if (existingMat) {
        res.status(409).json({ success: false, error: 'El numero de matricula ya esta registrado' });
        return;
      }
    }

    // Obtener configuracion del sistema
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

    // Crear notificacion de bienvenida
    await prisma.notificacion.create({
      data: {
        user_id: newUser.id,
        titulo: 'Bienvenido al CDGM',
        mensaje: `Hola ${newUser.nombre}, tu registro como matriculado ha sido exitoso. Tu numero de matricula es ${newUser.numero_matricula || 'pendiente'}. Recorda regularizar tu situacion de pago antes del ${fechaVencimiento}.`,
        tipo: 'success',
      },
    });

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

    // Un matriculado solo puede editar su propio perfil
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
      nombre,
      apellido,
      ciudad,
      celular,
      domicilio,
      estudio,
      numero_matricula,
      instagram,
      facebook,
      pagina_web,
      linkedin,
      behance,
    } = req.body as UpdateUsuarioInput;

    // Verificar que la nueva matricula no exista si se esta cambiando
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

    // Crear notificacion al usuario sobre el cambio de estado
    const estadoMessages: Record<string, string> = {
      activo: 'Tu cuenta ha sido activada. Ya podes acceder a todas las funcionalidades del portal.',
      suspendido: 'Tu cuenta ha sido suspendida. Contacta al administrador para mas informacion.',
      baja: 'Tu cuenta ha sido dada de baja. Si crees que es un error, contacta al administrador.',
    };

    await prisma.notificacion.create({
      data: {
        user_id: id,
        titulo: `Cambio de estado: ${estado}`,
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
    const { estadoPago, montoDeuda } = req.body as UpdatePagoInput;

    if (!estadoPago || !['al_dia', 'deuda'].includes(estadoPago)) {
      res.status(400).json({ success: false, error: 'Estado de pago invalido. Valores permitidos: al_dia, deuda' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      return;
    }

    const updateData: Record<string, unknown> = {
      estado_pago: estadoPago,
    };

    if (estadoPago === 'al_dia') {
      // Al marcar como al dia: actualizar fecha de ultimo pago y limpiar deuda
      updateData.fecha_ultimo_pago = new Date().toISOString().split('T')[0];
      updateData.monto_deuda = null;
    } else {
      // Al marcar como deuda: establecer monto
      updateData.monto_deuda = montoDeuda ?? user.monto_deuda;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: userSelect,
    });

    // Crear notificacion al usuario
    const pagoMessages: Record<string, { titulo: string; mensaje: string; tipo: 'success' | 'warning' }> = {
      al_dia: {
        titulo: 'Pago registrado',
        mensaje: 'Tu pago ha sido registrado exitosamente. Tu cuenta esta al dia.',
        tipo: 'success',
      },
      deuda: {
        titulo: 'Recordatorio de pago',
        mensaje: `Se ha registrado una deuda de $${montoDeuda ?? user.monto_deuda} en tu cuenta. Por favor regulariza tu situacion antes de la fecha de vencimiento.`,
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

    // Un matriculado solo puede cambiar su propia foto
    if (req.user.tipo !== 'administrador' && req.user.id !== id) {
      res.status(403).json({ success: false, error: 'No tiene permiso para editar este usuario' });
      return;
    }

    if (!fotoBase64 || typeof fotoBase64 !== 'string') {
      res.status(400).json({ success: false, error: 'fotoBase64 es requerido y debe ser un string' });
      return;
    }

    // Validar que sea un base64 valido (imagen)
    const isValidBase64 = fotoBase64.startsWith('data:image/');
    if (!isValidBase64) {
      res.status(400).json({ success: false, error: 'La imagen debe ser un base64 valido (data:image/...)' });
      return;
    }

    // Validar tamano maximo (5MB aprox en base64)
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
