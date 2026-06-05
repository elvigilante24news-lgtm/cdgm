import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, AlertCircle, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui-custom/StatusBadge';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface PaymentCardProps {
  user: User;
}

export function PaymentCard({ user }: PaymentCardProps) {
  const { iniciarPagoMercadoPago, configuracion } = useAuth();
  const [isPaying, setIsPaying] = useState(false);

  const handlePago = async () => {
    setIsPaying(true);
    try {
      // FIX: llama al endpoint de MercadoPago en lugar del endpoint admin-only
      // iniciarPagoMercadoPago redirige a MP Checkout Pro
      await iniciarPagoMercadoPago();
    } finally {
      // Si MP no redirigió (error), volvemos a habilitar el botón
      setIsPaying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`rounded-3xl p-6 shadow-lg border ${
        user.estadoPago === 'deuda'
          ? 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200 shadow-red-200/50'
          : 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 shadow-emerald-200/50'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Estado de Pago</h3>
        <div className={`p-2 rounded-xl ${user.estadoPago === 'deuda' ? 'bg-red-100' : 'bg-emerald-100'}`}>
          <CreditCard className={`w-6 h-6 ${user.estadoPago === 'deuda' ? 'text-red-500' : 'text-emerald-500'}`} />
        </div>
      </div>

      <div className="mb-4">
        <StatusBadge status={user.estadoPago} />
      </div>

      {user.estadoPago === 'deuda' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 font-semibold text-lg">
              ${user.montoDeuda?.toLocaleString('es-AR')}
            </span>
          </div>
          <p className="text-red-600 text-sm mb-4">
            Tenés una deuda pendiente de matrícula. Realizá el pago para mantener tus
            servicios activos y aparecer en el directorio de matriculados.
          </p>
          {user.fechaVencimiento && (
            <p className="text-red-500 text-xs mb-4">
              Vencimiento:{' '}
              {new Date(user.fechaVencimiento + 'T00:00:00').toLocaleDateString('es-AR')}
            </p>
          )}

          <Button
            onClick={handlePago}
            disabled={isPaying}
            className="w-full bg-red-500 hover:bg-red-600 text-white disabled:opacity-70"
          >
            {isPaying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redirigiendo a MercadoPago...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Pagar con MercadoPago
              </>
            )}
          </Button>

          <p className="text-gray-400 text-xs text-center mt-2">
            Serás redirigido a MercadoPago para completar el pago de forma segura.
          </p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="text-emerald-700 font-medium">Matrícula al día ✓</span>
          </div>
          <p className="text-emerald-600 text-sm mb-4">
            Tu matrícula se encuentra activa. Tu tarjeta aparece en el directorio de
            matriculados y podés ser contactado por potenciales clientes.
          </p>
          {user.fechaUltimoPago && (
            <p className="text-emerald-500 text-xs">
              Último pago:{' '}
              {new Date(user.fechaUltimoPago + 'T00:00:00').toLocaleDateString('es-AR')}
            </p>
          )}
          {user.fechaVencimiento && (
            <p className="text-emerald-500 text-xs mt-1">
              Próximo vencimiento:{' '}
              {new Date(user.fechaVencimiento + 'T00:00:00').toLocaleDateString('es-AR')}
            </p>
          )}
        </motion.div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200/50">
        <p className="text-gray-500 text-xs">
          Monto anual: ${configuracion.precioMatricula.toLocaleString('es-AR')}
        </p>
      </div>
    </motion.div>
  );
}
