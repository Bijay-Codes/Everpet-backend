import type { Request, Response, NextFunction } from "express";
export function requireOrigin(req: Request, res: Response, next: NextFunction) {
    if (process.env.NODE_ENV === 'test') return next();
    if (req.path === '/') return next();
    const orign = req.headers.origin;
    if (orign !== process.env.FRONTEND_URL) {
        return res.status(403).json({ err: 'Requst orign not allowed' });
    }
    next();
}