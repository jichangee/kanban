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
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }
      
      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex).trim();
        let value = trimmedLine.substring(equalIndex + 1).trim();
        
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
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

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ 错误: 未找到 DATABASE_URL 环境变量');
  console.error('请在 .env.local 文件中设置 DATABASE_URL');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
});

async function fixVerificationToken() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 开始修复 verification_token 表...\n');

    // 测试数据库连接
    await client.query('SELECT NOW()');
    console.log('✅ 数据库连接成功\n');

    // 检查旧表是否存在
    const checkOldTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'verification_tokens'
      );
    `);
    
    if (checkOldTable.rows[0].exists) {
      console.log('📋 发现旧表 verification_tokens，正在删除...');
      await client.query('DROP TABLE "verification_tokens"');
      console.log('✅ 已删除旧表\n');
    } else {
      console.log('ℹ️  未找到旧表 verification_tokens\n');
    }

    // 检查新表是否存在
    const checkNewTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'verification_token'
      );
    `);

    if (checkNewTable.rows[0].exists) {
      console.log('ℹ️  表 verification_token 已存在\n');
    } else {
      // 创建新表
      console.log('📝 创建新表 verification_token...');
      await client.query(`
        CREATE TABLE "verification_token" (
          "identifier" text NOT NULL,
          "token" text NOT NULL,
          "expires" timestamp with time zone NOT NULL,
          CONSTRAINT "verification_token_pkey" PRIMARY KEY ("identifier", "token")
        );
      `);
      console.log('✅ 已创建新表\n');
    }

    console.log('🎉 修复完成！');
    
    // 显示所有表
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📊 数据库中的表:');
    tablesResult.rows.forEach((row) => {
      const indicator = row.table_name === 'verification_token' ? ' ✓' : '  ';
      console.log(`${indicator} ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// 运行修复
fixVerificationToken().catch((error) => {
  console.error('❌ 未处理的错误:', error);
  process.exit(1);
});

