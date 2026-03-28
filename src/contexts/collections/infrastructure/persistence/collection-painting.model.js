// src/contexts/collections/infrastructure/persistence/collection-painting.model.js
import { DataTypes } from 'sequelize';

export function initCollectionPaintingModel(sequelize) {
  return sequelize.define('CollectionPainting', {
    collectionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'collections', key: 'id' },
    },
    paintingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'paintings', key: 'id' },
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    tableName: 'collection_paintings',
    timestamps: false,
  });
}
