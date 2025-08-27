# Google OAuth 设置指南

## 问题描述
部署到Vercel后，点击Google登录出现 `OAuthSignin` 错误，无法跳转到Google授权页面。

## 解决方案

### 1. Google Cloud Console 配置

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择你的项目或创建新项目
3. 启用 Google+ API 和 Google OAuth2 API
4. 在"凭据"页面创建"OAuth 2.0客户端ID"
5. 应用类型选择"Web应用"
6. 添加以下授权重定向URI：
   ```
   https://kanban.moxuy.com/api/auth/callback/google
   ```

### 2. Vercel 环境变量配置

在Vercel项目设置中添加以下环境变量：

```bash
# NextAuth 配置
NEXTAUTH_URL=https://kanban.moxuy.com
NEXTAUTH_SECRET=your-random-secret-key

# Google OAuth 配置
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# 数据库配置
KANBAN_DATABASE_URL=your-database-connection-string
```

### 3. 环境变量检查

部署后，检查浏览器控制台是否有以下错误信息：
- Missing GOOGLE_CLIENT_ID environment variable
- Missing GOOGLE_CLIENT_SECRET environment variable
- Missing NEXTAUTH_SECRET environment variable
- Missing NEXTAUTH_URL environment variable

### 4. 常见问题

1. **重定向URI不匹配**：确保Google Cloud Console中的重定向URI与你的域名完全匹配
2. **环境变量未设置**：确保所有必需的环境变量都在Vercel中正确设置
3. **域名不匹配**：确保NEXTAUTH_URL与你的实际域名一致

### 5. 测试步骤

1. 重新部署到Vercel
2. 清除浏览器缓存和cookie
3. 尝试Google登录
4. 检查浏览器控制台的错误信息

如果问题仍然存在，请检查Vercel的部署日志以获取更多调试信息。
