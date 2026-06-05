import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.routes';
import usuariosRoutes from './routes/usuarios.routes';
import notificacionesRoutes from './routes/notificaciones.routes';
import directorioRoutes from './routes/directorio.routes';
import configuracionRoutes from './routes/configuracion.routes';
import contenidoRoutes from './routes/contenido.routes';
import pagosRoutes from './routes/pagos.routes'; // FIX: nueva ruta de pagos

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// ============================================
// CORS
// ============================================
const allowedOrigins = [
  'http://localhost:5173',
  'https://c2851498.ferozo.com',
  'http://c2851498.ferozo.com',
];

if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('No permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ============================================
// Middleware
// ============================================
app.use(express.json({ limit: '6mb' }));
app.use(express.urlencoded({ extended: true, limit: '6mb' }));

// ============================================
// Health Check
// ============================================
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API CDGM funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================
// API Routes
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/directorio', directorioRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/contenido', contenidoRoutes);
app.use('/api/pagos', pagosRoutes); // FIX: MercadoPago

// ============================================
// Root
// ============================================
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API REST — Colegio de Diseñadores Gráficos de Misiones (CDGM)',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      usuarios: '/api/usuarios',
      notificaciones: '/api/notificaciones',
      directorio: '/api/directorio',
      configuracion: '/api/configuracion',
      contenido: '/api/contenido',
      pagos: '/api/pagos',
    },
  });
});

// ============================================
// Error Handlers
// ============================================
app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err.message === 'No permitido por CORS') {
    res.status(403).json({ success: false, error: 'Origen no permitido por CORS' });
    return;
  }
  next(err);
});

app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ success: false, error: 'JSON malformado en el body' });
    return;
  }
  next(err);
});

app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err.message && err.message.includes('payload too large')) {
    res.status(413).json({ success: false, error: 'Payload demasiado grande. Máximo: 5MB' });
    return;
  }
  next(err);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((_req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({ success: false, error: 'Endpoint no encontrado' });
});

// ============================================
// Start
// ============================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ============================================
   Servidor CDGM iniciado
   Puerto: ${PORT}
   Entorno: ${process.env.NODE_ENV || 'development'}
   CORS: ${allowedOrigins.join(', ')}
  ============================================
  `);
});
