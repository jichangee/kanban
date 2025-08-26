import { Pool } from 'pg';

// Use a global variable to store the connection pool in development
// to prevent connection exhaustion during hot-reloads.
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString: process.env.KANBAN_DATABASE_URL,
  });
} else {
  // In development, use a global variable to preserve the pool across hot reloads.
  if (!global._pgPool) {
    global._pgPool = new Pool({
      connectionString: process.env.KANBAN_DATABASE_URL,
    });
  }
  pool = global._pgPool;
}

export const db = pool;
