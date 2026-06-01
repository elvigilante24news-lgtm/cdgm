import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Notificacion, ConfiguracionSistema } from '@/types';
import {
  authApi, usersApi, configApi,
  mapUser, mapConfig, mapUserToAPI,
} from '@/lib/api';
import { toast } from 'sonner';

const defaultConfig: ConfiguracionSistema = {
  precioMatricula: 15000,
  fechaInicioPago: '2025-01-01',
  fechaVencimientoPago: '2025-03-31',
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  updateUser: (userData: Partial<User>) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  marcarNotificacionLeida: (notificacionId: string) => void;
  enviarNotificacion: (userId: string, notificacion: Omit<Notificacion, 'id' | 'fecha'>) => void;
  crearUsuario: (userData: Omit<User, 'id' | 'notificaciones'> & { password: string }) => Promise<User>;
  actualizarEstadoPago: (userId: string, estado: 'al_dia' | 'deuda', montoDeuda?: number) => void;
  actualizarEstadoUsuario: (userId: string, estado: 'activo' | 'suspendido' | 'baja') => void;
  configuracion: ConfiguracionSistema;
  updateConfiguracion: (config: Partial<ConfiguracionSistema>) => void;
  getUsuariosMatriculados: () => User[];
  getUsuariosAlDia: () => User[];
  updateFotoPerfil: (fotoUrl: string) => void;
  updateUsuarioAdmin: (userId: string, userData: Partial<User>) => void;
  updateFotoPerfilAdmin: (userId: string, fotoUrl: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [configuracion, setConfiguracion] = useState<ConfiguracionSistema>(defaultConfig);

  // ── Load admin data (users + config) ────────────────────────────────────────
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

  // ── Restore session from localStorage on mount ───────────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem('cdg_token');
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
        // /auth/me failed — try to use stored user as fallback
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

  // ── Auth ─────────────────────────────────────────────────────────────────────
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

  // ── User updates ─────────────────────────────────────────────────────────────
  const updateUser = async (userData: Partial<User>) => {
    if (!user || !token) return;
    try {
      const raw = await usersApi.update(token, user.id, mapUserToAPI(userData));
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

  // ── Notificaciones ───────────────────────────────────────────────────────────
  const marcarNotificacionLeida = async (notificacionId: string) => {
    if (!user || !token) return;
    // Optimistic update
    const optimistic = {
      ...user,
      notificaciones: user.notificaciones.map(n =>
        n.id === notificacionId ? { ...n, leida: true } : n
      ),
    };
    setUser(optimistic);
    localStorage.setItem('cdg_user', JSON.stringify(optimistic));
    // Fire and forget API call
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
      toast.success('Notificación enviada');
      // Refresh users
      const raw = await usersApi.getAll(token);
      setUsuarios(raw.map(mapUser));
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar notificación');
    }
  };

  // ── Admin: create user ───────────────────────────────────────────────────────
  const crearUsuario = async (
    userData: Omit<User, 'id' | 'notificaciones'> & { password: string }
  ): Promise<User> => {
    if (!token) throw new Error('No autenticado');
    const apiData = {
      nombre: userData.nombre,
      apellido: userData.apellido,
      email: userData.email,
      password: userData.password,
      dni: userData.dni,
      ciudad: userData.ciudad,
      celular: userData.celular,
      domicilio: userData.domicilio,
      numero_matricula: userData.numeroMatricula,
      estudio: userData.estudio,
      tipo: 'matriculado',
      estado: 'activo',
      estado_pago: 'deuda',
      monto_deuda: configuracion.precioMatricula,
      fecha_vencimiento: configuracion.fechaVencimientoPago,
    };
    const raw = await usersApi.create(token, apiData);
    const newUser = mapUser(raw);
    setUsuarios(prev => [...prev, newUser]);
    toast.success('Usuario creado. Se envió un email de bienvenida.');
    return newUser;
  };

  // ── Admin: estado / pago ─────────────────────────────────────────────────────
  const actualizarEstadoUsuario = async (
    userId: string,
    estado: 'activo' | 'suspendido' | 'baja'
  ) => {
    if (!token) return;
    try {
      await usersApi.updateEstado(token, userId, estado);
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, estado } : u));
      toast.success(
        estado === 'activo' ? 'Usuario activado' : 'Usuario suspendido'
      );
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar estado');
    }
  };

  const actualizarEstadoPago = async (
    userId: string,
    estado: 'al_dia' | 'deuda',
    montoDeuda?: number
  ) => {
    if (!token) return;
    try {
      await usersApi.updatePago(token, userId, {
        estado_pago: estado,
        monto_deuda: estado === 'deuda' ? montoDeuda : undefined,
      });
      setUsuarios(prev =>
        prev.map(u =>
          u.id === userId
            ? {
                ...u,
                estadoPago: estado,
                montoDeuda: estado === 'deuda' ? montoDeuda : undefined,
                fechaUltimoPago:
                  estado === 'al_dia'
                    ? new Date().toISOString().split('T')[0]
                    : u.fechaUltimoPago,
              }
            : u
        )
      );
      toast.success(estado === 'al_dia' ? 'Pago registrado' : 'Deuda registrada');
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar pago');
    }
  };

  // ── Admin: edit user ─────────────────────────────────────────────────────────
  const updateUsuarioAdmin = async (userId: string, userData: Partial<User>) => {
    if (!token) return;
    try {
      const raw = await usersApi.update(token, userId, mapUserToAPI(userData));
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

  // ── Config ───────────────────────────────────────────────────────────────────
  const updateConfiguracion = async (config: Partial<ConfiguracionSistema>) => {
    if (!token) return;
    const apiData: Record<string, any> = {};
    if (config.precioMatricula !== undefined) apiData.precio_matricula = config.precioMatricula;
    if (config.fechaInicioPago !== undefined) apiData.fecha_inicio_pago = config.fechaInicioPago;
    if (config.fechaVencimientoPago !== undefined) apiData.fecha_vencimiento_pago = config.fechaVencimientoPago;
    // Optimistic update
    setConfiguracion(prev => ({ ...prev, ...config }));
    try {
      await configApi.update(token, apiData);
      toast.success('Configuración guardada');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar configuración');
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getUsuariosMatriculados = () => usuarios.filter(u => u.tipo === 'matriculado');
  const getUsuariosAlDia = () =>
    usuarios.filter(u => u.tipo === 'matriculado' && u.estadoPago === 'al_dia');

  return (
    <AuthContext.Provider
      value={{
        user, token, login, logout, isLoading,
        updateUser, updatePassword,
        marcarNotificacionLeida, enviarNotificacion,
        crearUsuario,
        actualizarEstadoPago, actualizarEstadoUsuario,
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
