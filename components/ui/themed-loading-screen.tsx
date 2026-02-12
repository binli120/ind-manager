// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { APP_BUILD_NUMBER, APP_NAME } from '@/lib/app-info';
import { cn } from '@/lib/utils';

interface ThemedLoadingScreenProps {
  message?: string;
  detail?: string;
  className?: string;
  fullScreen?: boolean;
}

export function ThemedLoadingScreen({
  message = 'Loading...',
  detail = `Preparing ${APP_NAME} (Build ${APP_BUILD_NUMBER})`,
  className,
  fullScreen = true,
}: ThemedLoadingScreenProps) {
  return (
    <div
      className={cn(
        'relative flex w-full items-center justify-center overflow-hidden text-white',
        fullScreen ? 'min-h-screen' : 'h-full min-h-[18rem]',
        className
      )}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/pharmacokinetic-profile-line-graph.jpg')" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-cyan-950/80 to-emerald-950/85" aria-hidden />

      <div className="relative z-10 mx-6 w-full max-w-lg rounded-2xl border border-white/15 bg-slate-950/45 p-6 shadow-2xl backdrop-blur-md">
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cyan-100/90">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
          <span>IND and Pharmaceutical Workspace</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-9 w-9 rounded-full border-2 border-cyan-200/40 border-t-cyan-100 animate-spin" />
          <div className="space-y-1">
            <p className="text-lg font-semibold leading-tight">{message}</p>
            <p className="text-sm text-slate-100/85">{detail}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
