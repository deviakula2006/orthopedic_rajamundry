import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Loaded before each test file's imports run. `config/env.js` also loads
// `.env` via `dotenv/config`, but dotenv never overrides variables already
// present in process.env, so these test values win.
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });
