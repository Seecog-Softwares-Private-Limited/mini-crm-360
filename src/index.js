// src/index.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// resolve dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔴 LOAD ENV FIRST — THIS IS THE KEY FIX
dotenv.config({ path: path.join(__dirname, '../property.env') });

// 🔍 TEMP DEBUG (remove later)
console.log("ENV CHECK:", {
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL,
  JWT_ACCESS_SECRET: !!process.env.JWT_ACCESS_SECRET,
});

// NOW import app (after env is loaded)
import { app } from './app.js';

// Import DB only after env is loaded
const { default: connectDB } = await import('./db/index.js');
await connectDB();

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
