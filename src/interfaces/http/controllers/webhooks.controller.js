// src/interfaces/http/controllers/webhooks.controller.js
import { handleStripeWebhook } from '../../../contexts/orders/application/services/orders.service.js';

export async function stripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  try {
    await handleStripeWebhook(req.body, sig);
    res.json({ received: true });
  } catch (err) {
    console.error('[webhook] Error:', err.message);
    res.status(err.status ?? 400).json({ error: err.message });
  }
}
