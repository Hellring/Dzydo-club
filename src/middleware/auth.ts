import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.header('Authorization');
  if (!auth) return res.status(401).json({ error: 'missing authorization' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'invalid authorization header' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'secret') as any;
    req.user = { id: payload.sub, role: payload.role } as any;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid or expired token' });
  }
}

export function authorizeRoles(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'unauthenticated' });
    if (roles.length === 0) return next();
    if (!roles.includes(user.role)) return res.status(403).json({ error: 'forbidden' });
    return next();
  };
}
