'use client';

import { useAppDispatch, useAppSelector } from '@/lib/store';
import { getCurrentUser, logoutUser } from '@/lib/store/slices/authSlice';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Session } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const parseEnvNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const IDLE_TIMEOUT_MINUTES = parseEnvNumber(
  process.env.NEXT_PUBLIC_SESSION_IDLE_TIMEOUT_MINUTES,
  30,
);
const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;
const RAW_WARNING_SECONDS = parseEnvNumber(
  process.env.NEXT_PUBLIC_SESSION_WARNING_SECONDS,
  60,
);
const WARNING_SECONDS = Math.min(
  RAW_WARNING_SECONDS,
  Math.max(1, Math.floor(IDLE_TIMEOUT_MS / 1000)),
);
const WARNING_TIMEOUT_MS = Math.max(0, IDLE_TIMEOUT_MS - WARNING_SECONDS * 1000);

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );
  const dispatch = useAppDispatch();

  const router = useRouter();
  const pathname = usePathname();
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(WARNING_SECONDS);
  const warningTimeoutRef = useRef<number | null>(null);
  const logoutTimeoutRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (warningTimeoutRef.current !== null) {
      window.clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (logoutTimeoutRef.current !== null) {
      window.clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
    }
    setCountdownSeconds(WARNING_SECONDS);
    countdownIntervalRef.current = window.setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current !== null) {
            window.clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleLogout = useCallback(() => {
    setShowTimeoutDialog(false);
    clearTimers();
    dispatch(logoutUser());
  }, [clearTimers, dispatch]);

  const startTimers = useCallback(() => {
    clearTimers();
    warningTimeoutRef.current = window.setTimeout(() => {
      setShowTimeoutDialog(true);
      startCountdown();
    }, WARNING_TIMEOUT_MS);
    logoutTimeoutRef.current = window.setTimeout(() => {
      handleLogout();
    }, IDLE_TIMEOUT_MS);
  }, [clearTimers, handleLogout, startCountdown]);

  const resetTimers = useCallback(() => {
    setShowTimeoutDialog(false);
    startTimers();
  }, [startTimers]);

  const handleStaySignedIn = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  useEffect(() => {
    const supabase = createClient();

    const getInitialSession = async () => {
      dispatch(getCurrentUser());
    };

    getInitialSession();

    let curSession: Session | null;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Avoid reload on tab refocus
      if (curSession?.user?.id === session?.user?.id) {
        return;
      }
      curSession = session;

      dispatch(getCurrentUser());

      if (event === 'TOKEN_REFRESHED') {
        // Token was refreshed successfully
      } else if (event === 'SIGNED_OUT') {
        // User signed out
      } else if (event === 'SIGNED_IN') {
        // User signed in successfully
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  useEffect(() => {
    if (!user || !isAuthenticated) {
      clearTimers();
      setShowTimeoutDialog(false);
      return;
    }

    startTimers();

    return () => {
      clearTimers();
    };
  }, [clearTimers, isAuthenticated, startTimers, user]);

  useEffect(() => {
    if (!isLoading) {
      // Check if current path is an auth page
      const isAuthPage =
        pathname?.startsWith('/auth/') || pathname === '/login';
      const isApiPage = pathname?.startsWith('/api/');
      const isResetPage = pathname?.startsWith('/auth/reset-password');

      if ((!user || !isAuthenticated) && !isAuthPage && !isApiPage) {
        // Not authenticated and trying to access protected page
        setTimeout(() => {
          router.replace('/auth/login');
        }, 100);
      } else if (user && (isAuthPage || pathname === '/') && !isResetPage) {
        // Authenticated and trying to access auth page or root page
        setTimeout(() => {
          router.replace('/');
        }, 100);
      }
    }
  }, [user, isAuthenticated, isLoading, pathname, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <>
        <div className='min-h-screen flex items-center justify-center bg-background'>
          <div className='flex flex-col items-center space-y-4'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
            <p className='text-sm text-muted-foreground'>Loading...</p>
          </div>
        </div>
        <SessionTimeoutDialog
          open={showTimeoutDialog}
          countdownSeconds={countdownSeconds}
          onStay={handleStaySignedIn}
        />
      </>
    );
  }

  // Check if current path is an auth page or API page
  const isAuthPage = pathname?.startsWith('/auth/') || pathname === '/login';
  const isResetPage = pathname?.startsWith('/auth/reset-password') && user;
  const isApiPage = pathname?.startsWith('/api/');

  // For auth pages, render children if not authenticated
  if (isAuthPage && !isResetPage) {
    if (!user) {
      return (
        <>
          {children}
          <SessionTimeoutDialog
            open={showTimeoutDialog}
            countdownSeconds={countdownSeconds}
            onStay={handleStaySignedIn}
          />
        </>
      );
    } else {
      return (
        <>
          <div className='min-h-screen flex items-center justify-center bg-background'>
            <div className='flex flex-col items-center space-y-4'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
              <p className='text-sm text-muted-foreground'>
                Redirecting to workspace...
              </p>
            </div>
          </div>
          <SessionTimeoutDialog
            open={showTimeoutDialog}
            countdownSeconds={countdownSeconds}
            onStay={handleStaySignedIn}
          />
        </>
      );
    }
  }

  // For API pages, always render children
  if (isApiPage) {
    return (
      <>
        {children}
        <SessionTimeoutDialog
          open={showTimeoutDialog}
          countdownSeconds={countdownSeconds}
          onStay={handleStaySignedIn}
        />
      </>
    );
  }

  // For root page, redirect authenticated users
  // if (pathname === "/") {
  //   if (user) {
  //     return (
  //       <div className="min-h-screen flex items-center justify-center bg-background">
  //         <div className="flex flex-col items-center space-y-4">
  //           <Loader2 className="h-8 w-8 animate-spin text-primary" />
  //           <p className="text-sm text-muted-foreground">
  //             Redirecting to workspace...
  //           </p>
  //         </div>
  //       </div>
  //     );
  //   } else {
  //     return <>{children}</>; // Show root page for unauthenticated users
  //   }
  // }

  // For protected pages, render children if authenticated
  if (user) {
    return (
      <>
        {children}
        <SessionTimeoutDialog
          open={showTimeoutDialog}
          countdownSeconds={countdownSeconds}
          onStay={handleStaySignedIn}
        />
      </>
    );
  } else {
    return (
      <>
        <div className='min-h-screen flex items-center justify-center bg-background'>
          <div className='flex flex-col items-center space-y-4'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
            <p className='text-sm text-muted-foreground'>
              Redirecting to login...
            </p>
          </div>
        </div>
        <SessionTimeoutDialog
          open={showTimeoutDialog}
          countdownSeconds={countdownSeconds}
          onStay={handleStaySignedIn}
        />
      </>
    );
  }
}

function SessionTimeoutDialog({
  open,
  countdownSeconds,
  onStay,
}: {
  open: boolean;
  countdownSeconds: number;
  onStay: () => void;
}) {
  const minutes = Math.floor(countdownSeconds / 60);
  const seconds = String(countdownSeconds % 60).padStart(2, '0');

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Session timeout</DialogTitle>
          <DialogDescription>
            You have been inactive. You will be logged out in{' '}
            <span className='font-medium text-foreground'>
              {minutes}:{seconds}
            </span>
            .
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onStay}>Stay</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
