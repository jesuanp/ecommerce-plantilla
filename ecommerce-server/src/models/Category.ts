import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface CategoryTranslation {
  name: string;
  description: string;
}

interface CategoryAttributes {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
  isVisible: boolean;
  sortOrder: number;
  translations?: {
    es?: Partial<CategoryTranslation>;
    en?: Partial<CategoryTranslation>;
  } | null;
}

class Category extends Model<CategoryAttributes> implements CategoryAttributes {
  declare id: string;
  declare name: string;
  declare slug: string;
  declare description: string;
  declare image: string;
  declare productCount: number;
  declare isVisible: boolean;
  declare sortOrder: number;
  declare translations?: {
    es?: Partial<CategoryTranslation>;
    en?: Partial<CategoryTranslation>;
  } | null;
}

Category.init(
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
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
    },
    image: {
      type: DataTypes.STRING,
    },
    productCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    translations: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'Category',
    tableName: 'categories',
    timestamps: true,
  }
);

export default Category;