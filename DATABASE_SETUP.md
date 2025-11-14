# 数据库初始化指南

## 前置要求

1. 确保已安装 PostgreSQL 数据库
2. 创建数据库（如果还没有）
3. 设置 `DATABASE_URL` 环境变量

## 设置环境变量

在项目根目录创建 `.env.local` 文件，添加以下内容：

```env
DATABASE_URL=postgresql://用户名:密码@主机:端口/数据库名
```

例如：
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/kanban_db
```

> **注意**: 初始化脚本会自动读取 `.env.local` 文件中的环境变量，无需手动设置系统环境变量。

## 初始化数据库

运行以下命令来初始化数据库：

```bash
npm run init-db
```

或者：

```bash
node scripts/init-db.js
```

## 脚本功能

初始化脚本会按顺序执行以下 SQL schema 文件：

1. **auth-schema.sql** - 创建认证相关表（users, accounts, sessions, verification_tokens）
2. **kanban-schema.sql** - 创建看板相关表（columns, tasks）
3. **automation-schema.sql** - 创建自动化规则表（automation_rules）

## 注意事项

- 如果表已存在，脚本会跳过创建并继续执行
- 脚本会自动显示所有已创建的表
- 确保数据库连接字符串正确，否则会报错

## 故障排除

如果遇到连接错误：
1. 检查 PostgreSQL 服务是否运行
2. 验证 `DATABASE_URL` 是否正确
3. 确认数据库用户有创建表的权限

