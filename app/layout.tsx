import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/AuthProvider';
import AuthControls from '@/components/AuthControls';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={`min-h-screen bg-gray-100 ${inter.className}`}>
        <AuthProvider>
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}