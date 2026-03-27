// src/interfaces/http/routes/contact.routes.js
import { Router } from 'express';
import { submitContact, submitCustomOrder } from '../controllers/contact.controller.js';

export const contactRouter = Router();

contactRouter.post('/contact', submitContact);
contactRouter.post('/custom-order', submitCustomOrder);
