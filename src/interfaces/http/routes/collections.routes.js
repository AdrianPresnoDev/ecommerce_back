// src/interfaces/http/routes/collections.routes.js
import { Router } from 'express';
import { getAll, getOne } from '../controllers/collections.controller.js';

export const collectionsRouter = Router();

collectionsRouter.get('/', getAll);
collectionsRouter.get('/:slug', getOne);
