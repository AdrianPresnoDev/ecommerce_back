// src/interfaces/http/routes/offers.routes.js
import { Router } from 'express';
import { submitOffer, checkOffer } from '../controllers/offers.controller.js';

export const offersRouter = Router();

// POST /api/v1/paintings/:id/offers — comprador hace una oferta
offersRouter.post('/:id/offers', submitOffer);

// GET /api/v1/offers/:token — comprador consulta el estado de su oferta
offersRouter.get('/offers/:token', checkOffer);
