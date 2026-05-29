import { Router } from 'express';
import { login, logout, getMe, changePassword } from '../controllers/auth.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', verifyToken, getMe);
router.put('/change-password', verifyToken, changePassword);

export default router;
