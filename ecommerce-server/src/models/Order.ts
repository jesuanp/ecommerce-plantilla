import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';

interface OrderAttributes {
  id: string;
  userId?: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  paymentMethod: 'stripe' | 'paypal';
  stripeSessionId?: string;
  customerEmail: string;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    zipCode: string;
    country: string;
  };
  trackingNumber?: string;
  notes?: string;
  statusHistory?: Array<{ status: string; at: string; by?: string }>;
}

class Order extends Model<OrderAttributes> implements OrderAttributes {
  declare id: string;
  declare userId?: string;
  declare status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  declare subtotal: number;
  declare shipping: number;
  declare tax: number;
  declare total: number;
  declare paymentMethod: 'stripe' | 'paypal';
  declare stripeSessionId?: string;
  declare customerEmail: string;
  declare shippingAddress: any;
  declare trackingNumber?: string;
  declare notes?: string;
  declare statusHistory?: Array<{ status: string; at: string; by?: string }>;
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      references: {
        model: User,
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'),
      defaultValue: 'pending',
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    shipping: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM('stripe', 'paypal'),
      defaultValue: 'stripe',
    },
    stripeSessionId: {
      type: DataTypes.STRING,
    },
    customerEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingAddress: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    trackingNumber: {
      type: DataTypes.STRING,
    },
    notes: {
      type: DataTypes.TEXT,
    },
    statusHistory: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
  }
);

Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });

export default Order;