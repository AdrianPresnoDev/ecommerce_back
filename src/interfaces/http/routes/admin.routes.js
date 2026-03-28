// src/interfaces/http/routes/admin.routes.js
import { Router } from 'express';
import { requireAdminApiKey } from '../middlewares/admin-apikey.js';
import {
  adminListPaintings,
  adminCreatePainting,
  adminUpdatePainting,
  adminDeletePainting,
  adminGetImageUploadUrl,
  adminAddImageKey,
  adminRemoveImageKey,
} from '../controllers/paintings.controller.js';
import {
  adminListOffers,
  adminRespondToOffer,
} from '../controllers/offers.controller.js';
import {
  adminList as adminListCollections,
  adminCreate as adminCreateCollection,
  adminUpdate as adminUpdateCollection,
  adminDelete as adminDeleteCollection,
  adminGetImageUploadUrl as adminGetCollectionImageUploadUrl,
  adminSetHeroImage as adminSetCollectionHeroImage,
  adminGetPaintings as adminGetCollectionPaintings,
  adminAddPainting as adminAddPaintingToCollection,
  adminRemovePainting as adminRemovePaintingFromCollection,
} from '../controllers/collections.controller.js';

export const adminRouter = Router();

// Todas las rutas del admin requieren API key
adminRouter.use(requireAdminApiKey);

// ─── Cuadros ────────────────────────────────────────────────────────────────
adminRouter.get('/paintings', adminListPaintings);
adminRouter.post('/paintings', adminCreatePainting);
adminRouter.patch('/paintings/:id', adminUpdatePainting);
adminRouter.delete('/paintings/:id', adminDeletePainting);

// Gestión de imágenes
adminRouter.post('/paintings/:id/images/presign', adminGetImageUploadUrl);
adminRouter.post('/paintings/:id/images', adminAddImageKey);
adminRouter.delete('/paintings/:id/images', adminRemoveImageKey);

// ─── Ofertas ─────────────────────────────────────────────────────────────────
adminRouter.get('/offers', adminListOffers);
adminRouter.patch('/offers/:id', adminRespondToOffer);

// ─── Colecciones ─────────────────────────────────────────────────────────────
adminRouter.get('/collections', adminListCollections);
adminRouter.post('/collections', adminCreateCollection);
adminRouter.patch('/collections/:id', adminUpdateCollection);
adminRouter.delete('/collections/:id', adminDeleteCollection);

// Hero image
adminRouter.post('/collections/:id/images/presign', adminGetCollectionImageUploadUrl);
adminRouter.post('/collections/:id/images', adminSetCollectionHeroImage);

// Cuadros dentro de una colección
adminRouter.get('/collections/:id/paintings', adminGetCollectionPaintings);
adminRouter.post('/collections/:id/paintings', adminAddPaintingToCollection);
adminRouter.delete('/collections/:id/paintings/:paintingId', adminRemovePaintingFromCollection);
