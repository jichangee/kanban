import { Suspense } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import KanbanBoard from '@/components/KanbanBoard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ModernLoadingSpinner from '@/components/ModernLoadingSpinner';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="w-full h-full bg-[#0079bf] rounded-md">
      <Suspense fallback={
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-6">
            <ModernLoadingSpinner size="large" variant="default" />
            <div className="space-y-2">
              <h2 className="text-white/90 text-lg font-semibold">正在加载看板...</h2>
              <p className="text-white/60 text-sm">请稍候，我们正在为您准备最佳体验</p>
            </div>
          </div>
        </div>
      }>
        <KanbanBoard />
      </Suspense>
    </div>
  );
}
