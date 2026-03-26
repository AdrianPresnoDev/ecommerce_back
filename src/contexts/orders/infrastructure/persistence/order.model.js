// src/contexts/orders/infrastructure/persistence/order.model.js
import { DataTypes } from 'sequelize';

export function initOrderModel(sequelize) {
  return sequelize.define('Order', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    paintingId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    offerId: {
      // Nullable: sólo si la compra viene de una oferta aceptada
      type: DataTypes.UUID,
      allowNull: true,
    },
    buyerEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    buyerName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    amount: {
      // Importe final pagado
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    stripeSessionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    stripePaymentIntentId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending_payment', 'paid', 'cancelled'),
      defaultValue: 'pending_payment',
    },
  }, {
    tableName: 'orders',
    timestamps: true,
  });
}
