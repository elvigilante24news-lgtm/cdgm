import { Router } from 'express';
import {
  obtenerContenido,
  actualizarHomeContent,
  actualizarDashboardContent,
  actualizarContenidoCompleto,
} from '../controllers/contenido.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// GET /api/contenido - Obtener contenido web (publico)
router.get('/', obtenerContenido);

// PUT /api/contenido - Actualizar home_content y/o dashboard_content juntos (solo admin)
// FIX: ruta que el frontend realmente usa — antes no existía y daba 404
router.put('/', verifyToken, requireAdmin, actualizarContenidoCompleto);

// PUT /api/contenido/home - Actualizar homeContent (solo admin)
router.put('/home', verifyToken, requireAdmin, actualizarHomeContent);

// PUT /api/contenido/dashboard - Actualizar dashboardContent (solo admin)
router.put('/dashboard', verifyToken, requireAdmin, actualizarDashboardContent);

export default router;