import { motion } from 'framer-motion';
import { Users, Settings, FileText, HelpCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useContent } from '@/context/ContentContext';
import { toast } from 'sonner';

// FIX: cada item ahora declara cómo navegar — antes todos usaban <a href> plano,
// lo cual rompe con HashRouter: "/directorio" se interpreta como ruta real del dominio
// (404) y "#datos-personales" se interpreta como una ruta nueva del router (también rompe).
type AccessAction =
  | { kind: 'route'; to: string }       // navegación interna del router (react-router)
  | { kind: 'anchor'; id: string }      // scroll suave a un elemento de la misma página
  | { kind: 'external'; href: string }  // link externo real
  | { kind: 'soon' };                   // placeholder, todavía sin funcionalidad

const accessItems: Array<{
  icon: typeof Users;
  label: string;
  description: string;
  color: string;
  action: AccessAction;
}> = [
  { icon: Users,      label: 'Directorio de Profesionales', description: 'Ver colegas matriculados',         color: 'bg-sky-50 text-[#0284c7]',    action: { kind: 'route', to: '/directorio' } },
  { icon: FileText,   label: 'Tarifario',                   description: 'Consultar tarifas de referencia',  color: 'bg-emerald-50 text-emerald-600', action: { kind: 'external', href: 'https://cdgm.org.ar/tarifario-profesionales' } },
  { icon: HelpCircle, label: 'Ayuda y Soporte',              description: 'Preguntas frecuentes',             color: 'bg-amber-50 text-amber-600',  action: { kind: 'soon' } },
  { icon: Settings,   label: 'Configuración',                description: 'Gestionar tu cuenta',              color: 'bg-purple-50 text-purple-600', action: { kind: 'anchor', id: 'datos-personales' } },
];

export function QuickAccessCard() {
  const { dashboardContent } = useContent();
  const { cards } = dashboardContent;
  const navigate = useNavigate();

  const handleClick = (action: AccessAction, e: React.MouseEvent) => {
    e.preventDefault();
    switch (action.kind) {
      case 'route':
        navigate(action.to); // FIX: navegación real del router, funciona con HashRouter
        break;
      case 'anchor':
        document.getElementById(action.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); // FIX: scroll en lugar de cambiar la URL
        break;
      case 'external':
        window.open(action.href, '_blank', 'noopener,noreferrer');
        break;
      case 'soon':
        toast.info('Próximamente disponible');
        break;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{cards.accesoDirecto.title}</h3>
      </div>
      <div className="space-y-2">
        {accessItems.map((item, index) => (
          <motion.a
            key={item.label}
            href="#"
            onClick={(e) => handleClick(item.action, e)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            whileHover={{ x: 5, backgroundColor: '#F8FAFC' }}
            className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer group"
          >
            <div className={`p-2 rounded-lg ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-500">{item.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#0ea5e9] transition-colors" />
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
}