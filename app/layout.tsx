import './globals.css';
import type { Metadata } from 'next';
import { Inter, Caveat, Pacifico, Dancing_Script, Great_Vibes } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'PDF Contract Signing App',
  description: 'Sign PDF contracts with multiple signature options including mobile sync',
  openGraph: {
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-inter`}>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
