import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import LayoutManager from '@/components/LayoutManager';
import { Inter } from 'next/font/google';
import { getSettings, StoreSettings } from '@/actions/settings-actions';

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.storeName,
    description: `Peça suas bebidas favoritas de ${settings.storeName}`,
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
        <AuthProvider>
          <LayoutManager settings={settings}>
            {children}
          </LayoutManager>
        </AuthProvider>
      </body>
    </html>
  );
}
