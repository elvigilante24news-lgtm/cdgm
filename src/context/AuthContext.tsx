import React, { createContext, useContext, useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import type { Notificacion } from "@/types";

// Extended user type that matches both mock and API data
export interface AuthUser {
  id: number;
  email: string;
  tipo: "matriculado" | "administrador";
  nombre: string;
  apellido: string;
  dni: string;
  ciudad: string;
  celular: string;
  domicilio: string;
  estudio?: string | null;
  redes?: {
    instagram?: string | null | undefined;
    facebook?: string | null | undefined;
    paginaWeb?: string | null | undefined;
    linkedin?: string | null | undefined;
    behance?: string | null | undefined;
  };
  fotoPerfil?: string | null;
  numeroMatricula?: string | null;
  estado: "activo" | "suspendido" | "baja";
  estadoPago: "al_dia" | "deuda";
  montoDeuda?: number | null;
  fechaVencimiento?: string | null;
  fechaUltimoPago?: string | null;
  notificaciones: Notificacion[];
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  updateUser: (userData: Partial<AuthUser>) => void;
  updatePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<boolean>;
  marcarNotificacionLeida: (notificacionId: string) => void;
  enviarNotificacion: (
    userId: string,
    notificacion: Omit<Notificacion, "id" | "fecha">
  ) => void;
  crearUsuario: (
    userData: Omit<AuthUser, "id" | "notificaciones"> & { password: string }
  ) => Promise<AuthUser>;
  actualizarEstadoPago: (
    userId: string,
    estado: "al_dia" | "deuda",
    montoDeuda?: number
  ) => void;
  actualizarEstadoUsuario: (
    userId: string,
    estado: "activo" | "suspendido" | "baja"
  ) => void;
  configuracion: {
    precioMatricula: number;
    fechaInicioPago: string;
    fechaVencimientoPago: string;
  };
  updateConfiguracion: (
    config: Partial<{
      precioMatricula: number;
      fechaInicioPago: string;
      fechaVencimientoPago: string;
    }>
  ) => void;
  getUsuariosMatriculados: () => AuthUser[];
  getUsuariosAlDia: () => AuthUser[];
  updateFotoPerfil: (fotoUrl: string) => void;
  updateUsuarioAdmin: (userId: string, userData: Partial<AuthUser>) => void;
  updateFotoPerfilAdmin: (userId: string, fotoUrl: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const utils = trpc.useUtils();
  const loginMutation = trpc.matriculadoAuth.login.useMutation();
  const updateMatriculadoMutation = trpc.matriculado.update.useMutation();
  const createMatriculadoMutation = trpc.matriculado.create.useMutation();
  const updatePasswordMutation = trpc.matriculado.updatePassword.useMutation();
  const updateEstadoMutation = trpc.matriculado.updateEstado.useMutation();
  const updateEstadoPagoMutation = trpc.matriculado.updateEstadoPago.useMutation();
  const createNotificationMutation = trpc.notification.create.useMutation();
  const markAsReadMutation = trpc.notification.markAsRead.useMutation();

  const { data: configData } = trpc.config.getAllObject.useQuery();

  const [configuracion, setConfiguracion] = useState({
    precioMatricula: 15000,
    fechaInicioPago: "2024-01-01",
    fechaVencimientoPago: "2024-03-31",
  });

  // Load config from API
  useEffect(() => {
    if (configData) {
      setConfiguracion({
        precioMatricula: Number(configData.precioMatricula) || 15000,
        fechaInicioPago: configData.fechaInicioPago || "2024-01-01",
        fechaVencimientoPago: configData.fechaVencimientoPago || "2024-03-31",
      });
    }
  }, [configData]);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("cdg_user");
    const storedToken = localStorage.getItem("cdg_token");
    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({ ...parsed, notificaciones: parsed.notificaciones || [] });
      } catch {
        localStorage.removeItem("cdg_user");
        localStorage.removeItem("cdg_token");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await loginMutation.mutateAsync({ email, password });
      if (result && result.user) {
        const userWithNotifs = { ...result.user, notificaciones: [] };
        setUser(userWithNotifs);
        localStorage.setItem("cdg_user", JSON.stringify(userWithNotifs));
        localStorage.setItem("cdg_token", result.token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("cdg_user");
    localStorage.removeItem("cdg_token");
  };

  const updateUser = (userData: Partial<AuthUser>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("cdg_user", JSON.stringify(updatedUser));
      // Sync to API
      updateMatriculadoMutation.mutate({
        id: user.id,
        data: {
          nombre: userData.nombre,
          apellido: userData.apellido,
          dni: userData.dni,
          ciudad: userData.ciudad,
          celular: userData.celular,
          email: userData.email,
          domicilio: userData.domicilio,
          estudio: userData.estudio ?? undefined,
          instagram: userData.redes?.instagram ?? undefined,
          facebook: userData.redes?.facebook ?? undefined,
          paginaWeb: userData.redes?.paginaWeb ?? undefined,
          linkedin: userData.redes?.linkedin ?? undefined,
          behance: userData.redes?.behance ?? undefined,
        },
      });
    }
  };

  const updatePassword = async (
    _currentPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    if (user) {
      try {
        await updatePasswordMutation.mutateAsync({
          id: user.id,
          newPassword,
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  const marcarNotificacionLeida = (notificacionId: string) => {
    if (user) {
      const updatedNotificaciones = user.notificaciones.map((n) =>
        n.id === notificacionId ? { ...n, leida: true } : n
      );
      setUser({ ...user, notificaciones: updatedNotificaciones });
      markAsReadMutation.mutate({ id: Number(notificacionId) });
    }
  };

  const enviarNotificacion = (
    userId: string,
    notificacion: Omit<Notificacion, "id" | "fecha">
  ) => {
    const newNotificacion: Notificacion = {
      ...notificacion,
      id: Date.now().toString(),
      fecha: new Date().toISOString().split("T")[0],
    };
    if (user && user.id.toString() === userId) {
      setUser({
        ...user,
        notificaciones: [newNotificacion, ...user.notificaciones],
      });
    }
    createNotificationMutation.mutate({
      matriculadoId: Number(userId),
      titulo: notificacion.titulo,
      mensaje: notificacion.mensaje,
      tipo: notificacion.tipo,
    });
  };

  const crearUsuario = async (
    userData: Omit<AuthUser, "id" | "notificaciones"> & { password: string }
  ): Promise<AuthUser> => {
    const result = await createMatriculadoMutation.mutateAsync({
      email: userData.email,
      password: userData.password,
      nombre: userData.nombre,
      apellido: userData.apellido,
      dni: userData.dni,
      ciudad: userData.ciudad,
      celular: userData.celular,
      domicilio: userData.domicilio,
      numeroMatricula: userData.numeroMatricula || undefined,
    });

    const newUser: AuthUser = {
      id: result?.id || Date.now(),
      email: userData.email,
      tipo: "matriculado",
      nombre: userData.nombre,
      apellido: userData.apellido,
      dni: userData.dni,
      ciudad: userData.ciudad,
      celular: userData.celular,
      domicilio: userData.domicilio,
      estudio: userData.estudio,
      numeroMatricula: userData.numeroMatricula,
      estado: "activo",
      estadoPago: "deuda",
      montoDeuda: configuracion.precioMatricula,
      fechaVencimiento: configuracion.fechaVencimientoPago,
      notificaciones: [
        {
          id: "welcome",
          titulo: "Bienvenida al Colegio",
          mensaje:
            "Tu cuenta ha sido creada exitosamente. Bienvenido al sistema de matriculas.",
          fecha: new Date().toISOString().split("T")[0],
          leida: false,
          tipo: "success",
        },
      ],
    };

    utils.matriculado.list.invalidate();
    return newUser;
  };

  const actualizarEstadoUsuario = (
    userId: string,
    estado: "activo" | "suspendido" | "baja"
  ) => {
    updateEstadoMutation.mutate({ id: Number(userId), estado });
    if (user && user.id.toString() === userId) {
      setUser({ ...user, estado });
    }
    utils.matriculado.list.invalidate();
  };

  const actualizarEstadoPago = (
    userId: string,
    estado: "al_dia" | "deuda",
    montoDeuda?: number
  ) => {
    updateEstadoPagoMutation.mutate({
      id: Number(userId),
      estadoPago: estado,
      montoDeuda,
    });
    if (user && user.id.toString() === userId) {
      setUser({
        ...user,
        estadoPago: estado,
        montoDeuda: estado === "deuda" ? montoDeuda : null,
        fechaUltimoPago:
          estado === "al_dia"
            ? new Date().toISOString().split("T")[0]
            : user.fechaUltimoPago,
      });
    }
    utils.matriculado.list.invalidate();
  };

  const updateFotoPerfil = (fotoUrl: string) => {
    if (user) {
      const updated = { ...user, fotoPerfil: fotoUrl };
      setUser(updated);
      localStorage.setItem("cdg_user", JSON.stringify(updated));
      updateMatriculadoMutation.mutate({
        id: user.id,
        data: { fotoPerfil: fotoUrl },
      });
    }
  };

  const updateUsuarioAdmin = (userId: string, userData: Partial<AuthUser>) => {
    updateMatriculadoMutation.mutate({
      id: Number(userId),
      data: {
        nombre: userData.nombre,
        apellido: userData.apellido,
        email: userData.email,
        dni: userData.dni,
        ciudad: userData.ciudad,
        celular: userData.celular,
        domicilio: userData.domicilio,
        estudio: userData.estudio ?? undefined,
        numeroMatricula: userData.numeroMatricula ?? undefined,
        instagram: userData.redes?.instagram ?? undefined,
        facebook: userData.redes?.facebook ?? undefined,
        paginaWeb: userData.redes?.paginaWeb ?? undefined,
        linkedin: userData.redes?.linkedin ?? undefined,
        behance: userData.redes?.behance ?? undefined,
      },
    });
    if (user && user.id.toString() === userId) {
      const updated = { ...user, ...userData };
      setUser(updated);
      localStorage.setItem("cdg_user", JSON.stringify(updated));
    }
    utils.matriculado.list.invalidate();
  };

  const updateFotoPerfilAdmin = (userId: string, fotoUrl: string) => {
    updateUsuarioAdmin(userId, { fotoPerfil: fotoUrl });
  };

  const updateConfiguracion = (
    config: Partial<{
      precioMatricula: number;
      fechaInicioPago: string;
      fechaVencimientoPago: string;
    }>
  ) => {
    setConfiguracion((prev) => ({ ...prev, ...config }));
    // Sync to API
    if (config.precioMatricula !== undefined) {
      trpc.config.set.useMutation().mutate({
        key: "precioMatricula",
        value: String(config.precioMatricula),
      });
    }
    if (config.fechaInicioPago !== undefined) {
      trpc.config.set.useMutation().mutate({
        key: "fechaInicioPago",
        value: config.fechaInicioPago,
      });
    }
    if (config.fechaVencimientoPago !== undefined) {
      trpc.config.set.useMutation().mutate({
        key: "fechaVencimientoPago",
        value: config.fechaVencimientoPago,
      });
    }
  };

  // Fetch all matriculados from API
  const { data: allMatriculadosData } = trpc.matriculado.list.useQuery();

  const getUsuariosMatriculados = () => {
    if (allMatriculadosData) {
      return allMatriculadosData
        .filter((m) => m.tipo === "matriculado")
        .map(
          (m): AuthUser => ({
            id: m.id,
            email: m.email,
            tipo: m.tipo as "matriculado" | "administrador",
            nombre: m.nombre,
            apellido: m.apellido,
            dni: m.dni,
            ciudad: m.ciudad,
            celular: m.celular,
            domicilio: m.domicilio,
            estudio: m.estudio,
            fotoPerfil: m.fotoPerfil,
            numeroMatricula: m.numeroMatricula,
            estado: m.estado as "activo" | "suspendido" | "baja",
            estadoPago: m.estadoPago as "al_dia" | "deuda",
            montoDeuda: m.montoDeuda,
            fechaVencimiento: m.fechaVencimiento,
            fechaUltimoPago: m.fechaUltimoPago,
            redes: {
              instagram: m.instagram,
              facebook: m.facebook,
              paginaWeb: m.paginaWeb,
              linkedin: m.linkedin,
              behance: m.behance,
            },
            notificaciones: [],
          })
        );
    }
    return [];
  };

  const getUsuariosAlDia = () => {
    return getUsuariosMatriculados().filter(
      (u) => u.tipo === "matriculado" && u.estadoPago === "al_dia"
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        updateUser,
        updatePassword,
        marcarNotificacionLeida,
        enviarNotificacion,
        crearUsuario,
        actualizarEstadoPago,
        actualizarEstadoUsuario,
        configuracion,
        updateConfiguracion,
        getUsuariosMatriculados,
        getUsuariosAlDia,
        updateFotoPerfil,
        updateUsuarioAdmin,
        updateFotoPerfilAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
