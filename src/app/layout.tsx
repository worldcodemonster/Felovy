import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/shared/Providers';
import { AppOverlays } from '@/components/shared/AppOverlays';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Felovy, For Every Life, Our Value Yields',
  description:
    'Felovy is a Software Development outsourcing company connecting global clients with top developers. Find your high-paying job or perfect developer today.',
  keywords: 'software development, outsourcing, developer jobs, hire developers, freelancing',
  openGraph: {
    title: 'Felovy, For Every Life, Our Value Yields',
    description: 'Connect with top developers and global clients on Felovy.',
    images: ['/logo.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css"
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
        <div id="felovy-overlays">
          <AppOverlays />
        </div>
      </body>
    </html>
  );
}
