import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import Category from './Category.js';

export interface ProductTranslation {
  name: string;
  description: string;
  longDescription: string;
  brand: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
}

interface ProductAttributes {
  id: string;
  name: string;
  slug?: string;
  brand: string;
  description: string;
  longDescription: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  categoryId: string;
  tags: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  isActive: boolean;
  metaTitle?: string;
  metaDescription?: string;
  translations?: {
    es?: Partial<ProductTranslation>;
    en?: Partial<ProductTranslation>;
  } | null;
}

class Product extends Model<ProductAttributes> implements ProductAttributes {
  declare id: string;
  declare name: string;
  declare slug?: string;
  declare brand: string;
  declare description: string;
  declare longDescription: string;
  declare price: number;
  declare compareAtPrice?: number;
  declare images: string[];
  declare categoryId: string;
  declare tags: string[];
  declare stock: number;
  declare rating: number;
  declare reviewCount: number;
  declare featured: boolean;
  declare isActive: boolean;
  declare metaTitle?: string;
  declare metaDescription?: string;
  declare translations?: {
    es?: Partial<ProductTranslation>;
    en?: Partial<ProductTranslation>;
  } | null;
}

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      unique: true,
    },
    brand: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.TEXT,
    },
    longDescription: {
      type: DataTypes.TEXT,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    compareAtPrice: {
      type: DataTypes.DECIMAL(10, 2),
    },
    images: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    categoryId: {
      type: DataTypes.UUID,
      references: {
        model: Category,
        key: 'id',
      },
    },
    tags: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    metaTitle: {
      type: DataTypes.STRING,
    },
    metaDescription: {
      type: DataTypes.TEXT,
    },
    translations: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
  }
);

Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });

export default Product;