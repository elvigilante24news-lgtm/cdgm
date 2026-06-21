import { Request } from 'express';
import { UserTipo, UserEstado, EstadoPago } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    tipo: UserTipo;
  };
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface CreateUsuarioInput {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  dni: string;
  ciudad: string;
  celular: string;
  domicilio: string;
  estudio?: string;
  numero_matricula?: string;
  instagram?: string;
  facebook?: string;
  pagina_web?: string;
  linkedin?: string;
  behance?: string;
}

export interface UpdateUsuarioInput {
  nombre?: string;
  apellido?: string;
  ciudad?: string;
  celular?: string;
  domicilio?: string;
  estudio?: string | null;
  numero_matricula?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  pagina_web?: string | null;
  linkedin?: string | null;
  behance?: string | null;
}

export interface UpdateEstadoInput {
  estado: UserEstado;
}

export interface UpdatePagoInput {
  estadoPago: EstadoPago;
  montoDeuda?: number;
}

export interface UpdateFotoInput {
  fotoBase64: string;
}

export interface CreateNotificacionInput {
  userId: string;
  titulo: string;
  mensaje: string;
  tipo?: 'info' | 'warning' | 'success' | 'error';
  enviarEmail?: boolean; // FIX: si es true, además del registro interno se envía el email real (Resend)
}

export interface UpdateConfiguracionInput {
  precioMatricula?: number;
  fechaInicioPago?: string;
  fechaVencimientoPago?: string;
}

export interface DirectorioQueryParams {
  nombre?: string;
  matricula?: string;
  ciudad?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}