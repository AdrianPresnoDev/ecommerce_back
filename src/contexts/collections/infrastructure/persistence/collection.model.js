// src/contexts/collections/infrastructure/persistence/collection.model.js
import { DataTypes } from 'sequelize';

export function initCollectionModel(sequelize) {
  return sequelize.define('Collection', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(220),
      allowNull: true,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    longDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    color: {
      // Clase Tailwind gradient o hex, e.g. "from-violet-900 to-violet-700"
      type: DataTypes.STRING(150),
      allowNull: true,
      defaultValue: 'from-stone-800 to-stone-600',
    },
    heroImageKey: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'collections',
    timestamps: true,
  });
}
