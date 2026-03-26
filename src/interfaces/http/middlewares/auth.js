// src/interfaces/http/middlewares/auth.js
import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const [, token] = hdr.split(' ');
    if (!token) return res.status(401).json({ error: 'Token requerido' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = { userId: payload.sub };
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function optionalAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const [, token] = hdr.split(' ');
    if (!token) { req.auth = null; return next(); }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = { userId: payload.sub };
    next();
  } catch {
    req.auth = null;
    next();
  }
}
