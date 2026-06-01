import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Mail, Phone, Instagram, Facebook, Linkedin, Globe, Palette, Shield, X, Building2, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { directorioApi, mapUser } from '@/lib/api';
import { municipiosMisiones } from '@/data/municipiosMisiones';
import type { User } from '@/types';

export default function DirectorioPage() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchName, setSearchName] = useState('');
  const [searchMatricula, setSearchMatricula] = useState('');
  const [searchCiudad, setSearchCiudad] = useState('');

  useEffect(() => {
    directorioApi.get()
      .then(raw => setUsuarios(raw.map(mapUser)))
      .catch(err => setError(err.message || 'No se pudo cargar el directorio'))
      .finally(() => setIsLoading(false));
  }, []);

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const matchName = `${u.nombre} ${u.apellido}`.toLowerCase().includes(searchName.toLowerCase());
      const matchMatricula = u.numeroMatricula?.toLowerCase().includes(searchMatricula.toLowerCase()) ?? true;
      const matchCiudad = !searchCiudad || searchCiudad === 'todas' || u.ciudad === searchCiudad;
      return matchName && matchMatricula && matchCiudad;
    });
  }, [usuarios, searchName, searchMatricula, searchCiudad]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F5FF] to-white">
      <motion.header initial={{ y: -100 }} animate={{ y: 0 }} className="bg-white/80 backdrop-blur-xl shadow-lg shadow-sky-100/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500 rounded-xl"><Shield className="w-5 h-5 text-white" /></div>
            <span className="font-semibold text-emerald-700 text-sm">Seguro</span>
          </div>
          <Link to="/"><Button variant="outline" className="border-[#0ea5e9] text-[#0ea5e9]">Volver al Inicio</Button></Link>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Directorio de <span className="text-[#0ea5e9]">Profesionales</span></h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Encontrá diseñadores gráficos matriculados en la provincia de Misiones.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-100 border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Buscar por nombre..." value={searchName} onChange={(e) => setSearchName(e.target.value)} className="pl-10" /></div>
            <div className="relative"><Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="N° de matrícula..." value={searchMatricula} onChange={(e) => setSearchMatricula(e.target.value)} className="pl-10" /></div>
            <Select value={searchCiudad} onValueChange={setSearchCiudad}>
              <SelectTrigger><MapPin className="w-4 h-4 mr-2 text-gray-400" /><SelectValue placeholder="Todas las ciudades" /></SelectTrigger>
              <SelectContent className="max-h-60"><SelectItem value="todas">Todas las ciudades</SelectItem>{municipiosMisiones.map((m) => (<SelectItem key={m.id} value={m.nombre}>{m.nombre}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-gray-500 text-sm">
              {isLoading ? 'Cargando...' : <>Mostrando <span className="font-medium text-gray-900">{usuariosFiltrados.length}</span> profesionales</>}
            </p>
            {(searchName || searchMatricula || searchCiudad) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearchName(''); setSearchMatricula(''); setSearchCiudad(''); }}>
                <X className="w-4 h-4 mr-1" />Limpiar
              </Button>
            )}
          </div>
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-[#0ea5e9] animate-spin" />
            <p className="text-gray-500">Cargando directorio...</p>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-gray-600 font-medium">No se pudo cargar el directorio</p>
            <p className="text-gray-400 text-sm">{error}</p>
            <Button onClick={() => { setError(null); setIsLoading(true); directorioApi.get().then(r => setUsuarios(r.map(mapUser))).catch(e => setError(e.message)).finally(() => setIsLoading(false)); }} variant="outline" className="border-[#0ea5e9] text-[#0ea5e9]">
              Reintentar
            </Button>
          </div>
        )}

        {/* Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {usuariosFiltrados.map((usuario, index) => (
              <motion.div key={usuario.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -5 }} className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-100 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden flex-shrink-0">
                    {usuario.fotoPerfil ? <img src={usuario.fotoPerfil} alt="" className="w-full h-full object-cover" /> : <span>{usuario.nombre[0]}{usuario.apellido[0]}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900">{usuario.nombre} {usuario.apellido}</h3>
                    {usuario.estudio && <p className="text-[#0284c7] font-medium text-sm flex items-center gap-1"><Building2 className="w-3 h-3 flex-shrink-0" /><span className="truncate">{usuario.estudio}</span></p>}
                    <p className="text-[#0ea5e9] font-medium text-sm">{usuario.numeroMatricula}</p>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mt-1"><MapPin className="w-3 h-3 flex-shrink-0" />{usuario.ciudad}</div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-600 text-sm"><Mail className="w-4 h-4 text-gray-400 flex-shrink-0" /><a href={`mailto:${usuario.email}`} className="hover:text-[#0ea5e9] truncate">{usuario.email}</a></div>
                  <div className="flex items-center gap-2 text-gray-600 text-sm"><Phone className="w-4 h-4 text-gray-400 flex-shrink-0" /><a href={`tel:${usuario.celular}`} className="hover:text-[#0ea5e9]">{usuario.celular}</a></div>
                </div>
                {usuario.redes && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                    {usuario.redes.instagram && <a href={`https://instagram.com/${usuario.redes.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100"><Instagram className="w-4 h-4" /></a>}
                    {usuario.redes.facebook && <a href={`https://facebook.com/${usuario.redes.facebook}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-sky-50 text-[#0284c7] rounded-lg hover:bg-sky-100"><Facebook className="w-4 h-4" /></a>}
                    {usuario.redes.linkedin && <a href={`https://linkedin.com/in/${usuario.redes.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-sky-50 text-blue-700 rounded-lg hover:bg-sky-100"><Linkedin className="w-4 h-4" /></a>}
                    {usuario.redes.behance && <a href={`https://behance.net/${usuario.redes.behance}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-sky-50 text-blue-500 rounded-lg hover:bg-sky-100"><Palette className="w-4 h-4" /></a>}
                    {usuario.redes.paginaWeb && <a href={`https://${usuario.redes.paginaWeb.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><Globe className="w-4 h-4" /></a>}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && !error && usuariosFiltrados.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No se encontraron profesionales</h3>
            <p className="text-gray-500 text-sm">Intentá con otros filtros</p>
          </div>
        )}
      </main>

      <footer className="bg-gray-900 text-white py-8 px-6 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500 text-sm">© 2026 Colegio de Diseñadores Gráficos de Misiones. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
