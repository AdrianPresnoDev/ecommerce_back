// src/interfaces/http/controllers/paintings.controller.js
import * as paintingsService from '../../../contexts/paintings/application/services/paintings.service.js';
import { notifySubscribersNewPainting, notifySubscribersPaintingSold } from '../../../shared/email/email.service.js';

// ─── Público ──────────────────────────────────────────────────────────────────

export async function getAll(req, res) {
  try {
    const { category, featured, limit = 50, offset = 0 } = req.query;
    const result = await paintingsService.listPaintings({
      category,
      featured: featured !== undefined ? featured === 'true' : undefined,
      limit: Number(limit),
      offset: Number(offset),
    });
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getOne(req, res) {
  try {
    const painting = await paintingsService.getPainting(req.params.id);
    return res.json(painting);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function adminListPaintings(req, res) {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const result = await paintingsService.listAllPaintings({
      limit: Number(limit),
      offset: Number(offset),
    });
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

export async function adminCreatePainting(req, res) {
  try {
    const { title, description, technique, dimensions, year, category, price, featured, sortOrder, active } = req.body;
    if (!title || price === undefined) {
      return res.status(400).json({ error: 'title y price son obligatorios' });
    }
    const painting = await paintingsService.createPainting({
      title, description, technique, dimensions, year, category,
      price: Number(price),
      featured: featured ?? false,
      sortOrder: sortOrder ?? 0,
      active: active ?? true,
    });

    // Notificar a suscriptores si la obra se publica activa
    if (painting.active !== false) {
      notifySubscribersNewPainting(painting).catch(err =>
        console.error('[notify] Error notificando nueva obra:', err.message)
      );
    }

    return res.status(201).json(painting);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

export async function adminUpdatePainting(req, res) {
  try {
    const allowed = ['title', 'description', 'technique', 'dimensions', 'year', 'category', 'price', 'status', 'featured', 'sortOrder', 'active'];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }

    // Capturar estado previo para detectar transición a "sold"
    const previous = data.status === 'sold'
      ? await paintingsService.getPainting(req.params.id)
      : null;

    const painting = await paintingsService.updatePainting(req.params.id, data);

    // Notificar si acaba de marcarse como vendida
    if (previous && previous.status !== 'sold' && painting.status === 'sold') {
      notifySubscribersPaintingSold(painting).catch(err =>
        console.error('[notify] Error notificando obra vendida:', err.message)
      );
    }

    return res.json(painting);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

export async function adminDeletePainting(req, res) {
  try {
    await paintingsService.deletePainting(req.params.id);
    return res.status(204).end();
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

export async function adminGetImageUploadUrl(req, res) {
  try {
    const { contentType = 'image/jpeg' } = req.body;
    const result = await paintingsService.getImageUploadUrl(req.params.id, { contentType });
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

export async function adminAddImageKey(req, res) {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'key es obligatorio' });
    const painting = await paintingsService.addImageKey(req.params.id, key);
    return res.json(painting);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

export async function adminRemoveImageKey(req, res) {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'key es obligatorio' });
    const painting = await paintingsService.removeImageKey(req.params.id, key);
    return res.json(painting);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}
