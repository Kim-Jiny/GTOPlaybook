import { Request, Response, NextFunction } from 'express';
import firebaseApp from '../config/firebase';
import pool from '../config/db';

export interface AuthRequest extends Request {
  uid?: string;
  email?: string;
  isAdmin?: boolean;
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
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.uid],
    );
    if (result.rows.length === 0 || !result.rows[0].is_admin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    req.isAdmin = true;
    next();
  } catch (error) {
    console.error('Admin verification failed:', error);
    res.status(500).json({ error: 'Failed to verify admin status' });
  }
}
