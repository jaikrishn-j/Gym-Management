'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

export default function StaffError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Staff area error</h2>
        <p className="text-sm text-[var(--muted)] mb-6">
          {error.message || 'Failed to load this staff page. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
