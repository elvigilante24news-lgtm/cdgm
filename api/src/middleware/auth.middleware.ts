import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';
import { UserTipo } from '@prisma/client';

interface JwtPayload {
  id: string;
  email: string;
  tipo: UserTipo;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Token no proporcionado' });
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      res.status(401).json({ success: false, error: 'Token no valido' });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ success: false, error: 'JWT_SECRET no configurado' });
      return;
    }

    const decoded = jwt.verify(token, secret, { clockTolerance: 60 }) as JwtPayload;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      tipo: decoded.tipo,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: 'Token expirado' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, error: 'Token invalido' });
      return;
    }
    res.status(500).json({ success: false, error: 'Error al verificar token' });
    return;
  }
};
