import { Router } from 'express';
import { login, logout, getMe, changePassword, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', verifyToken, getMe);
router.put('/change-password', verifyToken, changePassword);
router.post('/forgot-password', forgotPassword); // FIX: paso 1 — enviar código
router.post('/reset-password', resetPassword);   // FIX: paso 2 — validar código y cambiar password

export default router;