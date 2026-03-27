// src/contexts/paintings/infrastructure/persistence/painting.model.js
import { DataTypes } from 'sequelize';

export function initPaintingModel(sequelize) {
  return sequelize.define('Painting', {
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
      type: DataTypes.TEXT,
      allowNull: true,
    },
    technique: {
      // e.g. "Óleo sobre lienzo", "Acuarela", "Acrílico"
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    dimensions: {
      // e.g. "50x70 cm"
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    category: {
      // e.g. "Paisaje", "Retrato", "Abstracto", "Floral"
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    // Array de S3 keys (primera imagen = imagen principal)
    images: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM('available', 'reserved', 'sold'),
      defaultValue: 'available',
    },
    featured: {
      // Destacado en la portada
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    sortOrder: {
      // Orden de aparición en la galería
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    active: {
      // Visible al público
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'paintings',
    timestamps: true,
  });
}
