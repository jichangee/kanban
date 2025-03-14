import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '看板应用 | Kanban Board',
  description: 'Next.js App Router Kanban Board Application with TypeScript',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className={`min-h-screen bg-gray-100 ${inter.className}`}>
        {children}
      </body>
    </html>
  );
}