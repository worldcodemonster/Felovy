import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/shared/Providers';
import { FlowerCanvas } from '@/components/shared/FlowerCanvas';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'Felovy — For Every Life, Our Value Yields',
  description:
    'Felovy is a Software Development outsourcing company connecting global clients with top developers. Find your high-paying job or perfect developer today.',
  keywords: 'software development, outsourcing, developer jobs, hire developers, freelancing',
  openGraph: {
    title: 'Felovy — For Every Life, Our Value Yields',
    description: 'Connect with top developers and global clients on Felovy.',
    images: ['/logo.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        {/* <FlowerCanvas /> */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
