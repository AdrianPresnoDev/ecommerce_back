// src/interfaces/http/controllers/orders.controller.js
import { createCheckoutSession } from '../../../contexts/orders/application/services/orders.service.js';

export async function createCheckout(req, res) {
  try {
    const { paintingId, offerToken, buyerName, buyerEmail } = req.body;
    const result = await createCheckoutSession({ paintingId, offerToken, buyerName, buyerEmail });
    res.json(result);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}
