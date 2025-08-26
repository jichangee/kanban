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
}

export default function SignInForm({ providers }: SignInFormProps) {
  const [email, setEmail] = useState('');
  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ marginTop: '-5rem' }}>
      <div className="p-10 bg-white rounded-lg shadow-xl w-full max-w-sm">
        <p className="text-center text-gray-600 mb-8">选择登录方式</p>
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
