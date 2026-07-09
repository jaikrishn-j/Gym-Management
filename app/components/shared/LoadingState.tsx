'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Shimmer animation keyframes are defined via Tailwind - we use a CSS approach
// The shimmer effect uses a gradient sweep via inline style

function SkeletonBlock({ className = '', style, delay = 0 }: { className?: string; style?: React.CSSProperties; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' as const }}
      className={`relative overflow-hidden rounded-xl bg-[var(--surface-tertiary)] ${className}`}
      style={style}
    >
      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
        }}
      />
    </motion.div>
  );
}

export function PageLoading() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/10"
      >
        <Loader2 className="h-6 w-6 text-[var(--accent)]" />
      </motion.div>
      {/* Pulsing ring */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute h-20 w-20 rounded-full border-2 border-[var(--accent)]/20"
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm font-medium text-[var(--muted)]"
      >
        Loading...
      </motion.p>
    </motion.div>
  );
}

export function PageLoadingSlim() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center py-12"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className="h-5 w-5 text-[var(--accent)]" />
      </motion.div>
    </motion.div>
  );
}

export function ButtonLoading({ className = '' }: { className?: string }) {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <Loader2 className={`h-4 w-4 ${className}`} />
    </motion.span>
  );
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

export function CardGridSkeleton({ count = 6, columns = 3 }: { count?: number; columns?: number }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns} gap-6`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div key={i} variants={staggerItem} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-center justify-between mb-4">
            <SkeletonBlock className="h-14 w-14 rounded-xl" delay={i * 0.03} />
            <SkeletonBlock className="h-6 w-20 rounded-full" delay={i * 0.03} />
          </div>
          <SkeletonBlock className="h-5 w-3/4 mb-2" delay={i * 0.03} />
          <SkeletonBlock className="h-4 w-full mb-1" delay={i * 0.03} />
          <SkeletonBlock className="h-4 w-1/2 mb-4" delay={i * 0.03} />
          <div className="space-y-2">
            <SkeletonBlock className="h-3.5 w-24" delay={i * 0.03} />
            <SkeletonBlock className="h-3.5 w-32" delay={i * 0.03} />
            <SkeletonBlock className="h-3.5 w-28" delay={i * 0.03} />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

export function FormSkeleton() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      <motion.div variants={staggerItem} className="flex items-center gap-3 mb-6">
        <SkeletonBlock className="h-10 w-10 rounded-xl" />
        <div className="space-y-2">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-3.5 w-56" />
        </div>
      </motion.div>
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div key={i} variants={staggerItem} className="space-y-1.5">
          <SkeletonBlock className="h-3.5 w-24" />
          <SkeletonBlock className="h-11 w-full rounded-xl" />
        </motion.div>
      ))}
      <motion.div variants={staggerItem} className="flex justify-end gap-3 pt-2">
        <SkeletonBlock className="h-10 w-20 rounded-xl" />
        <SkeletonBlock className="h-10 w-28 rounded-xl" />
      </motion.div>
    </motion.div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
    >
      <motion.div variants={staggerItem} className="flex items-center justify-between mb-4">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-8 w-20 rounded-xl" />
      </motion.div>
      <div className="space-y-3">
        <motion.div variants={staggerItem} className="flex items-center gap-3 pb-2 border-b border-[var(--border)]">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-3 w-16 ml-auto" />
        </motion.div>
        {Array.from({ length: rows }).map((_, i) => (
          <motion.div key={i} variants={staggerItem} className="flex items-center gap-3 py-1">
            <div className="flex items-center gap-2 flex-1">
              <SkeletonBlock className="h-6 w-6 rounded-full" />
              <SkeletonBlock className="h-3 w-28" />
            </div>
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-3 w-16 ml-auto" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function StatCardSkeleton() {
  return (
    <motion.div
      variants={staggerItem}
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-7 w-16" />
          <SkeletonBlock className="h-3 w-32" />
        </div>
        <SkeletonBlock className="h-10 w-10 shrink-0 rounded-xl" />
      </div>
    </motion.div>
  );
}

export function ChartCardSkeleton({ height = 280 }: { height?: number }) {
  return (
    <motion.div variants={staggerItem} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <SkeletonBlock className="h-4 w-36 mb-4" />
      <SkeletonBlock className="w-full rounded-xl" style={{ height }} />
    </motion.div>
  );
}

export function DashboardSkeleton() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={staggerItem}>
        <SkeletonBlock className="h-7 w-36" />
        <SkeletonBlock className="h-4 w-56 mt-2" />
      </motion.div>
      <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </motion.div>
      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </motion.div>
      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </motion.div>
      <motion.div variants={staggerItem}>
        <TableSkeleton />
      </motion.div>
    </motion.div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <SkeletonBlock className="h-7 w-32" />
          <SkeletonBlock className="h-4 w-48 mt-2" />
        </div>
        <SkeletonBlock className="h-9 w-72 rounded-xl" />
      </motion.div>
      <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </motion.div>
      <motion.div variants={staggerItem}>
        <ChartCardSkeleton height={350} />
      </motion.div>
      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </motion.div>
    </motion.div>
  );
}

export function StaffDashboardSkeleton() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={staggerItem}>
        <SkeletonBlock className="h-7 w-44" />
        <SkeletonBlock className="h-4 w-56 mt-2" />
      </motion.div>
      <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </motion.div>
      <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
      </motion.div>
      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </motion.div>
      <motion.div variants={staggerItem}>
        <TableSkeleton />
      </motion.div>
    </motion.div>
  );
}