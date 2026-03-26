// src/interfaces/http/controllers/offers.controller.js
import * as offersService from '../../../contexts/offers/application/services/offers.service.js';

// ─── Público ──────────────────────────────────────────────────────────────────

export async function submitOffer(req, res) {
  try {
    const { buyerName, buyerEmail, buyerPhone, offeredPrice, message } = req.body;
    if (!buyerName || !buyerEmail || !offeredPrice) {
      return res.status(400).json({ error: 'buyerName, buyerEmail y offeredPrice son obligatorios' });
    }
    const result = await offersService.createOffer({
      paintingId: req.params.id,
      buyerName,
      buyerEmail,
      buyerPhone,
      offeredPrice: Number(offeredPrice),
      message,
    });
    return res.status(201).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

export async function checkOffer(req, res) {
  try {
    const offer = await offersService.getOfferByToken(req.params.token);
    // No exponemos el token ni el sellerNote completo al comprador
    return res.json({
      id: offer.id,
      status: offer.status,
      offeredPrice: offer.offeredPrice,
      counterPrice: offer.counterPrice,
      checkoutUrl: offer.checkoutUrl,
      expiresAt: offer.expiresAt,
      painting: offer.painting,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function adminListOffers(req, res) {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const result = await offersService.listOffers({
      status,
      limit: Number(limit),
      offset: Number(offset),
    });
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

export async function adminRespondToOffer(req, res) {
  try {
    const { action, sellerNote, counterPrice } = req.body;
    if (!action) return res.status(400).json({ error: 'action es obligatorio (accept | reject | counter)' });
    const offer = await offersService.respondToOffer(req.params.id, {
      action,
      sellerNote,
      counterPrice: counterPrice ? Number(counterPrice) : undefined,
    });
    return res.json(offer);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}
