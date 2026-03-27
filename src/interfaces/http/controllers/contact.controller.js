// src/interfaces/http/controllers/contact.controller.js
import { sendContactEmail, sendCustomOrderEmail } from '../../../shared/email/email.service.js';

export async function submitContact(req, res, next) {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'name, email y message son obligatorios' });
    }
    await sendContactEmail({ name, email, phone, message });
    res.json({ message: '¡Mensaje enviado! Inma se pondrá en contacto pronto.' });
  } catch (err) {
    next(err);
  }
}

export async function submitCustomOrder(req, res, next) {
  try {
    const { name, email, phone, artworkType, dimensions, colorPreferences, budget, description, timeline } = req.body;
    if (!name || !email || !description) {
      return res.status(400).json({ error: 'name, email y description son obligatorios' });
    }
    await sendCustomOrderEmail({ name, email, phone, artworkType, dimensions, colorPreferences, budget, description, timeline });
    res.json({ message: '¡Solicitud recibida! Inma revisará tu petición y te contactará en breve.' });
  } catch (err) {
    next(err);
  }
}
