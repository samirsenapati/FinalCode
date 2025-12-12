import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FinalCode - Build Apps with AI',
  description: 'The AI-powered vibe coding platform. Describe what you want to build, and watch it come to life.',
  keywords: ['coding', 'AI', 'vibe coding', 'web development', 'app builder'],
  authors: [{ name: 'FinalCode' }],
  openGraph: {
    title: 'FinalCode - Build Apps with AI',
    description: 'The AI-powered vibe coding platform. Describe what you want to build, and watch it come to life.',
    type: 'website',
  },
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
      </body>
    </html>
  );
}
