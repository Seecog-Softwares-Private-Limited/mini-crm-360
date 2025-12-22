// src/db/index.js
import { Sequelize } from "sequelize";

// --- env ---
const DB_HOST = process.env.DB_HOST;
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_NAME = process.env.DB_NAME || "saas_whatsapp_manager";
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const SYNC_DB = (process.env.SYNC_DB || "false") === "true";

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
