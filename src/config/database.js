require('dotenv').config();

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
        dialect: 'postgres',
      };
    } catch (error) {
      console.error('Error parsing DATABASE_URL:', error);
    }
  }
  return null;
};

// Get database config from DATABASE_URL or individual variables
const getDbConfig = () => {
  const parsed = parseDatabaseUrl();
  if (parsed) {
    return parsed;
  }
  
  return {
    database: process.env.DB_NAME || 'dms_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: process.env.DB_DIALECT || 'postgres',
  };
};

const baseConfig = getDbConfig();

// Determine if this is a remote database (requires SSL)
const isRemoteDatabase = baseConfig.host !== 'localhost' && 
                         baseConfig.host !== '127.0.0.1' &&
                         !baseConfig.host.startsWith('192.168.') &&
                         !baseConfig.host.startsWith('10.');

// Sequelize CLI configuration
module.exports = {
  development: {
    ...baseConfig,
    dialectOptions: isRemoteDatabase
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
  },
  production: {
    ...baseConfig,
    dialectOptions: isRemoteDatabase
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
  },
  test: {
    ...baseConfig,
    dialectOptions: isRemoteDatabase
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
  },
};

