import type { Metadata } from 'next';
import './globals.css';
import { Analytics } from '@/components/Analytics';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://finalcode.dev';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'FinalCode - Build Apps with AI',
    template: '%s | FinalCode',
  },
  description: 'The AI-powered vibe coding platform. Describe what you want to build, and watch it come to life. Deploy instantly with one click.',
  keywords: [
    'coding',
    'AI',
    'vibe coding',
    'web development',
    'app builder',
    'AI code generator',
    'Claude AI',
    'web IDE',
    'code editor',
    'deploy',
    'cloudflare',
  ],
  authors: [{ name: 'FinalCode', url: siteUrl }],
  creator: 'FinalCode',
  publisher: 'FinalCode',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'FinalCode',
    title: 'FinalCode - Build Apps with AI',
    description: 'The AI-powered vibe coding platform. Describe what you want to build, and watch it come to life. Deploy instantly with one click.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FinalCode - AI-Powered Web Development',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FinalCode - Build Apps with AI',
    description: 'The AI-powered vibe coding platform. Describe what you want to build, and watch it come to life.',
    images: ['/og-image.png'],
    creator: '@finalcode',
  },
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-editor-bg text-editor-text antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
