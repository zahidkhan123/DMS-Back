import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";

interface DocumentAttributes {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category?: string;
  s3_key: string;
  s3_url: string;
  file_size: number;
  file_type: string;
  share_token?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface DocumentCreationAttributes extends Optional<DocumentAttributes, "id" | "description" | "category" | "created_at" | "updated_at"> {}

class Document extends Model<DocumentAttributes, DocumentCreationAttributes> implements DocumentAttributes {
  public id!: string;
  public user_id!: string;
  public name!: string;
  public description!: string;
  public category!: string;
  public s3_key!: string;
  public s3_url!: string;
  public file_size!: number;
  public file_type!: string;
  public share_token!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Document.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    s3_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    s3_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    file_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    share_token: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "documents",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Document.belongsTo(User, { foreignKey: "user_id", as: "user" });
// Category is stored as a free-form string, not a foreign key relationship

export default Document;

