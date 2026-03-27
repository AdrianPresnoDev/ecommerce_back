// src/contexts/offers/application/services/offers.service.js
import { randomBytes } from 'node:crypto';
import { sequelize } from '../../../../interfaces/db/mysql-client.js';
import { sendOfferReceivedEmail, sendOfferResponseEmail } from '../../../../shared/email/email.service.js';

function generateToken() {
  return randomBytes(32).toString('hex');
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function createOffer({ paintingId, buyerName, buyerEmail, buyerPhone, offeredPrice, message }) {
  const { Painting, Offer } = sequelize.models;

  const painting = await Painting.findOne({ where: { id: paintingId, active: true } });
  if (!painting) throw Object.assign(new Error('Cuadro no encontrado'), { status: 404 });
  if (painting.status === 'sold') throw Object.assign(new Error('Este cuadro ya está vendido'), { status: 409 });

  if (!offeredPrice || offeredPrice <= 0) {
    throw Object.assign(new Error('El precio ofrecido debe ser mayor que 0'), { status: 400 });
  }

  const offer = await Offer.create({
    paintingId,
    buyerName,
    buyerEmail,
    buyerPhone: buyerPhone || null,
    offeredPrice,
    message: message || null,
    token: generateToken(),
    expiresAt: addDays(new Date(), 7),
  });

  // Notificar a la vendedora
  await sendOfferReceivedEmail({ painting, offer }).catch(err =>
    console.error('[offers] Error enviando email a vendedora:', err.message)
  );

  return {
    id: offer.id,
    token: offer.token,
    status: offer.status,
    message: 'Tu oferta ha sido enviada. Te avisaremos por email cuando sea revisada.',
  };
}

export async function getOfferByToken(token) {
  const { Offer, Painting } = sequelize.models;
  const offer = await Offer.findOne({
    where: { token },
    include: [{ model: Painting, as: 'painting', attributes: ['id', 'title', 'images', 'price'] }],
  });
  if (!offer) throw Object.assign(new Error('Oferta no encontrada'), { status: 404 });
  return offer;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function listOffers({ status, limit = 50, offset = 0 } = {}) {
  const { Offer, Painting } = sequelize.models;
  const where = {};
  if (status) where.status = status;

  const { count, rows } = await Offer.findAndCountAll({
    where,
    include: [{ model: Painting, as: 'painting', attributes: ['id', 'title', 'price', 'images'] }],
    order: [['createdAt', 'DESC']],
    limit: Math.min(limit, 200),
    offset,
  });

  return { total: count, offers: rows };
}

export async function respondToOffer(id, { action, sellerNote, counterPrice }) {
  const { Offer, Painting } = sequelize.models;

  const offer = await Offer.findByPk(id, {
    include: [{ model: Painting, as: 'painting' }],
  });
  if (!offer) throw Object.assign(new Error('Oferta no encontrada'), { status: 404 });
  if (!['pending', 'countered'].includes(offer.status)) {
    throw Object.assign(new Error(`No se puede responder a una oferta en estado "${offer.status}"`), { status: 409 });
  }

  const validActions = ['accept', 'reject', 'counter'];
  if (!validActions.includes(action)) {
    throw Object.assign(new Error(`Acción inválida. Opciones: ${validActions.join(', ')}`), { status: 400 });
  }

  if (action === 'counter' && (!counterPrice || counterPrice <= 0)) {
    throw Object.assign(new Error('Se requiere un counterPrice válido para contraofertar'), { status: 400 });
  }

  const updates = { sellerNote: sellerNote || null };

  if (action === 'accept') {
    updates.status = 'accepted';
    // Marcar el cuadro como vendido
    await offer.painting.update({ status: 'sold' });
    // En Fase 2 aquí generaremos el Stripe Checkout URL
  } else if (action === 'reject') {
    updates.status = 'rejected';
  } else if (action === 'counter') {
    updates.status = 'countered';
    updates.counterPrice = counterPrice;
    // Renovar expiración 7 días más
    const d = new Date();
    d.setDate(d.getDate() + 7);
    updates.expiresAt = d;
  }

  await offer.update(updates);

  // Notificar al comprador
  await sendOfferResponseEmail({ offer, painting: offer.painting }).catch(err =>
    console.error('[offers] Error enviando email al comprador:', err.message)
  );

  return offer;
}
