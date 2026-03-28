// src/contexts/collections/application/services/collections.service.js
import { Op } from 'sequelize';
import { sequelize } from '../../../../interfaces/db/mysql-client.js';
import { presignPut, buildImageUrl } from '../../../../interfaces/aws/s3.service.js';
import { getS3Config } from '../../../../interfaces/aws/s3.service.js';
import { v4 as uuidv4 } from 'uuid';

function toSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function generateUniqueSlug(title, excludeId = null) {
  const { Collection } = sequelize.models;
  const base = toSlug(title);
  let slug = base;
  let counter = 2;
  while (true) {
    const where = { slug };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const exists = await Collection.findOne({ where });
    if (!exists) return slug;
    slug = `${base}-${counter++}`;
  }
}

function presentCollection(col) {
  const c = col.toJSON ? col.toJSON() : { ...col };
  c.heroImageUrl = buildImageUrl(c.heroImageKey) || null;
  if (c.paintings) {
    const { buildImageUrl: biu } = { buildImageUrl };
    c.paintings = c.paintings.map(p => ({
      ...p,
      imageUrls: (p.images || []).map(k => buildImageUrl(k)),
    }));
  }
  return c;
}

// ─── Público ─────────────────────────────────────────────────────────────────

export async function listCollections() {
  const { Collection } = sequelize.models;
  const rows = await Collection.findAll({
    where: { active: true },
    order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']],
  });
  return rows.map(presentCollection);
}

export async function getCollectionBySlug(slug) {
  const { Collection, Painting } = sequelize.models;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const col = await Collection.findOne({
    where: { slug, active: true },
    include: [{
      model: Painting,
      as: 'paintings',
      where: {
        active: true,
        [Op.or]: [
          { status: 'available' },
          { status: 'reserved' },
          { status: 'sold', updatedAt: { [Op.gte]: sevenDaysAgo } },
        ],
      },
      required: false,
      through: { attributes: [] },
    }],
    order: [[{ model: Painting, as: 'paintings' }, 'sortOrder', 'ASC']],
  });

  if (!col) throw Object.assign(new Error('Colección no encontrada'), { status: 404 });
  return presentCollection(col);
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function listAllCollections() {
  const { Collection } = sequelize.models;
  const rows = await Collection.findAll({
    order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']],
  });
  return rows.map(presentCollection);
}

export async function createCollection(data) {
  const { Collection } = sequelize.models;
  const slug = await generateUniqueSlug(data.title);
  const col = await Collection.create({ ...data, slug });
  return presentCollection(col);
}

export async function updateCollection(id, data) {
  const { Collection } = sequelize.models;
  const col = await Collection.findByPk(id);
  if (!col) throw Object.assign(new Error('Colección no encontrada'), { status: 404 });
  if (data.title && data.title !== col.title) {
    data.slug = await generateUniqueSlug(data.title, id);
  }
  await col.update(data);
  return presentCollection(col);
}

export async function deleteCollection(id) {
  const { Collection } = sequelize.models;
  const col = await Collection.findByPk(id);
  if (!col) throw Object.assign(new Error('Colección no encontrada'), { status: 404 });
  await col.destroy();
}

export async function getCollectionImageUploadUrl(id, { contentType = 'image/jpeg' } = {}) {
  const { Collection } = sequelize.models;
  const col = await Collection.findByPk(id);
  if (!col) throw Object.assign(new Error('Colección no encontrada'), { status: 404 });

  const { prefix } = getS3Config();
  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  const key = [prefix, 'collections', id, `hero-${uuidv4()}.${ext}`].filter(Boolean).join('/');
  const uploadUrl = await presignPut({ key, contentType, expiresInSeconds: 600 });
  return { uploadUrl, key };
}

export async function setHeroImageKey(id, key) {
  const { Collection } = sequelize.models;
  const col = await Collection.findByPk(id);
  if (!col) throw Object.assign(new Error('Colección no encontrada'), { status: 404 });
  await col.update({ heroImageKey: key });
  return presentCollection(col);
}

export async function getCollectionPaintings(collectionId) {
  const { Collection, Painting } = sequelize.models;
  const col = await Collection.findByPk(collectionId, {
    include: [{
      model: Painting,
      as: 'paintings',
      through: { attributes: [] },
    }],
    order: [[{ model: Painting, as: 'paintings' }, 'sortOrder', 'ASC']],
  });
  if (!col) throw Object.assign(new Error('Colección no encontrada'), { status: 404 });
  return (col.paintings || []).map(p => ({
    ...p.toJSON(),
    imageUrls: (p.images || []).map(k => buildImageUrl(k)),
  }));
}

export async function addPaintingToCollection(collectionId, paintingId, sortOrder = 0) {
  const { CollectionPainting, Collection, Painting } = sequelize.models;
  const col = await Collection.findByPk(collectionId);
  if (!col) throw Object.assign(new Error('Colección no encontrada'), { status: 404 });
  const painting = await Painting.findByPk(paintingId);
  if (!painting) throw Object.assign(new Error('Cuadro no encontrado'), { status: 404 });
  await CollectionPainting.findOrCreate({
    where: { collectionId, paintingId },
    defaults: { sortOrder },
  });
  return getCollectionPaintings(collectionId);
}

export async function removePaintingFromCollection(collectionId, paintingId) {
  const { CollectionPainting } = sequelize.models;
  await CollectionPainting.destroy({ where: { collectionId, paintingId } });
  return getCollectionPaintings(collectionId);
}
