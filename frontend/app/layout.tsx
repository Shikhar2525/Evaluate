import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import Navbar from '@/lib/components/navbar';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://evaluate.app';

export const metadata: Metadata = {
  title: 'Evaluate - Professional Interview Management System',
  description: 'Streamline your interview process with Evaluate. Create, manage, and conduct professional interviews with advanced templates and feedback tools.',
  keywords: ['interview management', 'hiring tools', 'interview templates', 'candidate evaluation', 'recruitment software', 'interview platform'],
  authors: [{ name: 'Evaluate Team' }],
  creator: 'Evaluate',
  publisher: 'Evaluate',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'Evaluate',
    title: 'Evaluate - Professional Interview Management System',
    description: 'Streamline your interview process with Evaluate. Create, manage, and conduct professional interviews with advanced templates and feedback tools.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Evaluate - Interview Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Evaluate - Professional Interview Management System',
    description: 'Streamline your interview process with advanced templates and feedback tools',
    images: ['/og-image.png'],
    creator: '@evaluate',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    minimumScale: 1,
    userScalable: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Evaluate" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Evaluate',
              description: 'Professional Interview Management System',
              url: baseUrl,
              applicationCategory: 'BusinessApplication',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              creator: {
                '@type': 'Organization',
                name: 'Evaluate',
                url: baseUrl,
              },
            }),
          }}
        />
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
