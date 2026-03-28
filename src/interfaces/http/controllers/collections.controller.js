// src/interfaces/http/controllers/collections.controller.js
import * as svc from '../../../contexts/collections/application/services/collections.service.js';

// ─── Público ─────────────────────────────────────────────────────────────────

export async function getAll(req, res) {
  try {
    const data = await svc.listCollections();
    return res.json(data);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getOne(req, res) {
  try {
    const data = await svc.getCollectionBySlug(req.params.slug);
    return res.json(data);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function adminList(req, res) {
  try {
    return res.json(await svc.listAllCollections());
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

export async function adminCreate(req, res) {
  try {
    const { title, description, longDescription, color, sortOrder, active } = req.body;
    if (!title) return res.status(400).json({ error: 'title es obligatorio' });
    const col = await svc.createCollection({ title, description, longDescription, color, sortOrder, active });
    return res.status(201).json(col);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

export async function adminUpdate(req, res) {
  try {
    const allowed = ['title', 'description', 'longDescription', 'color', 'heroImageKey', 'sortOrder', 'active'];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    return res.json(await svc.updateCollection(req.params.id, data));
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

export async function adminDelete(req, res) {
  try {
    await svc.deleteCollection(req.params.id);
    return res.status(204).end();
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

export async function adminGetImageUploadUrl(req, res) {
  try {
    const { contentType = 'image/jpeg' } = req.body;
    return res.json(await svc.getCollectionImageUploadUrl(req.params.id, { contentType }));
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

export async function adminSetHeroImage(req, res) {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'key es obligatorio' });
    return res.json(await svc.setHeroImageKey(req.params.id, key));
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

export async function adminGetPaintings(req, res) {
  try {
    return res.json(await svc.getCollectionPaintings(req.params.id));
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

export async function adminAddPainting(req, res) {
  try {
    const { paintingId, sortOrder } = req.body;
    if (!paintingId) return res.status(400).json({ error: 'paintingId es obligatorio' });
    return res.json(await svc.addPaintingToCollection(req.params.id, paintingId, sortOrder));
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

export async function adminRemovePainting(req, res) {
  try {
    return res.json(await svc.removePaintingFromCollection(req.params.id, req.params.paintingId));
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}
