import { Router } from 'express';
import {
  listarNotificaciones,
  marcarComoLeida,
  crearNotificacion,
} from '../controllers/notificaciones.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// GET /api/notificaciones - Listar notificaciones del usuario autenticado
router.get('/', verifyToken, listarNotificaciones);

// PUT /api/notificaciones/:id/leer - Marcar como leida
router.put('/:id/leer', verifyToken, marcarComoLeida);

// POST /api/notificaciones - Crear notificacion para un usuario (solo admin)
router.post('/', verifyToken, requireAdmin, crearNotificacion);

export default router;
