// Sets up the online database (Supabase) on every Vercel build. Safe to run again and again.
// Runs only when the database connection is available (POSTGRES_URL_NON_POOLING from the
// Supabase integration in Vercel). Locally, without it, this does nothing.
import { readFileSync } from 'node:fs';
import pg from 'pg';

const url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!url) {
  console.log('Database: no connection settings here, skipping setup.');
  process.exit(0);
}

const sql = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
// Supabase needs SSL; its certificate chain is not in Node's default store, so do not verify it here.
const conn = new URL(url);
conn.searchParams.delete('sslmode');
conn.searchParams.delete('supa');
const client = new pg.Client({ connectionString: conn.toString(), ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  await client.query(sql);
  console.log('Database: tables and access rules are up to date.');
} catch (e) {
  // Do not block the whole site from deploying. The app keeps working on the device.
  console.warn(`Database setup failed: ${e.message}`);
} finally {
  await client.end().catch(() => {});
}
