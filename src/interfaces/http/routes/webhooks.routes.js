// src/interfaces/http/routes/webhooks.routes.js
import { Router } from 'express';
import { stripeWebhook } from '../controllers/webhooks.controller.js';

export const webhooksRouter = Router();

// Body raw necesario para verificar firma de Stripe
// (el middleware express.raw() se aplica en server.js antes de express.json())
webhooksRouter.post('/stripe', stripeWebhook);
