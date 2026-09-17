import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

const cookieName = 'roxstar_token';

type TokenPayload = { sub: string };

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error('JWT_SECRET is required');
  return value;
}

export function issueToken(userId: Types.ObjectId): string {
  return jwt.sign({ sub: userId.toString() }, secret(), { expiresIn: '7d' });
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(cookieName, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
}

function tokenFromRequest(req: Request): string | undefined {
  const authorization = req.header('authorization');
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7);
  return req.cookies?.[cookieName];
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = tokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  try {
    const payload = jwt.verify(token, secret()) as TokenPayload;
    if (!payload.sub || !Types.ObjectId.isValid(payload.sub)) throw new Error('Invalid subject');
    req.authUserId = new Types.ObjectId(payload.sub);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function authUserId(req: Request): Types.ObjectId {
  if (!req.authUserId) throw new Error('Authenticated user missing');
  return req.authUserId;
}

export { cookieName };
