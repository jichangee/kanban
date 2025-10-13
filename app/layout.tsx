import type { Metadata } from 'next';
import './globals.css';
import AuthProvider from '@/components/AuthProvider';
import AuthControls from '@/components/AuthControls';

export const metadata: Metadata = {
  title: '看板应用 | Kanban Board',
  description: 'Next.js App Router Kanban Board Application with TypeScript',
  icons: {
    icon: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans">
        <AuthProvider>
          <main className="relative">
            {/* Global loading overlay */}
            <div id="global-loading" className="hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center space-y-4 border border-gray-200 shadow-xl">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-700 text-sm font-medium">加载中...</p>
              </div>
            </div>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}