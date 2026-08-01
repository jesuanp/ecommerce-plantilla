import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export type PromotionType = 'percent' | 'fixed' | 'free_shipping';
export type PromotionAppliesTo = 'all' | 'category' | 'product';

interface PromotionAttributes {
  id: string;
  code: string;
  type: PromotionType;
  value: number;
  appliesTo: PromotionAppliesTo;
  appliesId?: string;
  maxUses?: number;
  maxUsesPerUser?: number;
  usedCount: number;
  startsAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  description?: string;
}

class Promotion extends Model<PromotionAttributes> implements PromotionAttributes {
  declare id: string;
  declare code: string;
  declare type: PromotionType;
  declare value: number;
  declare appliesTo: PromotionAppliesTo;
  declare appliesId?: string;
  declare maxUses?: number;
  declare maxUsesPerUser?: number;
  declare usedCount: number;
  declare startsAt?: Date;
  declare expiresAt?: Date;
  declare isActive: boolean;
  declare description?: string;
}

Promotion.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM('percent', 'fixed', 'free_shipping'),
      allowNull: false,
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    appliesTo: {
      type: DataTypes.ENUM('all', 'category', 'product'),
      defaultValue: 'all',
    },
    appliesId: {
      type: DataTypes.UUID,
    },
    maxUses: {
      type: DataTypes.INTEGER,
    },
    maxUsesPerUser: {
      type: DataTypes.INTEGER,
    },
    usedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    startsAt: {
      type: DataTypes.DATE,
    },
    expiresAt: {
      type: DataTypes.DATE,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    description: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: 'Promotion',
    tableName: 'promotions',
    timestamps: true,
  }
);

export default Promotion;