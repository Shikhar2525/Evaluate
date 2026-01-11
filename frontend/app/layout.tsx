import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import Navbar from '@/lib/components/navbar';

export const metadata: Metadata = {
  title: 'Evaluate - Interview Management',
  description: 'Professional interview management system',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="bg-slate-950">
        <Navbar />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
