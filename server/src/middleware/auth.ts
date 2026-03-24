import { Request, Response, NextFunction } from 'express';
import firebaseApp from '../config/firebase';

export interface AuthRequest extends Request {
  uid?: string;
  email?: string;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = header.split('Bearer ')[1];
  try {
    const decoded = await firebaseApp.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.email = decoded.email;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
