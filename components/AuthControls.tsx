'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { Button } from './ui/button';

export default function AuthControls() {
  const { data: session } = useSession();

  if (session && session.user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {session.user.image && (
          <img
            src={session.user.image}
            alt={session.user.name || 'User avatar'}
            style={{ width: '32px', height: '32px', borderRadius: '50%' }}
          />
        )}
        <span>{session.user.name}</span>
        <Button variant="outline" onClick={() => signOut()}>
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => signIn()}>
      登录
    </Button>
  );
}
