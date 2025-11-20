import { AuthGuard } from '@/components/auth/auth-guard';
import { ReduxProvider } from '@/components/providers/redux-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { Analytics } from '@vercel/analytics/next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import type React from 'react';
import { Suspense } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Filynail IND Manager',
  description: 'Manage your INDs',
  generator: 'Filynail IND Manager',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <ReduxProvider>
            <ThemeProvider
              attribute='class'
              defaultTheme='system'
              enableSystem
              disableTransitionOnChange
            >
              <AuthGuard>{children}</AuthGuard>
            </ThemeProvider>
          </ReduxProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
