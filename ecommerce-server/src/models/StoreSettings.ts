import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface BankTransferDetails {
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  documentId?: string;
  instructions?: string;
}

interface StoreSettingsAttributes {
  id: string;
  storeName: string;
  contactEmail: string;
  logoUrl?: string;
  shippingZones?: Array<{ name: string; countries: string[]; rate: number }>;
  taxRates?: Record<string, number>;
  bankTransferDetails?: BankTransferDetails | null;
}

class StoreSettings extends Model<StoreSettingsAttributes> implements StoreSettingsAttributes {
  declare id: string;
  declare storeName: string;
  declare contactEmail: string;
  declare logoUrl?: string;
  declare shippingZones?: Array<{ name: string; countries: string[]; rate: number }>;
  declare taxRates?: Record<string, number>;
  declare bankTransferDetails?: BankTransferDetails | null;
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
      defaultValue: 'Raybert Shop',
    },
    contactEmail: {
      type: DataTypes.STRING,
      defaultValue: 'support@raybertshop.com',
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
    bankTransferDetails: {
      type: DataTypes.JSONB,
      // Real Pagomóvil data for this store — editable later from
      // Admin → Settings → Payments if it ever needs to change.
      defaultValue: {
        bankName: '0102',
        accountNumber: '04129253568',
        documentId: '30246814',
      },
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