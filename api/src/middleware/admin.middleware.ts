import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'No autenticado' });
    return;
  }

  if (req.user.tipo !== 'administrador') {
    res.status(403).json({ success: false, error: 'Acceso denegado. Se requieren permisos de administrador' });
    return;
  }

  next();
};
