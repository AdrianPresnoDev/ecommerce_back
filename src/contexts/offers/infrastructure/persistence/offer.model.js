// src/contexts/offers/infrastructure/persistence/offer.model.js
import { DataTypes } from 'sequelize';

export function initOfferModel(sequelize) {
  return sequelize.define('Offer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    paintingId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    buyerName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    buyerEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    buyerPhone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    offeredPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    message: {
      // Mensaje opcional del comprador
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'countered', 'paid', 'expired'),
      defaultValue: 'pending',
    },
    sellerNote: {
      // Nota interna del vendedor o respuesta al comprador
      type: DataTypes.TEXT,
      allowNull: true,
    },
    counterPrice: {
      // Precio alternativo propuesto por el vendedor
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    // Token único para que el comprador consulte el estado por email
    token: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    // URL de Stripe Checkout generada al aceptar la oferta
    checkoutUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    expiresAt: {
      // La oferta expira a los 7 días
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'offers',
    timestamps: true,
  });
}
