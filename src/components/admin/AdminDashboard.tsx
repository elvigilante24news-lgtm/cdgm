import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, DollarSign, Settings, Search, Plus, Bell, CheckCircle,
  TrendingUp, UserCheck, UserX, Ban, Power, Edit, FileEdit, Loader2, Trash2,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { AnimatedCounter } from '@/components/ui-custom/AnimatedCounter';
import { StatusBadge } from '@/components/ui-custom/StatusBadge';
import { municipiosMisiones } from '@/data/municipiosMisiones';
import { ContentEditor } from './ContentEditor';
import { UserEditDialog } from './UserEditDialog';
import type { User } from '@/types';

export function AdminDashboard() {
  const {
    getUsuariosMatriculados,
    configuracion, updateConfiguracion,
    crearUsuario,
    enviarNotificacion,
    enviarNotificacionMasiva, // FIX: usa el método masivo (1 request) en vez del loop N+1
    actualizarEstadoPago,
    actualizarEstadoUsuario,
    eliminarUsuario,
  } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen]     = useState(false);
  // FIX: nuevo — usuario seleccionado para eliminar + estado de carga del borrado
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting]     = useState(false);
  const [selectedUser, setSelectedUser]             = useState<User | null>(null);
  const [newUserData, setNewUserData] = useState({
    nombre: '', apellido: '', email: '', dni: '',
    ciudad: '', celular: '', domicilio: '', numeroMatricula: '', password: '',
  });

  // FIX: borrador local de la configuración — ya no se guarda en cada tecla,
  // solo al tocar "Guardar cambios" (antes cada input disparaba un PUT inmediato,
  // lo que causaba carreras entre requests y la sensación de que "no funcionaba")
  const [configDraft, setConfigDraft] = useState(configuracion);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    setConfigDraft(configuracion);
  }, [configuracion]);

  const configHasChanges =
    configDraft.precioMatricula      !== configuracion.precioMatricula ||
    configDraft.fechaInicioPago      !== configuracion.fechaInicioPago ||
    configDraft.fechaVencimientoPago !== configuracion.fechaVencimientoPago;

  const handleGuardarConfiguracion = async () => {
    setIsSavingConfig(true);
    try {
      await updateConfiguracion(configDraft);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // ── Finanzas: filtro de período ───────────────────────────────────────────
  const [periodoFinanzas, setPeriodoFinanzas] = useState('historico');
  const periodoConfig: Record<string, { label: string; factor: number }> = {
    '30d':       { label: 'Últimos 30 días',  factor: 0.15 },
    '90d':       { label: 'Últimos 90 días',  factor: 0.35 },
    'semestre':  { label: 'Último semestre',  factor: 0.6  },
    'anio':      { label: 'Último año',       factor: 0.9  },
    'historico': { label: 'Histórico',        factor: 1    },
  };

  // ── Notificación masiva ───────────────────────────────────────────────────
  const [notifTitulo, setNotifTitulo]   = useState('');
  const [notifMensaje, setNotifMensaje] = useState('');
  const [notifTipo, setNotifTipo]       = useState<'info' | 'warning' | 'success'>('info');
  const [enviandoMasiva, setEnviandoMasiva] = useState(false);
  // id del usuario cuyo recordatorio individual está en vuelo
  const [sendingBellId, setSendingBellId]   = useState<string | null>(null);

  const usuarios          = getUsuariosMatriculados();
  const usuariosFiltrados = usuarios.filter((u) =>
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.numeroMatricula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.ciudad.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const usuariosActivos  = usuarios.filter((u) => u.estado === 'activo');
  const usuariosDeudores = usuarios.filter((u) => u.estadoPago === 'deuda');
  const totalRecaudado   = usuarios.filter((u) => u.estadoPago === 'al_dia').length * configuracion.precioMatricula;
  const recaudadoPeriodo = Math.round(totalRecaudado * periodoConfig[periodoFinanzas].factor);

  const handleCreateUser = async () => {
    try {
      await crearUsuario({
        ...newUserData,
        tipo: 'matriculado',
        estado: 'activo',
        estadoPago: 'deuda',
        montoDeuda: configuracion.precioMatricula,
        fechaVencimiento: configuracion.fechaVencimientoPago,
      });
      setIsCreateDialogOpen(false);
      setNewUserData({
        nombre: '', apellido: '', email: '', dni: '',
        ciudad: '', celular: '', domicilio: '', numeroMatricula: '', password: '',
      });
    } catch (err: any) {
      // El toast de error ya se maneja en crearUsuario
    }
  };

  const handleEditUser = (usuario: User) => {
    setSelectedUser(usuario);
    setIsEditDialogOpen(true);
  };

  // FIX: nuevo — confirma y ejecuta la eliminación del usuario seleccionado
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const ok = await eliminarUsuario(userToDelete.id);
      if (ok) setUserToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEnviarNotificacion = async (userId: string, tipo: 'pago' | 'general') => {
    setSendingBellId(userId);
    try {
      if (tipo === 'pago') {
        await enviarNotificacion(userId, {
          titulo:  'Recordatorio de Pago',
          mensaje: `Tu matrícula venció. Por favor realizá el pago de $${configuracion.precioMatricula.toLocaleString('es-AR')}.`,
          tipo:    'warning',
          leida:   false,
        }, true); // FIX: true = también envía el email real con Resend, no solo la notificación interna
      } else {
        await enviarNotificacion(userId, {
          titulo:  'Notificación del Colegio',
          mensaje: 'Tenés un mensaje importante del Colegio de Diseñadores Gráficos.',
          tipo:    'info',
          leida:   false,
        });
      }
    } finally {
      setSendingBellId(null);
    }
  };

  // FIX: usa enviarNotificacionMasiva (1 request) en lugar de N requests con loop
  const handleEnviarNotificacionMasiva = async () => {
    const titulo  = notifTitulo.trim();
    const mensaje = notifMensaje.trim();
    if (!titulo || !mensaje || usuarios.length === 0) return;
    setEnviandoMasiva(true);
    try {
      await enviarNotificacionMasiva({ titulo, mensaje, tipo: notifTipo, leida: false });
      setNotifTitulo('');
      setNotifMensaje('');
      setNotifTipo('info');
    } finally {
      setEnviandoMasiva(false);
    }
  };

  const stats = [
    { label: 'Total Usuarios', value: usuarios.length,         icon: Users,     color: 'bg-sky-50 text-[#0284c7]' },
    { label: 'Activos',        value: usuariosActivos.length,  icon: UserCheck, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Deudores',       value: usuariosDeudores.length, icon: UserX,     color: 'bg-red-50 text-red-600' },
    { label: 'Recaudado',      value: totalRecaudado, prefix: '$', icon: DollarSign, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-100 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  <AnimatedCounter value={stat.value} prefix={stat.prefix} />
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="usuarios" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6 bg-sky-50">
          <TabsTrigger value="usuarios"      className="data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-white"><Users    className="w-4 h-4 mr-2" />Usuarios</TabsTrigger>
          <TabsTrigger value="configuracion" className="data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-white"><Settings  className="w-4 h-4 mr-2" />Configuración</TabsTrigger>
          <TabsTrigger value="finanzas"      className="data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-white"><TrendingUp className="w-4 h-4 mr-2" />Finanzas</TabsTrigger>
          <TabsTrigger value="contenido"     className="data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-white"><FileEdit   className="w-4 h-4 mr-2" />Contenido</TabsTrigger>
        </TabsList>

        {/* ── Usuarios ── */}
        <TabsContent value="usuarios" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, matrícula o ciudad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white">
                  <Plus className="w-4 h-4 mr-2" />Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Crear Nuevo Usuario Matriculado</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="space-y-2"><Label>Nombre</Label><Input value={newUserData.nombre} onChange={(e) => setNewUserData({ ...newUserData, nombre: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Apellido</Label><Input value={newUserData.apellido} onChange={(e) => setNewUserData({ ...newUserData, apellido: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={newUserData.email} onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })} /></div>
                  <div className="space-y-2"><Label>DNI</Label><Input value={newUserData.dni} onChange={(e) => setNewUserData({ ...newUserData, dni: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Matrícula</Label><Input value={newUserData.numeroMatricula} onChange={(e) => setNewUserData({ ...newUserData, numeroMatricula: e.target.value })} placeholder="DG-XXX" /></div>
                  <div className="space-y-2">
                    <Label>Ciudad</Label>
                    <Select value={newUserData.ciudad} onValueChange={(value) => setNewUserData({ ...newUserData, ciudad: value })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {municipiosMisiones.map((m) => (<SelectItem key={m.id} value={m.nombre}>{m.nombre}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Celular</Label><Input value={newUserData.celular} onChange={(e) => setNewUserData({ ...newUserData, celular: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Domicilio</Label><Input value={newUserData.domicilio} onChange={(e) => setNewUserData({ ...newUserData, domicilio: e.target.value })} /></div>
                  <div className="space-y-2 md:col-span-2"><Label>Contraseña temporal</Label><Input type="password" value={newUserData.password} onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })} /></div>
                </div>
                <Button onClick={handleCreateUser} className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white">
                  Crear Usuario y Enviar Email de Bienvenida
                </Button>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-white rounded-2xl shadow-lg shadow-gray-100 border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuariosFiltrados.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">{usuario.nombre} {usuario.apellido}</TableCell>
                    <TableCell>{usuario.numeroMatricula}</TableCell>
                    <TableCell>{usuario.ciudad}</TableCell>
                    <TableCell><StatusBadge status={usuario.estado} /></TableCell>
                    <TableCell><StatusBadge status={usuario.estadoPago} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditUser(usuario)} title="Editar datos">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {usuario.estadoPago === 'deuda' && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => actualizarEstadoPago(usuario.id, 'al_dia')} title="Marcar como pagado">
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEnviarNotificacion(usuario.id, 'pago')}
                              disabled={sendingBellId === usuario.id}
                              title="Enviar recordatorio de pago"
                            >
                              {sendingBellId === usuario.id
                                ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                                : <Bell className="w-4 h-4 text-amber-500" />
                              }
                            </Button>
                          </>
                        )}
                        {usuario.estado === 'activo' && (
                          <Button variant="ghost" size="sm" onClick={() => actualizarEstadoUsuario(usuario.id, 'suspendido')} title="Suspender usuario">
                            <Ban className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                        {usuario.estado === 'suspendido' && (
                          <Button variant="ghost" size="sm" onClick={() => actualizarEstadoUsuario(usuario.id, 'activo')} title="Activar usuario">
                            <Power className="w-4 h-4 text-emerald-500" />
                          </Button>
                        )}
                        {/* FIX: nuevo — eliminar usuario, con confirmación antes de ejecutar */}
                        <Button variant="ghost" size="sm" onClick={() => setUserToDelete(usuario)} title="Eliminar usuario">
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Configuración ── */}
        <TabsContent value="configuracion" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-100 border border-gray-100">
            <h3 className="text-lg font-semibold mb-1">Configuración del Sistema</h3>
            <p className="text-sm text-gray-500 mb-4">
              Estos valores aplican a todos los matriculados. Si un usuario no paga después de la fecha de vencimiento, su cuenta pasa automáticamente a "En deuda".
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Precio Matrícula ($)</Label>
                <Input
                  type="number"
                  value={configDraft.precioMatricula}
                  onChange={(e) => setConfigDraft({ ...configDraft, precioMatricula: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Inicio Pago</Label>
                <Input
                  type="date"
                  value={configDraft.fechaInicioPago}
                  onChange={(e) => setConfigDraft({ ...configDraft, fechaInicioPago: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Vencimiento</Label>
                <Input
                  type="date"
                  value={configDraft.fechaVencimientoPago}
                  onChange={(e) => setConfigDraft({ ...configDraft, fechaVencimientoPago: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                onClick={handleGuardarConfiguracion}
                disabled={!configHasChanges || isSavingConfig}
                className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white disabled:opacity-60"
              >
                {isSavingConfig ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isSavingConfig ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </motion.div>

          {/* Notificación masiva — FIX: usa 1 request al backend */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-100 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-5 h-5 text-[#0284c7]" />
              <h3 className="text-lg font-semibold">Enviar Notificación a Todos</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Llegará al panel de notificaciones de todos los usuarios matriculados de forma inmediata.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  placeholder="Ej: Asamblea anual del Colegio"
                  value={notifTitulo}
                  onChange={(e) => setNotifTitulo(e.target.value)}
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label>Mensaje</Label>
                <Textarea
                  placeholder="Escribí el contenido de la notificación..."
                  value={notifMensaje}
                  onChange={(e) => setNotifMensaje(e.target.value)}
                  rows={5}
                  maxLength={1000}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={notifTipo} onValueChange={(v) => setNotifTipo(v as 'info' | 'warning' | 'success')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Informativa</SelectItem>
                      <SelectItem value="success">Éxito / Buena noticia</SelectItem>
                      <SelectItem value="warning">Importante / Advertencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Destinatarios</Label>
                  <div className="h-10 flex items-center px-3 rounded-md border border-input bg-gray-50 text-sm text-gray-700">
                    {usuarios.length} usuario{usuarios.length === 1 ? '' : 's'} matriculado{usuarios.length === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleEnviarNotificacionMasiva}
                  disabled={!notifTitulo.trim() || !notifMensaje.trim() || usuarios.length === 0 || enviandoMasiva}
                  className="bg-[#0284c7] hover:bg-[#0369a1] text-white disabled:opacity-60"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  {enviandoMasiva ? 'Enviando...' : 'Enviar a todos'}
                </Button>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* ── Finanzas ── */}
        <TabsContent value="finanzas" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-100 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold">Resumen Financiero</h3>
              <Select value={periodoFinanzas} onValueChange={setPeriodoFinanzas}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(periodoConfig).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-emerald-50 rounded-xl">
                <p className="text-emerald-600 text-sm">Recaudado ({periodoConfig[periodoFinanzas].label})</p>
                <p className="text-2xl font-bold text-emerald-700">${recaudadoPeriodo.toLocaleString('es-AR')}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl">
                <p className="text-red-600 text-sm">Pendiente de cobro</p>
                <p className="text-2xl font-bold text-red-700">
                  ${(usuariosDeudores.length * configuracion.precioMatricula).toLocaleString('es-AR')}
                </p>
              </div>
              <div className="p-4 bg-sky-50 rounded-xl">
                <p className="text-[#0284c7] text-sm">% al día</p>
                <p className="text-2xl font-bold text-[#0284c7]">
                  {usuarios.length > 0
                    ? Math.round((usuariosActivos.filter(u => u.estadoPago === 'al_dia').length / usuarios.length) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* ── Contenido ── */}
        <TabsContent value="contenido">
          <ContentEditor />
        </TabsContent>
      </Tabs>

      <UserEditDialog
        usuario={selectedUser}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
      />

      {/* FIX: nuevo — confirmación antes de eliminar, ya que la acción es irreversible */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => { if (!open) setUserToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar a {userToDelete?.nombre} {userToDelete?.apellido}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente al usuario, su matrícula
              ({userToDelete?.numeroMatricula || 'sin asignar'}) y todas sus notificaciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isDeleting ? 'Eliminando...' : 'Eliminar definitivamente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}