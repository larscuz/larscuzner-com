import { Pool, type PoolClient } from "pg";

let pool: Pool | null = null;

export function isPostgresProvider() {
  return process.env.CMS_STORE_PROVIDER === "postgres";
}

export function getPostgresPool() {
  const connectionString = process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL;

  if (!connectionString) {
    throw new Error("Missing SUPABASE_DB_URL or POSTGRES_URL for postgres provider.");
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("supabase.com") ? { rejectUnauthorized: false } : undefined,
    });
  }

  return pool;
}

export async function withPostgresClient<T>(callback: (client: PoolClient) => Promise<T>) {
  const client = await getPostgresPool().connect();

  try {
    return await callback(client);
  } finally {
    client.release();
  }
}
