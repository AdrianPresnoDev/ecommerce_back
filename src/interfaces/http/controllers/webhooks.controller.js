// src/interfaces/http/controllers/webhooks.controller.js
// Stripe webhook — Phase 2: confirmar pago y marcar cuadro como vendido

export async function stripeWebhook(req, res) {
  // TODO (Fase 2): verificar firma con stripe.webhooks.constructEvent()
  // y procesar checkout.session.completed para:
  //   1. Marcar Order como 'paid'
  //   2. Marcar Painting como 'sold'
  //   3. Marcar Offer como 'paid' (si aplica)
  //   4. Enviar email de confirmación al comprador
  console.log('[webhooks] Stripe event recibido (pendiente de implementar en Fase 2)');
  return res.json({ received: true });
}
