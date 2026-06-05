import { Router } from 'express';
import { crearPreferencia, procesarWebhook } from '../controllers/pagos.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// POST /api/pagos/preferencia — Crear preferencia MercadoPago (usuario autenticado)
router.post('/preferencia', verifyToken, crearPreferencia);

// POST /api/pagos/webhook — Recibir notificación de pago de MercadoPago (público)
// MP llama a esta ruta desde sus servidores, sin token
router.post('/webhook', procesarWebhook);

export default router;
