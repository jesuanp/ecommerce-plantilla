import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';

interface AuditLogAttributes {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

class AuditLog extends Model<AuditLogAttributes> implements AuditLogAttributes {
  declare id: string;
  declare userId?: string;
  declare userEmail?: string;
  declare action: string;
  declare resourceType?: string;
  declare resourceId?: string;
  declare metadata?: Record<string, any>;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      references: { model: User, key: 'id' },
    },
    userEmail: {
      type: DataTypes.STRING,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    resourceType: {
      type: DataTypes.STRING,
    },
    resourceId: {
      type: DataTypes.UUID,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false,
  }
);

AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default AuditLog;