// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import { AuthGuard } from '@/components/auth/auth-guard';
import { ReduxProvider } from '@/components/providers/redux-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemedLoadingScreen } from '@/components/ui/themed-loading-screen';
import { WorkspaceLayout } from '@/components/workspace-layout';
import { APP_NAME, APP_TITLE_WITH_BUILD } from '@/lib/app-info';
import { Analytics } from '@vercel/analytics/react';
import { IBM_Plex_Mono, Manrope, Source_Serif_4 } from 'next/font/google';
import type { Metadata } from 'next';
import type React from 'react';
import { Suspense } from 'react';
import './globals.css';

const uiSans = Manrope({
  subsets: ['latin'],
  variable: '--font-ui-sans',
  weight: ['200', '300', '400', '500', '600', '700'],
  display: 'swap',
});

const uiMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-ui-mono',
  weight: ['400', '500', '600'],
  display: 'swap',
});

const editorSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-editor',
  display: 'swap',
});

export const metadata: Metadata = {
  title: APP_TITLE_WITH_BUILD,
  description: 'Manage your INDs',
  generator: APP_NAME,
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
        className={`font-sans ${uiSans.variable} ${uiMono.variable} ${editorSerif.variable}`}
      >
        <Suspense
          fallback={
            <ThemedLoadingScreen
              message="Loading workspace..."
              detail="Preparing IND modules and pharmaceutical assets."
            />
          }
        >
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
