// src/contexts/orders/application/services/orders.service.js
import Stripe from 'stripe';
import { sequelize } from '../../../../interfaces/db/mysql-client.js';
import {
  sendOrderConfirmationEmail,
  notifySubscribersPaintingSold,
} from '../../../../shared/email/email.service.js';

function stripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

/**
 * Crea una Stripe Checkout Session y un Order pendiente.
 *
 * Modos:
 *  - Compra directa:  { paintingId, buyerName, buyerEmail }
 *  - Pago de oferta:  { offerToken }  (nombre/email se leen de la oferta)
 */
export async function createCheckoutSession({ paintingId, offerToken, buyerName, buyerEmail }) {
  const { Painting, Offer, Order } = sequelize.models;

  let painting, offer, amount, email, name;

  if (offerToken) {
    offer = await Offer.findOne({
      where: { token: offerToken },
      include: [{ model: Painting, as: 'painting' }],
    });
    if (!offer) throw Object.assign(new Error('Oferta no encontrada'), { status: 404 });
    if (offer.status !== 'accepted') {
      throw Object.assign(new Error('Esta oferta no está en estado aceptado'), { status: 400 });
    }
    painting = offer.painting;
    amount   = offer.counterPrice ?? offer.offeredPrice;
    email    = offer.buyerEmail;
    name     = offer.buyerName;
  } else {
    if (!paintingId || !buyerName || !buyerEmail) {
      throw Object.assign(new Error('Faltan campos: paintingId, buyerName, buyerEmail'), { status: 400 });
    }
    painting = await Painting.findByPk(paintingId);
    if (!painting) throw Object.assign(new Error('Cuadro no encontrado'), { status: 404 });
    if (painting.status !== 'available') {
      throw Object.assign(new Error('Este cuadro no está disponible'), { status: 409 });
    }
    amount = painting.price;
    email  = buyerEmail;
    name   = buyerName;
  }

  // Crear Order pendiente
  const order = await Order.create({
    paintingId: painting.id,
    offerId:    offer?.id ?? null,
    buyerEmail: email,
    buyerName:  name,
    amount,
    status: 'pending_payment',
  });

  // Reservar el cuadro para que no se venda dos veces mientras se paga
  await painting.update({ status: 'reserved' });

  // Crear la sesión de Stripe
  const session = await stripe().checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: painting.title,
          description: 'Obra original — Inma Álvarez',
        },
        unit_amount: Math.round(Number(amount) * 100),
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.APP_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${process.env.APP_BASE_URL}/payment/cancel?order_id=${order.id}`,
    metadata: {
      orderId:    order.id,
      paintingId: painting.id,
      offerId:    offer?.id ?? '',
    },
  });

  await order.update({ stripeSessionId: session.id });

  return { url: session.url, orderId: order.id };
}

/**
 * Procesa un evento de Stripe webhook.
 * Llama a este método con el body raw y la firma del header `stripe-signature`.
 */
export async function handleStripeWebhook(rawBody, sig) {
  let event;
  try {
    event = stripe().webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw Object.assign(new Error(`Webhook signature inválida: ${err.message}`), { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { orderId, paintingId, offerId } = session.metadata;

    const { Order, Painting, Offer } = sequelize.models;

    const order = await Order.findByPk(orderId, {
      include: [{ model: Painting, as: 'painting' }],
    });
    if (!order) {
      console.warn(`[webhook] Order no encontrada: ${orderId}`);
      return;
    }

    await order.update({
      status: 'paid',
      stripePaymentIntentId: session.payment_intent,
    });
    await Painting.update({ status: 'sold' }, { where: { id: paintingId } });
    if (offerId) {
      await Offer.update({ status: 'paid' }, { where: { id: offerId } });
    }

    // Recargar painting para tener datos actualizados en emails
    const painting = await Painting.findByPk(paintingId);

    await sendOrderConfirmationEmail({ order, painting }).catch(err =>
      console.error('[webhook] Error enviando email confirmación:', err.message)
    );
    await notifySubscribersPaintingSold(painting).catch(err =>
      console.error('[webhook] Error notificando suscriptores:', err.message)
    );

    console.log(`[webhook] Pago completado — order=${orderId} painting=${paintingId}`);
  }

  if (event.type === 'checkout.session.expired') {
    // La sesión expiró sin pagar — liberar el cuadro
    const session = event.data.object;
    const { orderId, paintingId, offerId } = session.metadata ?? {};
    if (!orderId) return;

    const { Order, Painting, Offer } = sequelize.models;
    await Order.update({ status: 'cancelled' }, { where: { id: orderId } });
    // Solo liberar si sigue reservado (podría haberse vendido por otra vía)
    const painting = await Painting.findByPk(paintingId);
    if (painting?.status === 'reserved') {
      // Si venía de oferta, dejar el cuadro en available pero la oferta sigue accepted
      await painting.update({ status: 'available' });
    }
    console.log(`[webhook] Sesión expirada — order=${orderId} liberado`);
  }
}
