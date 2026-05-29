import { Router } from 'express';
import { listarDirectorio } from '../controllers/directorio.controller';

const router = Router();

// GET /api/directorio - Listar matriculados activos y al dia (publico)
router.get('/', listarDirectorio);

export default router;
