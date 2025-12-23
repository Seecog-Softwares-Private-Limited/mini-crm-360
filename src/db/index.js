// src/db/index.js
import { Sequelize } from "sequelize";

// --- Helper function to get DB config based on NODE_ENV ---
const getDbConfig = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'prod' || nodeEnv === 'production';

  if (isProduction) {
    // Production configuration
    return {
      host: process.env.DB_HOST_PROD || process.env.DB_HOST,
      port: Number(process.env.DB_PORT_PROD || process.env.DB_PORT || 3306),
      database: process.env.DB_NAME_PROD || process.env.DB_NAME || "saas_whatsapp_manager",
      username: process.env.DB_USER_PROD || process.env.DB_USER,
      password: process.env.DB_PASSWORD_PROD || process.env.DB_PASSWORD,
    };
  } else {
    // Stage/Development configuration
    return {
      host: process.env.DB_HOST_STAGE || process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT_STAGE || process.env.DB_PORT || 3306),
      database: process.env.DB_NAME_STAGE || process.env.DB_NAME || "saas_whatsapp_manager",
      username: process.env.DB_USER_STAGE || process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD_STAGE || process.env.DB_PASSWORD || '',
    };
  }
};

// --- Get DB config based on environment ---
const dbConfig = getDbConfig();
const DB_HOST = dbConfig.host;
const DB_PORT = dbConfig.port;
const DB_NAME = dbConfig.database;
const DB_USER = dbConfig.username;
const DB_PASSWORD = dbConfig.password;
const SYNC_DB = (process.env.SYNC_DB || "false") === "true";

// Log which environment and DB config is being used
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`📊 Database Configuration: ${nodeEnv === 'prod' || nodeEnv === 'production' ? 'PRODUCTION' : 'STAGE/DEVELOPMENT'}`);
console.log(`📊 DB Host: ${DB_HOST}`);
console.log(`📊 DB Name: ${DB_NAME}`);
console.log(`📊 DB User: ${DB_USER}`);

// --- sequelize instance ---
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "mysql",
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    charset: "utf8mb4",
  },
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  },
});

// --- connector ---
const connectDB = async () => {
  try {
    // load models + associations first (important)
    await import("../models/index.js");

    // connect
    await sequelize.authenticate();
    console.log("✅ Database connected");

    // ✅ confirm which DB you are actually using
    const [rows] = await sequelize.query("SELECT DATABASE() as db");
    console.log("✅ Connected DB:", rows[0].db);

    if (SYNC_DB) {
      await sequelize.sync({ alter: false });
      console.log("✅ Database synced");
    }
  } catch (err) {
    console.error("❌ DB connection failed:", err);
    process.exit(1);
  }
};

export default connectDB;
export { sequelize };
