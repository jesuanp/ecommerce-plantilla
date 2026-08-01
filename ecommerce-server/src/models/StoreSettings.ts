import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

interface StoreSettingsAttributes {
  id: string;
  storeName: string;
  contactEmail: string;
  logoUrl?: string;
  shippingZones?: Array<{ name: string; countries: string[]; rate: number }>;
  taxRates?: Record<string, number>;
}

class StoreSettings extends Model<StoreSettingsAttributes> implements StoreSettingsAttributes {
  declare id: string;
  declare storeName: string;
  declare contactEmail: string;
  declare logoUrl?: string;
  declare shippingZones?: Array<{ name: string; countries: string[]; rate: number }>;
  declare taxRates?: Record<string, number>;
}

StoreSettings.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    storeName: {
      type: DataTypes.STRING,
      defaultValue: 'Lumen Goods',
    },
    contactEmail: {
      type: DataTypes.STRING,
      defaultValue: 'support@lumen.com',
    },
    logoUrl: {
      type: DataTypes.STRING,
    },
    shippingZones: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    taxRates: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'StoreSettings',
    tableName: 'store_settings',
    timestamps: true,
  }
);

export default StoreSettings;