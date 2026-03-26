// src/interfaces/http/routes/paintings.routes.js
import { Router } from 'express';
import { getAll, getOne } from '../controllers/paintings.controller.js';

export const paintingsRouter = Router();

// Público — galería y detalle de cuadro
paintingsRouter.get('/', getAll);
paintingsRouter.get('/:id', getOne);
