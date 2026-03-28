// src/interfaces/http/controllers/site-settings.controller.js
import * as svc from '../../../contexts/site-settings/application/services/site-settings.service.js';

export async function getAbout(req, res) {
  try {
    return res.json(await svc.getAboutPage());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function adminUpdateAbout(req, res) {
  try {
    return res.json(await svc.updateAboutPage(req.body));
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

export async function adminGetAboutImageUploadUrl(req, res) {
  try {
    const { contentType = 'image/jpeg' } = req.body;
    return res.json(await svc.getAboutImageUploadUrl(contentType));
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}
