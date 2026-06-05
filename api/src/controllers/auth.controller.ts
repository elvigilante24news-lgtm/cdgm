import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AuthRequest, LoginInput, ChangePasswordInput } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRES_IN = '7d';

// Select de campos públicos del usuario (sin password)
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
  // FIX: incluir notificaciones para que el usuario las vea en su dashboard
  notificaciones: {
    orderBy: { fecha: 'desc' as const },
    take: 50,
  },
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as LoginInput;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email y password son requeridos' });
      return;
    }

    // Primero buscamos solo con password para verificar credenciales
    const userRaw = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!userRaw) {
      res.status(401).json({ success: false, error: 'Credenciales invalidas' });
      return;
    }

    if (userRaw.estado === 'baja') {
      res.status(403).json({ success: false, error: 'Usuario dado de baja. Contacte al administrador.' });
      return;
    }

    const validPassword = await bcrypt.compare(password, userRaw.password);
    if (!validPassword) {
      res.status(401).json({ success: false, error: 'Credenciales invalidas' });
      return;
    }

    const token = jwt.sign(
      { id: userRaw.id, email: userRaw.email, tipo: userRaw.tipo },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Segunda query para obtener el usuario completo con notificaciones
    const user = await prisma.user.findUnique({
      where: { id: userRaw.id },
      select: userSelect,
    });

    res.status(200).json({
      success: true,
      data: {
        token,
        user,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const logout = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({ success: true, message: 'Sesion cerrada correctamente' });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: userSelect,
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      return;
    }

    if (user.estado === 'baja') {
      res.status(403).json({ success: false, error: 'Usuario dado de baja. Contacte al administrador.' });
      return;
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    const { currentPassword, newPassword } = req.body as ChangePasswordInput;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'La password actual y la nueva son requeridas' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'La nueva password debe tener al menos 6 caracteres' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      return;
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      res.status(401).json({ success: false, error: 'Password actual incorrecta' });
      return;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword },
    });

    res.status(200).json({ success: true, message: 'Password actualizada correctamente' });
  } catch (error) {
    console.error('Error en changePassword:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};
