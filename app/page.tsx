import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import KanbanBoard from '@/components/KanbanBoard';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="w-full h-full bg-[#0079bf] rounded-md">
      <KanbanBoard />
    </div>
  );
}
