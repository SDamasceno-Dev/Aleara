import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { DialogProvider } from '@/components/dialog';
import { Footer } from '@/components/footer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Aleara — Plataforma SaaS',
  description: 'Construa e cresça seu negócio com a Aleara.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='pt-BR' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DialogProvider>
          <div className='h-dvh bg-background text-foreground flex flex-col relative overflow-hidden'>
            {/* Global background layers */}
            <div aria-hidden className='login-bg' />
            <div aria-hidden className='login-aurora' />
            <div aria-hidden className='prism-lines' />
            <main className='flex-1 min-h-0 overflow-hidden'>{children}</main>
            <Footer />
          </div>
        </DialogProvider>
      </body>
    </html>
  );
}
