// src/contexts/users/infrastructure/persistence/user.model.js
import { DataTypes } from 'sequelize';

export function initUserModel(sequelize) {
  return sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('buyer', 'admin'),
      defaultValue: 'buyer',
    },
  }, {
    tableName: 'users',
    timestamps: true,
  });
}
