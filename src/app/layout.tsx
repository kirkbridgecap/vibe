import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vibe',
  description: 'Find the perfect gift in seconds.',
  icons: {
    icon: '/icon',
  },
};

import { Providers } from '@/components/Providers';
import { BottomNav } from '@/components/BottomNav';

// ... (keep existing imports)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={cn(inter.className, "bg-zinc-950 text-white min-h-screen flex flex-col overflow-hidden")}>
        <Providers>
          {children}
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
