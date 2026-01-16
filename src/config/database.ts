import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Parse DATABASE_URL if provided (Render.com format)
// Format: postgres://user:password@host:port/database
const parseDatabaseUrl = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl);
      return {
        database: url.pathname.slice(1), // Remove leading '/'
        username: url.username,
        password: url.password,
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        dialect: "postgres" as const,
      };
    } catch (error) {
      console.error("Error parsing DATABASE_URL:", error);
    }
  }
  return null;
};

// Use DATABASE_URL if available, otherwise use individual DB_* variables
const dbConfig = parseDatabaseUrl() || {
  database: process.env.DB_NAME || "dms_db",
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  dialect: (process.env.DB_DIALECT as any) || "postgres",
};

// Enable SSL for remote databases (not localhost)
// Render.com and most cloud PostgreSQL services require SSL
const isRemoteDatabase = dbConfig.host !== "localhost" &&
  dbConfig.host !== "127.0.0.1" &&
  !dbConfig.host.startsWith("192.168.") &&
  !dbConfig.host.startsWith("10.");

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      // Enable SSL for remote databases (Render.com requires SSL)
      ssl: isRemoteDatabase
        ? {
          require: true,
          rejectUnauthorized: false, // Allow self-signed certificates
        }
        : false,
    },
  }
);

export default sequelize;

