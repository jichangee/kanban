const { Pool } = require('pg');
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

// 加载 .env.local 文件
function loadEnvFile() {
  const envPath = join(process.cwd(), '.env.local');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      // 跳过空行和注释
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }
      
      // 解析 KEY=VALUE 格式
      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex).trim();
        let value = trimmedLine.substring(equalIndex + 1).trim();
        
        // 移除引号（如果有）
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        // 如果环境变量还没有设置，则设置它
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
    console.log('✅ 已加载 .env.local 文件\n');
  } else {
    console.log('⚠️  未找到 .env.local 文件，使用系统环境变量\n');
  }
}

// 加载环境变量
loadEnvFile();

// 从环境变量获取数据库连接字符串
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ 错误: 未找到 DATABASE_URL 环境变量');
  console.error('请在 .env.local 文件中设置 DATABASE_URL');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
});

// Schema 文件路径（按执行顺序）
const schemaFiles = [
  'auth-schema.sql',
  'kanban-schema.sql',
  'automation-schema.sql',
];

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 开始初始化数据库...\n');

    // 测试数据库连接
    await client.query('SELECT NOW()');
    console.log('✅ 数据库连接成功\n');

    // 按顺序执行每个 schema 文件
    for (const schemaFile of schemaFiles) {
      const filePath = join(process.cwd(), schemaFile);
      console.log(`📄 执行 ${schemaFile}...`);

      try {
        const sql = readFileSync(filePath, 'utf-8');
        
        // 执行 SQL 语句
        await client.query(sql);
        console.log(`✅ ${schemaFile} 执行成功\n`);
      } catch (error) {
        // 如果表已存在，跳过错误
        if (error.code === '42P07' || error.message?.includes('already exists')) {
          console.log(`⚠️  ${schemaFile} 中的某些表已存在，跳过...\n`);
        } else {
          console.error(`❌ ${schemaFile} 执行失败:`, error.message);
          throw error;
        }
      }
    }

    console.log('🎉 数据库初始化完成！');
    
    // 显示已创建的表
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📊 数据库中的表:');
    tablesResult.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// 运行初始化
initDatabase().catch((error) => {
  console.error('❌ 未处理的错误:', error);
  process.exit(1);
});

