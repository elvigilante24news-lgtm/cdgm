import { Router } from 'express';
import {
  listarUsuarios,
  obtenerUsuario,
  crearUsuario,
  actualizarUsuario,
  actualizarEstado,
  actualizarPago,
  actualizarFoto,
} from '../controllers/usuarios.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// GET /api/usuarios - Listar todos (solo admin)
router.get('/', verifyToken, requireAdmin, listarUsuarios);

// GET /api/usuarios/:id - Obtener un usuario por ID
router.get('/:id', verifyToken, obtenerUsuario);

// POST /api/usuarios - Crear nuevo usuario (solo admin)
router.post('/', verifyToken, requireAdmin, crearUsuario);

// PUT /api/usuarios/:id - Actualizar datos de usuario
router.put('/:id', verifyToken, actualizarUsuario);

// PUT /api/usuarios/:id/estado - Cambiar estado (solo admin)
router.put('/:id/estado', verifyToken, requireAdmin, actualizarEstado);

// PUT /api/usuarios/:id/pago - Actualizar estado de pago (solo admin)
router.put('/:id/pago', verifyToken, requireAdmin, actualizarPago);

// PUT /api/usuarios/:id/foto - Subir foto de perfil
router.put('/:id/foto', verifyToken, actualizarFoto);

export default router;
