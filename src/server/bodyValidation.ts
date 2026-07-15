import { Request, Response, NextFunction } from 'express';

export function requireBody(req: Request, res: Response, next: NextFunction) {
  if (!req.body) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Request body is required.' });
  }
  next();
}
