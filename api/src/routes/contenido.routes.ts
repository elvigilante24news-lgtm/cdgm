import { Router } from 'express';
import {
  obtenerContenido,
  actualizarHomeContent,
  actualizarDashboardContent,
} from '../controllers/contenido.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// GET /api/contenido - Obtener contenido web (publico)
router.get('/', obtenerContenido);

// PUT /api/contenido/home - Actualizar homeContent (solo admin)
router.put('/home', verifyToken, requireAdmin, actualizarHomeContent);

// PUT /api/contenido/dashboard - Actualizar dashboardContent (solo admin)
router.put('/dashboard', verifyToken, requireAdmin, actualizarDashboardContent);

export default router;
