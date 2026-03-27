// apps/ecommerce-api/server.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { paintingsRouter } from '../../src/interfaces/http/routes/paintings.routes.js';
import { offersRouter } from '../../src/interfaces/http/routes/offers.routes.js';
import { authRouter } from '../../src/interfaces/http/routes/auth.routes.js';
import { adminRouter } from '../../src/interfaces/http/routes/admin.routes.js';
import { webhooksRouter } from '../../src/interfaces/http/routes/webhooks.routes.js';
import { contactRouter } from '../../src/interfaces/http/routes/contact.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseTrustProxy(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  if (!v || v === 'false' || v === '0') return false;
  if (v === 'true' || v === '1') return 1;
  if (/^\d+$/.test(v)) return parseInt(v, 10);
  return value.trim();
}

export function createServer() {
  const app = express();

  const trustProxyFromEnv = parseTrustProxy(process.env.TRUST_PROXY);
  const inferredTrustProxy = process.env.NODE_ENV === 'production' ? 1 : null;
  const trustProxy = trustProxyFromEnv ?? inferredTrustProxy;
  if (trustProxy !== null && trustProxy !== false) {
    app.set('trust proxy', trustProxy);
  }

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-api-key'],
  }));

  // Stripe webhooks necesitan body raw — ANTES del json middleware
  app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));

  app.use(express.json({ limit: '10mb' }));
  app.use(morgan('dev'));

  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: true,
    legacyHeaders: false,
  }));

  // Health check
  app.get('/health', (_req, res) => res.json({ ok: true, service: 'ecommerce-api' }));

  // Rutas públicas
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/paintings', paintingsRouter);
  app.use('/api/v1/paintings', offersRouter); // POST /api/v1/paintings/:id/offers
  app.use('/api/v1', contactRouter);          // POST /api/v1/contact  &  /api/v1/custom-order

  // Admin (protegido por API key)
  app.use('/admin/api', adminRouter);

  // Stripe webhooks
  app.use('/webhooks', webhooksRouter);

  // Panel admin estático
  app.use('/admin', express.static(path.join(process.cwd(), 'public', 'admin')));

  // 404
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

  // Error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error('[server] Error no controlado:', err);
    res.status(500).json({ error: 'Internal error', detail: err?.message ?? 'unknown' });
  });

  return app;
}
