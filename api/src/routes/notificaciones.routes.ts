import { Router } from 'express';
import {
  listarNotificaciones,
  marcarComoLeida,
  crearNotificacion,
  crearNotificacionMasiva,
} from '../controllers/notificaciones.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// GET /api/notificaciones — Listar notificaciones del usuario autenticado
router.get('/', verifyToken, listarNotificaciones);

// PUT  /api/notificaciones/:id/leer — Marcar como leída
router.put('/:id/leer', verifyToken, marcarComoLeida);

// FIX: alias PATCH para compatibilidad con el frontend (api.ts usa PATCH)
router.patch('/:id/leer', verifyToken, marcarComoLeida);

// POST /api/notificaciones — Crear notificación para un usuario (solo admin)
router.post('/', verifyToken, requireAdmin, crearNotificacion);

// POST /api/notificaciones/masiva — Envío masivo a todos los matriculados (solo admin)
// IMPORTANTE: este route debe ir ANTES de /:id para que no lo capture
router.post('/masiva', verifyToken, requireAdmin, crearNotificacionMasiva);

export default router;
