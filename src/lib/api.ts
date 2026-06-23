import type { User, Notificacion, ConfiguracionSistema } from '@/types';

const API_BASE = (import.meta.env.VITE_API_URL ?? 'https://cdgm-production.up.railway.app') + '/api';

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;

  const json = await res.json();

  if (json && typeof json === 'object' && !Array.isArray(json) && 'success' in json) {
    if ('data' in json)          return json.data as T;
    if ('usuario' in json)       return json.usuario as T;
    if ('usuarios' in json)      return json.usuarios as T;
    if ('token' in json)         return json as T;
    if ('configuracion' in json) return json.configuracion as T;
    if ('contenido' in json)     return json.contenido as T;
    if ('notificacion' in json)  return json.notificacion as T;
    if ('directorio' in json)    return json.directorio as T;
    return json as T;
  }

  return json as T;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

export function mapUser(raw: any): User {
  return {
    id: raw.id,
    email: raw.email,
    password: '',
    tipo: raw.tipo,
    nombre: raw.nombre,
    apellido: raw.apellido,
    dni: raw.dni,
    ciudad: raw.ciudad,
    celular: raw.celular,
    domicilio: raw.domicilio,
    estudio: raw.estudio ?? undefined,
    fotoPerfil: raw.foto_perfil ?? undefined,
    numeroMatricula: raw.numero_matricula ?? undefined,
    estado: raw.estado,
    estadoPago: raw.estado_pago,
    montoDeuda: raw.monto_deuda ?? undefined,
    fechaVencimiento: raw.fecha_vencimiento ?? undefined,
    fechaUltimoPago: raw.fecha_ultimo_pago ?? undefined,
    redes:
      raw.instagram || raw.facebook || raw.pagina_web || raw.linkedin || raw.behance
        ? {
            instagram:  raw.instagram  || undefined,
            facebook:   raw.facebook   || undefined,
            paginaWeb:  raw.pagina_web || undefined,
            linkedin:   raw.linkedin   || undefined,
            behance:    raw.behance    || undefined,
          }
        : undefined,
    notificaciones: (raw.notificaciones || []).map(
      (n: any): Notificacion => ({
        id: n.id,
        titulo: n.titulo,
        mensaje: n.mensaje,
        fecha:
          typeof n.fecha === 'string'
            ? n.fecha.split('T')[0]
            : new Date(n.fecha).toISOString().split('T')[0],
        leida: n.leida,
        tipo: n.tipo,
      })
    ),
  };
}

export function mapConfig(raw: any): ConfiguracionSistema {
  return {
    precioMatricula:      raw.precio_matricula,
    fechaInicioPago:      raw.fecha_inicio_pago,
    fechaVencimientoPago: raw.fecha_vencimiento_pago,
  };
}

export function mapUserToAPI(userData: Partial<User>): Record<string, any> {
  const r: Record<string, any> = {};
  if (userData.nombre        !== undefined) r.nombre         = userData.nombre;
  if (userData.apellido      !== undefined) r.apellido       = userData.apellido;
  if (userData.email         !== undefined) r.email          = userData.email;
  if (userData.dni           !== undefined) r.dni            = userData.dni;
  if (userData.ciudad        !== undefined) r.ciudad         = userData.ciudad;
  if (userData.celular       !== undefined) r.celular        = userData.celular;
  if (userData.domicilio     !== undefined) r.domicilio      = userData.domicilio;
  if (userData.estudio       !== undefined) r.estudio        = userData.estudio;
  if (userData.fotoPerfil    !== undefined) r.foto_perfil    = userData.fotoPerfil;
  if (userData.numeroMatricula !== undefined) r.numero_matricula = userData.numeroMatricula;
  if (userData.redes !== undefined) {
    r.instagram  = userData.redes.instagram  || null;
    r.facebook   = userData.redes.facebook   || null;
    r.pagina_web = userData.redes.paginaWeb  || null;
    r.linkedin   = userData.redes.linkedin   || null;
    r.behance    = userData.redes.behance    || null;
  }
  return r;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: (token: string) =>
    request<any>('/auth/me', { method: 'GET' }, token),

  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    request<void>(
      '/auth/change-password',
      { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) },
      token
    ),

  // FIX: recuperación de contraseña real — antes era 100% simulada en el navegador
  forgotPassword: (email: string) =>
    request<void>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email: string, codigo: string, newPassword: string) =>
    request<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, codigo, newPassword }),
    }),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: (token: string) =>
    request<any[]>('/usuarios', { method: 'GET' }, token),

  create: (token: string, data: Record<string, any>) =>
    request<any>('/usuarios', { method: 'POST', body: JSON.stringify(data) }, token),

  update: (token: string, id: string, data: Record<string, any>) =>
    request<any>(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),

  // FIX: ruta correcta PUT /usuarios/:id/estado
  updateEstado: (token: string, id: string, estado: string) =>
    request<any>(
      `/usuarios/${id}/estado`,
      { method: 'PUT', body: JSON.stringify({ estado }) },
      token
    ),

  // FIX: ruta correcta PUT /usuarios/:id/pago + payload camelCase
  updatePago: (token: string, id: string, data: { estadoPago: string; montoDeuda?: number }) =>
    request<any>(
      `/usuarios/${id}/pago`,
      { method: 'PUT', body: JSON.stringify(data) },
      token
    ),

  // FIX: la foto tiene su propio endpoint — el PUT general /usuarios/:id ignora foto_perfil
  updateFoto: (token: string, id: string, fotoBase64: string) =>
    request<any>(
      `/usuarios/${id}/foto`,
      { method: 'PUT', body: JSON.stringify({ fotoBase64 }) },
      token
    ),

  sendNotificacion: (token: string, id: string, data: { titulo: string; mensaje: string; tipo: string; enviarEmail?: boolean }) =>
    request<any>(
      '/notificaciones',
      { method: 'POST', body: JSON.stringify({ userId: id, ...data }) },
      token
    ),

  // FIX: endpoint masivo (1 sola request para todos los usuarios)
  sendNotificacionMasiva: (token: string, data: { titulo: string; mensaje: string; tipo: string }) =>
    request<{ count: number }>(
      '/notificaciones/masiva',
      { method: 'POST', body: JSON.stringify(data) },
      token
    ),

  // FIX: usar PUT (no PATCH) como está definido en el backend
  marcarNotifLeida: (token: string, _userId: string, notifId: string) =>
    request<any>(
      `/notificaciones/${notifId}/leer`,
      { method: 'PUT' },
      token
    ),
};

// ─── Config ───────────────────────────────────────────────────────────────────
export const configApi = {
  get: (token: string) => request<any>('/configuracion', { method: 'GET' }, token),

  // FIX: enviar camelCase para que coincida con UpdateConfiguracionInput del backend
  update: (
    token: string,
    data: { precioMatricula?: number; fechaInicioPago?: string; fechaVencimientoPago?: string }
  ) => request<any>('/configuracion', { method: 'PUT', body: JSON.stringify(data) }, token),
};

// ─── Pagos (MercadoPago) ──────────────────────────────────────────────────────
export const pagosApi = {
  crearPreferencia: (token: string) =>
    request<{ init_point: string; sandbox_init_point: string; preference_id: string }>(
      '/pagos/preferencia',
      { method: 'POST' },
      token
    ),
};

// ─── Contenido ────────────────────────────────────────────────────────────────
export const contenidoApi = {
  get: () =>
    request<{ home_content: any; dashboard_content: any }>('/contenido', { method: 'GET' }),

  update: (token: string, data: { home_content?: any; dashboard_content?: any }) =>
    request<any>('/contenido', { method: 'PUT', body: JSON.stringify(data) }, token),
};

// ─── Directorio (público) ─────────────────────────────────────────────────────
export const directorioApi = {
  get: () => request<any[]>('/directorio', { method: 'GET' }),
};