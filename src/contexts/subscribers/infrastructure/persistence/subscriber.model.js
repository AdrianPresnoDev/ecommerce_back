// src/contexts/subscribers/infrastructure/persistence/subscriber.model.js
import { DataTypes } from 'sequelize';

export function initSubscriberModel(sequelize) {
  return sequelize.define('Subscriber', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
    },
  }, {
    tableName: 'subscribers',
    timestamps: true,
  });
}
