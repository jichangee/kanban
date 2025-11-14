import { type AuthOptions } from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import PostgresAdapter from "@auth/pg-adapter";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";

// 自动检测并设置 NEXTAUTH_URL
// 在开发环境中，如果没有设置 NEXTAUTH_URL，使用 localhost
// 在生产环境中，必须设置 NEXTAUTH_URL 环境变量
if (!process.env.NEXTAUTH_URL) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 3000;
    process.env.NEXTAUTH_URL = `http://localhost:${port}`;
    console.log(`[NextAuth] Auto-detected NEXTAUTH_URL for development: ${process.env.NEXTAUTH_URL}`);
  } else {
    console.error('[NextAuth] NEXTAUTH_URL must be set in production environment');
  }
}

// Debug: Check if required environment variables are set
if (!process.env.GOOGLE_CLIENT_ID) {
  console.error('Missing GOOGLE_CLIENT_ID environment variable');
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  console.error('Missing GOOGLE_CLIENT_SECRET environment variable');
}
if (!process.env.NEXTAUTH_SECRET) {
  console.error('Missing NEXTAUTH_SECRET environment variable');
}
if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL environment variable');
}

// 显示实际使用的回调 URL，方便调试和配置 Google OAuth
if (process.env.NEXTAUTH_URL) {
  console.log(`[NextAuth] Using NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);
  console.log(`[NextAuth] Google callback URL (请在 Google Cloud Console 中添加此 URI):`);
  console.log(`  ${process.env.NEXTAUTH_URL}/api/auth/callback/google`);
}

// 创建自定义 adapter 包装器，确保用户 ID 正确生成
const baseAdapter = PostgresAdapter(db) as Adapter;

const customAdapter: Adapter = {
  ...baseAdapter,
  async createUser(user: Omit<AdapterUser, "id"> & { id?: string }): Promise<AdapterUser> {
    // 生成用户 ID（如果还没有）
    const userId = user.id || randomUUID();
    
    // 直接使用 SQL 插入用户，确保 ID 正确设置
    // 这样可以避免 @auth/pg-adapter 可能忽略传入 ID 的问题
    try {
      await db.query(
        `INSERT INTO "users" (id, name, email, "emailVerified", image) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          user.name || null,
          user.email || null,
          user.emailVerified || null,
          user.image || null,
        ]
      );

      // 返回创建的用户对象
      const result = await db.query(
        'SELECT * FROM "users" WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Failed to create user');
      }

      const createdUser = result.rows[0];
      return {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        emailVerified: createdUser.emailVerified ? new Date(createdUser.emailVerified) : null,
        image: createdUser.image,
      };
    } catch (error: any) {
      // 如果用户已存在（例如通过 email），尝试查找并返回
      if (error.code === '23505' && user.email) {
        const result = await db.query(
          'SELECT * FROM "users" WHERE email = $1',
          [user.email]
        );
        if (result.rows.length > 0) {
          const existingUser = result.rows[0];
          return {
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email,
            emailVerified: existingUser.emailVerified ? new Date(existingUser.emailVerified) : null,
            image: existingUser.image,
          };
        }
      }
      throw error;
    }
  },
};

export const authOptions: AuthOptions = {
  // Use the Postgres adapter to connect to our Neon database.
  // 重用 lib/db.ts 中的连接池，避免重复创建
  adapter: customAdapter,
  // Add secret for production
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    // Configure Google OAuth provider.
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    // Configure Email provider for passwordless login.
    EmailProvider({
      // For development, we log the sign-in link to the console.
      // In production, you would configure a real email service here.
      sendVerificationRequest({ identifier: email, url }) {
        console.log(`Sign-in link for ${email}: ${url}`);
      },
      from: "no-reply@example.com", // This is required but not used when overriding sendVerificationRequest.
    }),
  ],
  session: {
    // 使用数据库会话策略（与 adapter 配合使用）
    // 如果使用 adapter，应该使用数据库会话，而不是 JWT
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    // 处理登录回调，添加错误处理和调试信息
    async signIn({ user, account, profile }) {
      try {
        console.log('[NextAuth] SignIn callback:', {
          userId: user.id,
          email: user.email,
          provider: account?.provider,
        });
        return true;
      } catch (error) {
        console.error('[NextAuth] SignIn callback error:', error);
        return false;
      }
    },
    // 处理会话回调，添加用户 ID 到会话对象
    async session({ session, user }) {
      try {
        if (user && session.user) {
          (session.user as any).id = user.id;
        }
        return session;
      } catch (error) {
        console.error('[NextAuth] Session callback error:', error);
        return session;
      }
    },
  },
  pages: {
    // We will create custom pages for these routes.
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request", // Used for email sign-in flow.
    error: "/auth/signin", // 错误页面也重定向到登录页
  },
  // 添加调试选项
  debug: process.env.NODE_ENV === 'development',
  events: {
    // 添加事件监听，用于调试
    async signIn(message) {
      console.log('[NextAuth] SignIn event:', message);
    },
    async signOut(message) {
      console.log('[NextAuth] SignOut event:', message);
    },
    async createUser(message) {
      console.log('[NextAuth] CreateUser event:', message);
    },
    async updateUser(message) {
      console.log('[NextAuth] UpdateUser event:', message);
    },
    async linkAccount(message) {
      console.log('[NextAuth] LinkAccount event:', message);
    },
    async session(message) {
      console.log('[NextAuth] Session event:', message);
    },
  },
};
