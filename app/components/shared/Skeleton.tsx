import React from 'react';

function SkeletonBlock({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded-xl bg-[var(--surface-tertiary)] ${className}`} style={style} />;
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-7 w-16" />
          <SkeletonBlock className="h-3 w-32" />
        </div>
        <SkeletonBlock className="h-10 w-10 shrink-0" />
      </div>
    </div>
  );
}

export function ChartCardSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <SkeletonBlock className="h-4 w-36 mb-4" />
      <SkeletonBlock className="w-full" style={{ height }} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between mb-4">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-3 w-16" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3 pb-2 border-b border-[var(--border)]">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-3 w-16 ml-auto" />
          <SkeletonBlock className="h-3 w-16" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-1">
            <div className="flex items-center gap-2 flex-1">
              <SkeletonBlock className="h-6 w-6 rounded-full" />
              <SkeletonBlock className="h-3 w-28" />
            </div>
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-3 w-16 ml-auto" />
            <SkeletonBlock className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <SkeletonBlock className="h-7 w-36" />
        <SkeletonBlock className="h-4 w-56 mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
      <TableSkeleton />
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <SkeletonBlock className="h-7 w-32" />
          <SkeletonBlock className="h-4 w-48 mt-2" />
        </div>
        <SkeletonBlock className="h-9 w-72 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <ChartCardSkeleton height={350} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </div>
  );
}

export function StaffDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <SkeletonBlock className="h-7 w-44" />
        <SkeletonBlock className="h-4 w-56 mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="space-y-2 flex-1">
                <SkeletonBlock className="h-3 w-28" />
                <SkeletonBlock className="h-3 w-36" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
      <TableSkeleton />
    </div>
  );
}
