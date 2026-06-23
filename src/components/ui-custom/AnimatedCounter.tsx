import { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 1.5,
  className = '',
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  // FIX: antes, una vez animado, quedaba trabado para siempre con "hasAnimated.current = true",
  // así que si el valor real (ej: total de usuarios) llegaba DESPUÉS de la primera animación
  // (típico, porque la carga de datos es asíncrona y la tarjeta ya está visible en pantalla
  // con value=0 en el primer render), el contador nunca se actualizaba — quedaba pegado en 0
  // sin importar qué pasara después. Ahora cada cambio de "value" dispara una nueva animación
  // desde el valor actual mostrado hacia el nuevo valor.
  useEffect(() => {
    if (!isInView) return;

    const startValue = count;
    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(startValue + easeOutQuart * (endValue - startValue));
      setCount(currentValue);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };
    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- "count" es solo el punto de partida, no debe re-disparar el efecto
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}