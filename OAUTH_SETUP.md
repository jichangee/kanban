# Google OAuth 设置指南

## 问题描述

### 错误 400：redirect_uri_mismatch
这是最常见的 Google OAuth 错误，表示 Google Cloud Console 中配置的重定向 URI 与应用程序实际使用的 URI 不匹配。

### 其他常见错误
- `OAuthSignin` 错误：无法跳转到Google授权页面
- 环境变量缺失错误

## 解决方案

### 1. Google Cloud Console 配置

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择你的项目或创建新项目
3. 启用 **Google OAuth2 API**（不再需要 Google+ API，已废弃）
4. 在"凭据"页面创建"OAuth 2.0客户端ID"
5. 应用类型选择"Web应用"
6. **重要**：添加以下授权重定向URI（根据你的环境选择）：

   **生产环境（Vercel）：**
   ```
   https://your-domain.com/api/auth/callback/google
   ```
   例如：`https://kanban.moxuy.com/api/auth/callback/google`

   **本地开发环境：**
   ```
   http://localhost:3000/api/auth/callback/google
   ```
   如果使用其他端口，请相应修改（如 `http://localhost:3001/api/auth/callback/google`）

   **注意**：
   - URI 必须**完全匹配**，包括协议（http/https）、域名、端口和路径
   - 可以同时添加多个 URI（开发和生产环境）
   - 不要添加尾部斜杠
   - 确保没有多余的空格

### 2. 环境变量配置

#### 生产环境（Vercel）

在 Vercel 项目设置 → Environment Variables 中添加以下环境变量：

```bash
# NextAuth 配置（必须与你的实际域名匹配）
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-random-secret-key-至少32个字符

# Google OAuth 配置
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# 数据库配置
DATABASE_URL=your-database-connection-string
```

**重要提示**：
- `NEXTAUTH_URL` 必须与你的实际域名**完全匹配**（包括协议 https）
- 不要包含尾部斜杠
- `NEXTAUTH_SECRET` 可以使用以下命令生成：
  ```bash
  openssl rand -base64 32
  ```

#### 本地开发环境

创建 `.env.local` 文件（不要提交到 Git）：

```bash
# NextAuth 配置（开发环境会自动使用 localhost:3000）
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-local-secret-key

# Google OAuth 配置（可以使用与生产环境相同的凭据，或创建单独的开发凭据）
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# 数据库配置
DATABASE_URL=your-database-connection-string
```

**注意**：代码已更新，如果未设置 `NEXTAUTH_URL`，开发环境会自动使用 `http://localhost:3000`。

### 3. 环境变量检查

部署后，检查浏览器控制台是否有以下错误信息：
- Missing GOOGLE_CLIENT_ID environment variable
- Missing GOOGLE_CLIENT_SECRET environment variable
- Missing NEXTAUTH_SECRET environment variable
- Missing NEXTAUTH_URL environment variable

### 4. 解决 redirect_uri_mismatch 错误的步骤

1. **检查服务器日志**：
   - 启动应用后，查看控制台输出
   - 应该会看到类似这样的日志：
     ```
     [NextAuth] Using NEXTAUTH_URL: https://your-domain.com
     [NextAuth] Google callback URL (请在 Google Cloud Console 中添加此 URI):
       https://your-domain.com/api/auth/callback/google
     ```
   - 复制这个回调 URL

2. **在 Google Cloud Console 中添加 URI**：
   - 访问 [Google Cloud Console - 凭据](https://console.cloud.google.com/apis/credentials)
   - 点击你的 OAuth 2.0 客户端 ID
   - 在"已授权的重定向 URI"部分，点击"添加 URI"
   - 粘贴从服务器日志中复制的回调 URL
   - 确保 URI **完全匹配**（包括协议、域名、端口、路径）
   - 保存更改

3. **验证配置**：
   - 确保 Google Cloud Console 中的 URI 与服务器日志中的 URI 完全一致
   - 确保 `NEXTAUTH_URL` 环境变量与你的实际域名匹配
   - 清除浏览器缓存和 cookie
   - 重新尝试登录

### 5. 常见问题排查

1. **redirect_uri_mismatch 错误**：
   - ✅ 检查 Google Cloud Console 中的重定向 URI 是否与服务器日志中的完全匹配
   - ✅ 确保 `NEXTAUTH_URL` 环境变量正确设置
   - ✅ 检查 URI 中是否有尾部斜杠（不应该有）
   - ✅ 确保协议正确（http vs https）
   - ✅ 确保端口号正确（本地开发可能需要端口号）

2. **环境变量未设置**：
   - ✅ 确保所有必需的环境变量都在 Vercel 中正确设置
   - ✅ 检查 Vercel 环境变量是否区分了 Production、Preview 和 Development
   - ✅ 重新部署应用以使环境变量生效

3. **域名不匹配**：
   - ✅ 确保 `NEXTAUTH_URL` 与你的实际域名一致
   - ✅ 检查是否有重定向或代理改变了实际域名
   - ✅ 确保 Google Cloud Console 中的 URI 使用相同的域名

4. **本地开发问题**：
   - ✅ 确保在 Google Cloud Console 中添加了 `http://localhost:3000/api/auth/callback/google`
   - ✅ 如果使用其他端口，确保 URI 中的端口号正确
   - ✅ 检查 `.env.local` 文件是否存在且配置正确

### 6. 测试步骤

#### 本地开发环境测试

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 查看控制台输出，确认回调 URL：
   ```
   [NextAuth] Using NEXTAUTH_URL: http://localhost:3000
   [NextAuth] Google callback URL: http://localhost:3000/api/auth/callback/google
   ```

3. 确保 Google Cloud Console 中已添加此 URI

4. 清除浏览器缓存和 cookie

5. 访问 `http://localhost:3000/auth/signin` 并尝试 Google 登录

#### 生产环境测试

1. 在 Vercel 中设置所有必需的环境变量

2. 重新部署应用：
   ```bash
   git push origin main
   ```

3. 部署完成后，查看 Vercel 的部署日志，确认回调 URL

4. 确保 Google Cloud Console 中已添加生产环境的回调 URI

5. 清除浏览器缓存和 cookie

6. 访问生产环境并尝试 Google 登录

### 7. 调试技巧

- **查看服务器日志**：应用启动时会输出实际使用的回调 URL
- **检查浏览器网络请求**：在开发者工具的 Network 标签中查看 OAuth 请求
- **验证环境变量**：确保所有环境变量都已正确设置
- **使用 Google OAuth Playground**：可以测试 OAuth 配置是否正确

如果问题仍然存在，请检查：
- Vercel 的部署日志
- 浏览器控制台的错误信息
- Google Cloud Console 中的 OAuth 客户端配置
