import { Router } from 'express';
import { obtenerConfiguracion, actualizarConfiguracion } from '../controllers/configuracion.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// GET /api/configuracion - Obtener configuracion (cualquier usuario autenticado)
router.get('/', verifyToken, obtenerConfiguracion);

// PUT /api/configuracion - Actualizar configuracion (solo admin)
router.put('/', verifyToken, requireAdmin, actualizarConfiguracion);

export default router;
