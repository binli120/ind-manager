// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import { AuthGuard } from '@/components/auth/auth-guard';
import { ReduxProvider } from '@/components/providers/redux-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { WorkspaceLayout } from '@/components/workspace-layout';
import { Analytics } from '@vercel/analytics/react';
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
    <html lang='en' suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}
      >
        <Suspense fallback={null}>
          <ReduxProvider>
            <ThemeProvider
              attribute='class'
              defaultTheme='system'
              enableSystem
              disableTransitionOnChange
            >
              <AuthGuard>
                <WorkspaceLayout>{children}</WorkspaceLayout>
              </AuthGuard>
            </ThemeProvider>
          </ReduxProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
