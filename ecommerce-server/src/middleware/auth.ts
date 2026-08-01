import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
  };
}

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      name: string;
      role: 'user' | 'admin';
    };

    const user = await User.findByPk(decoded.id);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if ((user as any).isActive === false) {
      res.status(403).json({ error: 'Account disabled' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const token = req.cookies?.token;

  if (!token) {
    next();
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      name: string;
      role: 'user' | 'admin';
    };
    req.user = decoded;
  } catch {
    // Token invalid, but that's okay for optional auth
  }

  next();
}

export function generateToken(user: User): string {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    secret,
    { expiresIn } as any
  );
}
