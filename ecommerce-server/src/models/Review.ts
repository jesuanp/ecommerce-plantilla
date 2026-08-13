import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import Product from './Product';
import User from './User';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

interface ReviewAttributes {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  body?: string;
  status: ReviewStatus;
  reply?: string;
}

class Review extends Model<ReviewAttributes> implements ReviewAttributes {
  declare id: string;
  declare productId: string;
  declare userId: string;
  declare rating: number;
  declare title?: string;
  declare body?: string;
  declare status: ReviewStatus;
  declare reply?: string;
}

Review.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.UUID,
      references: { model: Product, key: 'id' },
    },
    userId: {
      type: DataTypes.UUID,
      references: { model: User, key: 'id' },
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    title: {
      type: DataTypes.STRING,
    },
    body: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    reply: {
      type: DataTypes.TEXT,
    },
  },
  {
    sequelize,
    modelName: 'Review',
    tableName: 'reviews',
    timestamps: true,
  }
);

Review.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Review;