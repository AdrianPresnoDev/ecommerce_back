// apps/ecommerce-api/index.js
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

import { createServer } from './server.js';
import { banner, ok } from './app.js';
import { sequelize } from '../../src/interfaces/db/mysql-client.js';

import { initUserModel } from '../../src/contexts/users/infrastructure/persistence/user.model.js';
import { initPaintingModel } from '../../src/contexts/paintings/infrastructure/persistence/painting.model.js';
import { initOfferModel } from '../../src/contexts/offers/infrastructure/persistence/offer.model.js';
import { initOrderModel } from '../../src/contexts/orders/infrastructure/persistence/order.model.js';
import { initSubscriberModel } from '../../src/contexts/subscribers/infrastructure/persistence/subscriber.model.js';
import { initCollectionModel } from '../../src/contexts/collections/infrastructure/persistence/collection.model.js';
import { initCollectionPaintingModel } from '../../src/contexts/collections/infrastructure/persistence/collection-painting.model.js';

async function connectWithRetry(maxRetries = 10, delayMs = 5000) {
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await sequelize.authenticate();
      return;
    } catch (err) {
      console.error(`[api] Intento ${i}/${maxRetries} fallido: ${err.message}`);
      if (i === maxRetries) throw err;
      console.log(`[api] Reintentando en ${delayMs / 1000}s…`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

(async () => {
  try {
    const doAlter = String(process.env.DB_ALTER ?? '0') === '1';
    const port = Number(process.env.PORT ?? 5000);

    console.log('[api] Conectando a DB…');
    await connectWithRetry();

    // Inicializar modelos
    initUserModel(sequelize);
    initPaintingModel(sequelize);
    initOfferModel(sequelize);
    initOrderModel(sequelize);
    initSubscriberModel(sequelize);
    initCollectionModel(sequelize);
    const CollectionPainting = initCollectionPaintingModel(sequelize);

    // Relaciones
    const { User, Painting, Offer, Order, Collection } = sequelize.models;
    Offer.belongsTo(Painting, { foreignKey: 'paintingId', as: 'painting' });
    Order.belongsTo(Painting, { foreignKey: 'paintingId', as: 'painting' });
    Order.belongsTo(Offer, { foreignKey: 'offerId', as: 'offer' });
    Collection.belongsToMany(Painting, { through: CollectionPainting, foreignKey: 'collectionId', as: 'paintings' });
    Painting.belongsToMany(Collection, { through: CollectionPainting, foreignKey: 'paintingId', as: 'collections' });

    console.log(`[api] Sincronizando modelos (alter=${doAlter})…`);
    await sequelize.sync(doAlter ? { alter: true } : undefined);

    // Asegurarse de que todas las tablas usan utf8mb4 (migración idempotente)
    const tables = ['users', 'paintings', 'offers', 'orders', 'subscribers', 'collections', 'collection_paintings'];
    for (const table of tables) {
      await sequelize.query(
        `ALTER TABLE \`${table}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      ).catch(err => console.warn(`[db] charset migration ${table}:`, err.message));
    }
    console.log('[api] Charset migration completada');

    // Generar slugs para cuadros que no los tengan
    const withoutSlug = await Painting.findAll({ where: { slug: null } });
    for (const p of withoutSlug) {
      const base = p.title.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '').trim()
        .replace(/\s+/g, '-').replace(/-+/g, '-');
      let slug = base; let i = 2;
      while (await Painting.findOne({ where: { slug } })) slug = `${base}-${i++}`;
      await p.update({ slug });
      console.log(`[api] Slug generado: ${p.title} → ${slug}`);
    }

    ok('DB conectada y sincronizada');

    const app = createServer();
    app.listen(port, () => {
      banner(`Servidor listo → http://localhost:${port}`);
    });
  } catch (e) {
    console.error('[api] Error al arrancar:', e);
    process.exit(1);
  }
})();
