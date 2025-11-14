'use client';

import { signIn } from 'next-auth/react';
import { Button } from './ui/button';
import { useState } from 'react';
import { Input } from './ui/input';

type Provider = {
  id: string;
  name: string;
};

interface SignInFormProps {
  providers: Provider[];
  error?: string;
}

// NextAuth 错误代码的中文映射
const errorMessages: Record<string, string> = {
  Configuration: '服务器配置错误，请联系管理员',
  AccessDenied: '访问被拒绝',
  Verification: '验证失败，链接可能已过期',
  Default: '登录失败，请重试',
  Callback: '回调处理失败，可能是数据库连接问题，请检查服务器日志',
  OAuthAccountNotLinked: '此邮箱已被其他登录方式使用',
  OAuthSignin: 'OAuth 登录失败，请重试',
  OAuthCallback: 'OAuth 回调处理失败',
  OAuthCreateAccount: '创建账户失败',
  EmailCreateAccount: '创建邮箱账户失败',
  EmailSignin: '发送登录邮件失败',
  CredentialsSignin: '用户名或密码错误',
  SessionRequired: '请先登录',
};

export default function SignInForm({ providers, error }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const errorMessage = error ? errorMessages[error] || errorMessages.Default : null;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ marginTop: '-5rem' }}>
      <div className="p-10 bg-white rounded-lg shadow-xl w-full max-w-sm">
        <p className="text-center text-gray-600 mb-8">选择登录方式</p>
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errorMessage}</p>
            {error === 'Callback' && (
              <p className="text-xs text-red-500 mt-2">
                提示：请检查服务器控制台的错误日志，可能是数据库连接或表结构问题。
              </p>
            )}
          </div>
        )}
        <div className="space-y-4">
          {providers.map((provider) => {
            if (provider.id === 'email') {
              return (
                <div key={provider.id} className="flex flex-col space-y-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入邮箱"
                  />
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => signIn(provider.id, { email, callbackUrl: '/' })}
                    disabled={!email}
                  >
                    邮箱登录
                  </Button>
                </div>
              );
            }
            if (provider.id === 'google') {
              return (
                <Button
                  key={provider.id}
                  className="w-full"
                  variant="outline"
                  onClick={() => signIn(provider.id, { callbackUrl: '/' })}
                >
                  {provider.name} 登录
                </Button>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}
