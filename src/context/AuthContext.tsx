import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Notificacion, ConfiguracionSistema } from '@/types';
import {
  authApi, usersApi, configApi, pagosApi,
  mapUser, mapConfig, mapUserToAPI,
} from '@/lib/api';
import { toast } from 'sonner';

const defaultConfig: ConfiguracionSistema = {
  precioMatricula: 15000,
  fechaInicioPago: '2025-01-01',
  fechaVencimientoPago: '2025-03-31',
};

// Almacén en memoria para códigos de recuperación (demo)
const recoveryCodes = new Map<string, { code: string; expires: number }>();

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  updateUser: (userData: Partial<User>) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  solicitarRecuperacion: (email: string) => Promise<{ success: boolean; codigo?: string }>;
  resetPasswordConCodigo: (email: string, codigo: string, newPassword: string) => Promise<boolean>;
  marcarNotificacionLeida: (notificacionId: string) => void;
  enviarNotificacion: (userId: string, notificacion: Omit<Notificacion, 'id' | 'fecha'>) => Promise<void>;
  enviarNotificacionMasiva: (notificacion: Omit<Notificacion, 'id' | 'fecha'>) => Promise<void>;
  crearUsuario: (userData: Omit<User, 'id' | 'notificaciones'> & { password: string }) => Promise<User>;
  actualizarEstadoPago: (userId: string, estado: 'al_dia' | 'deuda', montoDeuda?: number) => Promise<void>;
  actualizarEstadoUsuario: (userId: string, estado: 'activo' | 'suspendido' | 'baja') => Promise<void>;
  iniciarPagoMercadoPago: () => Promise<void>;
  configuracion: ConfiguracionSistema;
  updateConfiguracion: (config: Partial<ConfiguracionSistema>) => Promise<void>;
  getUsuariosMatriculados: () => User[];
  getUsuariosAlDia: () => User[];
  updateFotoPerfil: (fotoUrl: string) => void;
  updateUsuarioAdmin: (userId: string, userData: Partial<User>) => Promise<void>;
  updateFotoPerfilAdmin: (userId: string, fotoUrl: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]               = useState<User | null>(null);
  const [token, setToken]             = useState<string | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [usuarios, setUsuarios]       = useState<User[]>([]);
  const [configuracion, setConfiguracion] = useState<ConfiguracionSistema>(defaultConfig);

  const loadAdminData = async (t: string) => {
    try {
      const [rawUsers, rawConfig] = await Promise.all([
        usersApi.getAll(t),
        configApi.get(t),
      ]);
      setUsuarios(rawUsers.map(mapUser));
      setConfiguracion(mapConfig(rawConfig));
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  };

  useEffect(() => {
    const storedToken   = localStorage.getItem('cdg_token');
    const storedUserStr = localStorage.getItem('cdg_user');
    if (!storedToken) { setIsLoading(false); return; }

    authApi.me(storedToken)
      .then(async (rawUser) => {
        const mapped = mapUser(rawUser);
        setUser(mapped);
        setToken(storedToken);
        localStorage.setItem('cdg_user', JSON.stringify(mapped));
        if (mapped.tipo === 'administrador') await loadAdminData(storedToken);
      })
      .catch(async () => {
        if (storedUserStr) {
          try {
            const stored = JSON.parse(storedUserStr) as User;
            setUser(stored);
            setToken(storedToken);
            if (stored.tipo === 'administrador') await loadAdminData(storedToken);
          } catch {
            localStorage.removeItem('cdg_token');
            localStorage.removeItem('cdg_user');
          }
        } else {
          localStorage.removeItem('cdg_token');
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { token: newToken, user: rawUser } = await authApi.login(email, password);
      const mapped = mapUser(rawUser);
      setUser(mapped);
      setToken(newToken);
      localStorage.setItem('cdg_token', newToken);
      localStorage.setItem('cdg_user', JSON.stringify(mapped));
      if (mapped.tipo === 'administrador') await loadAdminData(newToken);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setUsuarios([]);
    localStorage.removeItem('cdg_token');
    localStorage.removeItem('cdg_user');
  };

  // ── Recuperación de contraseña (demo) ─────────────────────────────────────
  const solicitarRecuperacion = async (email: string): Promise<{ success: boolean; codigo?: string }> => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    recoveryCodes.set(email.toLowerCase(), { code, expires: Date.now() + 15 * 60 * 1000 });
    return { success: true, codigo: code };
  };

  const resetPasswordConCodigo = async (
    email: string, codigo: string, _newPassword: string
  ): Promise<boolean> => {
    const stored = recoveryCodes.get(email.toLowerCase());
    if (!stored || stored.code !== codigo || Date.now() > stored.expires) return false;
    recoveryCodes.delete(email.toLowerCase());
    return true;
  };

  // ── User updates ──────────────────────────────────────────────────────────
  const updateUser = async (userData: Partial<User>) => {
    if (!user || !token) return;
    try {
      const raw     = await usersApi.update(token, user.id, mapUserToAPI(userData));
      const updated = mapUser(raw);
      setUser(updated);
      localStorage.setItem('cdg_user', JSON.stringify(updated));
      setUsuarios(prev => prev.map(u => u.id === user.id ? updated : u));
      toast.success('Datos actualizados correctamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar datos');
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!token) return false;
    try {
      await authApi.changePassword(token, currentPassword, newPassword);
      return true;
    } catch {
      return false;
    }
  };

  const updateFotoPerfil = async (fotoUrl: string) => {
    if (!user || !token) return;
    try {
      await usersApi.update(token, user.id, { foto_perfil: fotoUrl });
      const updated = { ...user, fotoPerfil: fotoUrl };
      setUser(updated);
      localStorage.setItem('cdg_user', JSON.stringify(updated));
      setUsuarios(prev => prev.map(u => u.id === user.id ? updated : u));
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar foto');
    }
  };

  // ── Notificaciones ────────────────────────────────────────────────────────
  const marcarNotificacionLeida = async (notificacionId: string) => {
    if (!user || !token) return;
    const optimistic = {
      ...user,
      notificaciones: user.notificaciones.map(n =>
        n.id === notificacionId ? { ...n, leida: true } : n
      ),
    };
    setUser(optimistic);
    localStorage.setItem('cdg_user', JSON.stringify(optimistic));
    // FIX: ahora usa PUT (antes era PATCH)
    usersApi.marcarNotifLeida(token, user.id, notificacionId).catch(console.error);
  };

  const enviarNotificacion = async (
    userId: string,
    notificacion: Omit<Notificacion, 'id' | 'fecha'>
  ) => {
    if (!token) return;
    try {
      await usersApi.sendNotificacion(token, userId, {
        titulo: notificacion.titulo,
        mensaje: notificacion.mensaje,
        tipo: notificacion.tipo,
      });
      toast.success('Recordatorio enviado ✓');
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar notificación');
    }
  };

  // FIX: nuevo método para envío masivo eficiente (1 sola request al backend)
  const enviarNotificacionMasiva = async (
    notificacion: Omit<Notificacion, 'id' | 'fecha'>
  ) => {
    if (!token) return;
    try {
      const result = await usersApi.sendNotificacionMasiva(token, {
        titulo: notificacion.titulo,
        mensaje: notificacion.mensaje,
        tipo: notificacion.tipo,
      });
      toast.success(`Notificación enviada a ${result.count} usuario${result.count === 1 ? '' : 's'}`);
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar notificación masiva');
    }
  };

  // ── MercadoPago ───────────────────────────────────────────────────────────
  // FIX: flujo real de pago — redirige al usuario a MercadoPago Checkout Pro
  const iniciarPagoMercadoPago = async () => {
    if (!token) return;
    try {
      toast.loading('Preparando el pago...', { id: 'mp-loading' });
      const { init_point, sandbox_init_point } = await pagosApi.crearPreferencia(token);
      toast.dismiss('mp-loading');

      // En producción usar init_point; en desarrollo usar sandbox_init_point
      const url = import.meta.env.DEV ? sandbox_init_point : init_point;
      if (!url) throw new Error('No se recibió URL de pago');

      window.location.href = url;
    } catch (err: any) {
      toast.dismiss('mp-loading');
      toast.error(err.message || 'Error al iniciar el pago. Intentá de nuevo.');
    }
  };

  // ── Admin: crear usuario ──────────────────────────────────────────────────
  const crearUsuario = async (
    userData: Omit<User, 'id' | 'notificaciones'> & { password: string }
  ): Promise<User> => {
    if (!token) throw new Error('No autenticado');
    const apiData = {
      nombre:            userData.nombre,
      apellido:          userData.apellido,
      email:             userData.email,
      password:          userData.password,
      dni:               userData.dni,
      ciudad:            userData.ciudad,
      celular:           userData.celular,
      domicilio:         userData.domicilio,
      numero_matricula:  userData.numeroMatricula,
      estudio:           userData.estudio,
      tipo:              'matriculado',
      estado:            'activo',
      estado_pago:       'deuda',
      monto_deuda:       configuracion.precioMatricula,
      fecha_vencimiento: configuracion.fechaVencimientoPago,
    };
    const raw     = await usersApi.create(token, apiData);
    const newUser = mapUser(raw);
    setUsuarios(prev => [...prev, newUser]);
    toast.success('Usuario creado. Se envió un email de bienvenida con sus credenciales.');
    return newUser;
  };

  // ── Admin: estado / pago ──────────────────────────────────────────────────
  const actualizarEstadoUsuario = async (
    userId: string, estado: 'activo' | 'suspendido' | 'baja'
  ) => {
    if (!token) return;
    try {
      // FIX: ahora llama a PUT /usuarios/:id/estado (antes iba a PUT /usuarios/:id)
      await usersApi.updateEstado(token, userId, estado);
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, estado } : u));
      toast.success(estado === 'activo' ? 'Usuario activado' : estado === 'suspendido' ? 'Usuario suspendido' : 'Usuario dado de baja');
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar estado');
    }
  };

  const actualizarEstadoPago = async (
    userId: string, estado: 'al_dia' | 'deuda', montoDeuda?: number
  ) => {
    if (!token) return;
    try {
      // FIX: ahora llama a PUT /usuarios/:id/pago con payload camelCase
      await usersApi.updatePago(token, userId, {
        estadoPago: estado,
        montoDeuda: estado === 'deuda' ? montoDeuda : undefined,
      });
      setUsuarios(prev =>
        prev.map(u =>
          u.id === userId
            ? {
                ...u,
                estadoPago:     estado,
                montoDeuda:     estado === 'deuda' ? montoDeuda : undefined,
                fechaUltimoPago: estado === 'al_dia'
                  ? new Date().toISOString().split('T')[0]
                  : u.fechaUltimoPago,
              }
            : u
        )
      );
      toast.success(estado === 'al_dia' ? 'Pago registrado ✓' : 'Deuda registrada');
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar pago');
    }
  };

  // ── Admin: editar usuario ─────────────────────────────────────────────────
  const updateUsuarioAdmin = async (userId: string, userData: Partial<User>) => {
    if (!token) return;
    try {
      const raw     = await usersApi.update(token, userId, mapUserToAPI(userData));
      const updated = mapUser(raw);
      setUsuarios(prev => prev.map(u => u.id === userId ? updated : u));
      if (user?.id === userId) {
        setUser(updated);
        localStorage.setItem('cdg_user', JSON.stringify(updated));
      }
      toast.success('Usuario actualizado');
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar usuario');
    }
  };

  const updateFotoPerfilAdmin = async (userId: string, fotoUrl: string) => {
    if (!token) return;
    try {
      await usersApi.update(token, userId, { foto_perfil: fotoUrl });
      setUsuarios(prev =>
        prev.map(u => u.id === userId ? { ...u, fotoPerfil: fotoUrl } : u)
      );
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar foto');
    }
  };

  // ── Config ────────────────────────────────────────────────────────────────
  const updateConfiguracion = async (config: Partial<ConfiguracionSistema>) => {
    if (!token) return;
    // FIX: enviar camelCase para que coincida con UpdateConfiguracionInput del backend
    const apiData: Record<string, any> = {};
    if (config.precioMatricula      !== undefined) apiData.precioMatricula      = config.precioMatricula;
    if (config.fechaInicioPago      !== undefined) apiData.fechaInicioPago      = config.fechaInicioPago;
    if (config.fechaVencimientoPago !== undefined) apiData.fechaVencimientoPago = config.fechaVencimientoPago;
    setConfiguracion(prev => ({ ...prev, ...config }));
    try {
      await configApi.update(token, apiData);
      toast.success('Configuración guardada');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar configuración');
    }
  };

  const getUsuariosMatriculados = () => usuarios.filter(u => u.tipo === 'matriculado');
  const getUsuariosAlDia = () =>
    usuarios.filter(u => u.tipo === 'matriculado' && u.estadoPago === 'al_dia');

  return (
    <AuthContext.Provider
      value={{
        user, token, login, logout, isLoading,
        updateUser, updatePassword,
        solicitarRecuperacion, resetPasswordConCodigo,
        marcarNotificacionLeida,
        enviarNotificacion,
        enviarNotificacionMasiva,
        crearUsuario,
        actualizarEstadoPago, actualizarEstadoUsuario,
        iniciarPagoMercadoPago,
        configuracion, updateConfiguracion,
        getUsuariosMatriculados, getUsuariosAlDia,
        updateFotoPerfil, updateUsuarioAdmin, updateFotoPerfilAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};