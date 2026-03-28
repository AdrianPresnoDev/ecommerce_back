// src/contexts/site-settings/infrastructure/persistence/site-settings.model.js
import { DataTypes } from 'sequelize';

export function initSiteSettingsModel(sequelize) {
  sequelize.define('SiteSettings', {
    key: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
  }, {
    tableName: 'site_settings',
    timestamps: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  });
}
