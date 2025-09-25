import { Pool } from 'pg';

// 在开发环境下使用全局变量缓存连接池，避免热重载导致的连接耗尽。
declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

// 导出单例 Postgres 连接池
export const db: Pool =
  global.pgPool ||
  new Pool({
    connectionString: process.env.KANBAN_DATABASE_URL,
  });

// 开发环境缓存到全局，生产环境让实例由模块作用域持有
if (process.env.NODE_ENV !== 'production') {
  global.pgPool = db;
}
