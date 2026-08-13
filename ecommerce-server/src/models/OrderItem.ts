import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import Order from './Order';
import Product from './Product';

interface OrderItemAttributes {
  id: string;
  orderId: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

class OrderItem extends Model<OrderItemAttributes> implements OrderItemAttributes {
  declare id: string;
  declare orderId: string;
  declare productId?: string;
  declare name: string;
  declare price: number;
  declare quantity: number;
  declare image: string;
}

OrderItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      references: {
        model: Order,
        key: 'id',
      },
    },
    productId: {
      type: DataTypes.UUID,
      references: {
        model: Product,
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: 'OrderItem',
    tableName: 'order_items',
    timestamps: true,
  }
);

OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'items' });

export default OrderItem;
