"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/store/slices/authSlice";
import { Session } from "@supabase/supabase-js";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAppSelector(
    (state) => state.auth,
  );
  const dispatch = useAppDispatch();

  const router = useRouter();
  const pathname = usePathname();

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

      if (event === "TOKEN_REFRESHED") {
        // Token was refreshed successfully
      } else if (event === "SIGNED_OUT") {
        // User signed out
      } else if (event === "SIGNED_IN") {
        // User signed in successfully
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  useEffect(() => {
    if (!isLoading) {
      // Check if current path is an auth page
      const isAuthPage =
        pathname?.startsWith("/auth/") || pathname === "/login";
      const isApiPage = pathname?.startsWith("/api/");

      if ((!user || !isAuthenticated) && !isAuthPage && !isApiPage) {
        // Not authenticated and trying to access protected page
        setTimeout(() => {
          router.replace("/auth/login");
        }, 100);
      } else if (user && (isAuthPage || pathname === "/")) {
        // Authenticated and trying to access auth page or root page
        setTimeout(() => {
          router.replace("/");
        }, 100);
      }
    }
  }, [user, isLoading, pathname, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if current path is an auth page or API page
  const isAuthPage = pathname?.startsWith("/auth/") || pathname === "/login";
  const isApiPage = pathname?.startsWith("/api/");

  // For auth pages, render children if not authenticated
  if (isAuthPage) {
    if (!user) {
      return <>{children}</>;
    } else {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Redirecting to workspace...
            </p>
          </div>
        </div>
      );
    }
  }

  // For API pages, always render children
  if (isApiPage) {
    return <>{children}</>;
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
    return <>{children}</>;
  } else {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }
}
