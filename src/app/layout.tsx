import type { Metadata } from 'next';
import './globals.css';
import LayoutManager from '@/components/LayoutManager';
import { Inter } from 'next/font/google';
import { getSettings, StoreSettings } from '@/actions/settings-actions';
import { getActiveHighlights } from '@/actions/highlight-actions';
import { Providers } from '@/context/Providers';

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const highlights = await getActiveHighlights();
  const firstHighlightImage = highlights.length > 0 ? highlights[0].imageUrl : undefined;

  const title = settings.storeName;
  const description = `Peça suas bebidas favoritas de ${settings.storeName}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002',
      images: firstHighlightImage ? [{ url: firstHighlightImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: firstHighlightImage ? [firstHighlightImage] : [],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings: StoreSettings = await getSettings();

  return (
    <html lang="en" className='dark'>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <Providers>
          <LayoutManager settings={settings}>
            {children}
          </LayoutManager>
        </Providers>
      </body>
    </html>
  );
}
