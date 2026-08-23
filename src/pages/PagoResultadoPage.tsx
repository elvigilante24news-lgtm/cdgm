import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

type ResultadoType = 'exitoso' | 'fallido' | 'pendiente';

const contenido: Record<ResultadoType, {
  icon: typeof CheckCircle;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  titulo: string;
  descripcion: string;
  extra: string;
  btnLabel: string;
}> = {
  exitoso: {
    icon: CheckCircle,
    iconColor: 'text-emerald-500',
    bgColor: 'from-emerald-50 to-emerald-100/40',
    borderColor: 'border-emerald-200',
    titulo: '¡Pago realizado exitosamente!',
    descripcion: 'Tu pago fue procesado. Tu matrícula se está actualizando...',
    extra: 'Tu tarjeta aparecerá en el directorio de matriculados en unos instantes.',
    btnLabel: 'Ir al panel',
  },
  fallido: {
    icon: XCircle,
    iconColor: 'text-red-500',
    bgColor: 'from-red-50 to-red-100/40',
    borderColor: 'border-red-200',
    titulo: 'El pago no pudo procesarse',
    descripcion: 'Hubo un problema con el pago. Podés intentarlo nuevamente desde tu panel de usuario.',
    extra: 'Si el problema persiste, contactá al administrador del CDGM.',
    btnLabel: 'Volver al panel',
  },
  pendiente: {
    icon: Clock,
    iconColor: 'text-amber-500',
    bgColor: 'from-amber-50 to-amber-100/40',
    borderColor: 'border-amber-200',
    titulo: 'Pago en proceso',
    descripcion: 'Tu pago está siendo verificado. Recibirás una notificación cuando se confirme.',
    extra: 'No realices otro pago hasta que este sea confirmado o rechazado.',
    btnLabel: 'Ir al panel',
  },
};

export default function PagoResultadoPage() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { refreshUser } = useAuth();
  const [seconds, setSeconds]       = useState(10);
  const refreshCount = useRef(0);

  const pathParts = location.pathname.split('/');
  const resultado = (pathParts[pathParts.length - 1] as ResultadoType) || 'fallido';
  const config    = contenido[resultado] ?? contenido.fallido;
  const Icon      = config.icon;

  // Si el pago fue exitoso, intentar refrescar el usuario cada 2s (max 4 intentos)
  // para que cuando llegue al dashboard ya vea el estado actualizado
  useEffect(() => {
    if (resultado !== 'exitoso') return;

    const tryRefresh = async () => {
      if (refreshCount.current >= 4) return;
      refreshCount.current += 1;
      await refreshUser();
    };

    // Primer intento inmediato, luego cada 2s
    tryRefresh();
    const interval = setInterval(tryRefresh, 2000);
    return () => clearInterval(interval);
  }, [resultado]);

  // Countdown y redirección al dashboard
  useEffect(() => {
    if (seconds <= 0) {
      navigate('/dashboard', { replace: true });
      return;
    }
    const timer = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`bg-gradient-to-br ${config.bgColor} border ${config.borderColor} rounded-3xl p-8 shadow-xl max-w-md w-full text-center`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6 flex justify-center"
        >
          <Icon className={`w-20 h-20 ${config.iconColor}`} />
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-800 mb-3">{config.titulo}</h1>
        <p className="text-gray-600 mb-4 leading-relaxed">{config.descripcion}</p>
        <p className="text-gray-500 text-sm mb-8 italic">{config.extra}</p>

        <Button
          onClick={() => navigate('/dashboard', { replace: true })}
          className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-xl py-3 mb-4"
        >
          {config.btnLabel}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <p className="text-gray-400 text-xs">
          Redirigiendo automáticamente en{' '}
          <span className="font-semibold text-gray-500">{seconds}</span>{' '}
          segundo{seconds === 1 ? '' : 's'}...
        </p>
      </motion.div>
    </div>
  );
}