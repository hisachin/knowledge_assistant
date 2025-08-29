import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { MainNav } from '@/components/layout/MainNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Chatbot Knowledge Base',
  description: 'AI-powered knowledge base with vector search',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <MainNav />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
