// src/contexts/paintings/application/services/paintings.service.js
import { sequelize } from '../../../../interfaces/db/mysql-client.js';
import { presignPut, buildImageUrl } from '../../../../interfaces/aws/s3.service.js';
import { getS3Config } from '../../../../interfaces/aws/s3.service.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Transforma un cuadro de DB añadiendo las URLs públicas de las imágenes.
 */
function presentPainting(painting) {
  const p = painting.toJSON ? painting.toJSON() : { ...painting };
  p.imageUrls = (p.images || []).map(key => buildImageUrl(key));
  return p;
}

export async function listPaintings({ status, category, featured, limit = 50, offset = 0 } = {}) {
  const { Painting } = sequelize.models;
  const where = { active: true };
  if (status) where.status = status;
  if (category) where.category = category;
  if (featured !== undefined) where.featured = featured;

  const { count, rows } = await Painting.findAndCountAll({
    where,
    order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
    limit: Math.min(limit, 100),
    offset,
  });

  return {
    total: count,
    paintings: rows.map(presentPainting),
  };
}

export async function getPainting(id) {
  const { Painting } = sequelize.models;
  const painting = await Painting.findOne({ where: { id, active: true } });
  if (!painting) throw Object.assign(new Error('Cuadro no encontrado'), { status: 404 });
  return presentPainting(painting);
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function listAllPaintings({ limit = 50, offset = 0 } = {}) {
  const { Painting } = sequelize.models;
  const { count, rows } = await Painting.findAndCountAll({
    order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
    limit: Math.min(limit, 200),
    offset,
  });
  return { total: count, paintings: rows.map(presentPainting) };
}

export async function createPainting(data) {
  const { Painting } = sequelize.models;
  const painting = await Painting.create(data);
  return presentPainting(painting);
}

export async function updatePainting(id, data) {
  const { Painting } = sequelize.models;
  const painting = await Painting.findByPk(id);
  if (!painting) throw Object.assign(new Error('Cuadro no encontrado'), { status: 404 });
  await painting.update(data);
  return presentPainting(painting);
}

export async function deletePainting(id) {
  const { Painting } = sequelize.models;
  const painting = await Painting.findByPk(id);
  if (!painting) throw Object.assign(new Error('Cuadro no encontrado'), { status: 404 });
  await painting.destroy();
}

/**
 * Genera una URL prefirmada de S3 para subir una imagen de un cuadro.
 * El frontend hace PUT directo a esa URL y luego llama a confirmImageUpload.
 */
export async function getImageUploadUrl(paintingId, { contentType = 'image/jpeg' } = {}) {
  const { prefix } = getS3Config();
  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  const key = [prefix, 'paintings', paintingId, `${uuidv4()}.${ext}`]
    .filter(Boolean)
    .join('/');

  const uploadUrl = await presignPut({ key, contentType, expiresInSeconds: 600 });
  return { uploadUrl, key };
}

/**
 * Añade una S3 key al array de imágenes del cuadro.
 */
export async function addImageKey(paintingId, key) {
  const { Painting } = sequelize.models;
  const painting = await Painting.findByPk(paintingId);
  if (!painting) throw Object.assign(new Error('Cuadro no encontrado'), { status: 404 });
  const images = [...(painting.images || []), key];
  await painting.update({ images });
  return presentPainting(painting);
}

/**
 * Elimina una S3 key del array de imágenes del cuadro.
 */
export async function removeImageKey(paintingId, key) {
  const { Painting } = sequelize.models;
  const painting = await Painting.findByPk(paintingId);
  if (!painting) throw Object.assign(new Error('Cuadro no encontrado'), { status: 404 });
  const images = (painting.images || []).filter(k => k !== key);
  await painting.update({ images });
  return presentPainting(painting);
}
