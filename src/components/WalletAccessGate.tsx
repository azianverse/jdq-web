'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { isPublicPage } from '@/lib/public-routes';
import { isTravelerSession } from '@/lib/traveler-session';

export function WalletAccessGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, sessionUnavailable, retrySession, loginAsGuest } = useAuth();
  const publicPage = isPublicPage(pathname);
  const hasWallet = isTravelerSession(user);

  useEffect(() => {
    if (!publicPage && !isLoading && !sessionUnavailable && !hasWallet) {
      const destination = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?redirect=${encodeURIComponent(destination)}`);
    }
  }, [publicPage, isLoading, sessionUnavailable, hasWallet, router]);

  if (!publicPage && sessionUnavailable) {
    return (
      <main id="main-content" className="grid min-h-[60vh] place-items-center p-6">
        <div role="alert" className="w-full max-w-md rounded-2xl border border-[var(--color-border-subtle)] bg-white p-6 sm:p-8 text-center shadow-md">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xl mx-auto mb-3">
            🧭
          </div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Connection unavailable</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            We could not verify your session right now. For local testing, you can sign in directly as a guest explorer.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={retrySession}
              className="w-full sm:w-auto min-h-11 rounded-xl bg-[var(--color-border-subtle)] hover:bg-[var(--color-border-default)] px-4 py-2 font-semibold text-[var(--color-text-primary)] transition-colors cursor-pointer"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => void loginAsGuest(true)}
              className="w-full sm:w-auto min-h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 px-5 py-2 font-bold text-white shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🌿 Sign in as Guest (Testing)</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!publicPage && (isLoading || !hasWallet)) {
    return (
      <main id="main-content" className="grid min-h-[60vh] place-items-center p-6 text-sm text-[var(--color-text-secondary)]" role="status">
        <div className="w-full max-w-md rounded-2xl border border-[var(--color-border-subtle)] bg-white p-6 sm:p-8 text-center shadow-md space-y-4">
          <p className="font-semibold text-stone-700">
            {isLoading ? 'Restoring your wallet session…' : 'Sign-in required to access expedition hubs.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => void loginAsGuest(true)}
              className="w-full sm:w-auto min-h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 px-5 py-2 font-bold text-white shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🌿 Sign in as Guest (Testing)</span>
            </button>
            <button
              type="button"
              onClick={() => router.push(`/login?redirect=${encodeURIComponent(pathname)}`)}
              className="w-full sm:w-auto min-h-11 rounded-xl border border-stone-200 hover:bg-stone-50 px-4 py-2 font-semibold text-stone-700 transition-colors cursor-pointer"
            >
              Go to Login
            </button>
          </div>
        </div>
      </main>
    );
  }
  return <>{children}</>;
}
