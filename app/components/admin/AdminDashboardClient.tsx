'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, IndianRupee, CalendarCheck, Activity, AlertCircle,
  ChevronRight, CreditCard, BarChart3, ClipboardList
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import {
  getDashboardStats, getMonthlyRevenue, getMemberGrowth,
  getPlanDistribution, getRecentPayments, getAttendanceTrend,
  getPaymentMethodBreakdown, DashboardStats, MonthlyRevenue,
  MemberGrowth, PlanDistribution, RecentPayment, AttendanceTrend,
  PaymentMethodStats
} from '@/app/admin/dashboard/action';
import { DashboardSkeleton } from '@/app/components/shared/Skeleton';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const ANALYTICS_TABS = [
  { key: 'members', label: 'Members', icon: Users },
  { key: 'revenue', label: 'Revenue', icon: IndianRupee },
  { key: 'attendance', label: 'Attendance', icon: Activity },
  { key: 'plans', label: 'Plans', icon: BarChart3 },
];

function StatCard({ icon: Icon, label, value, sublabel, color, index = 0 }: {
  icon: React.ElementType; label: string; value: string | number;
  sublabel?: string; color: string; index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: 5 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={{ y: -5, scale: 1.02, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
      className="rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/80 backdrop-blur-xl p-5 transition-all duration-300 shadow-lg shadow-black/5 hover:border-[var(--accent)]/30"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{value}</p>
          {sublabel && <p className="text-xs text-[var(--muted)] mt-1">{sublabel}</p>}
        </div>
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="flex h-12 w-12 items-center justify-center rounded-xl shadow-lg"
          style={{ background: `linear-gradient(135deg, ${color}20, ${color}40)` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </motion.div>
      </div>
    </motion.div>
  );
}

function ChartCard({ title, subtitle, children, delay = 0 }: { title: string; subtitle?: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 150, damping: 20 }}
      className="rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/80 backdrop-blur-xl p-5 shadow-lg shadow-black/5"
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--muted)] mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  );
}

export default function AdminDashboardClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsTab, setAnalyticsTab] = useState('members');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<MonthlyRevenue[]>([]);
  const [growthData, setGrowthData] = useState<MemberGrowth[]>([]);
  const [planData, setPlanData] = useState<PlanDistribution[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceTrend[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<PaymentMethodStats[]>([]);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getMonthlyRevenue(12),
      getMemberGrowth(12),
      getPlanDistribution(),
      getRecentPayments(5),
      getAttendanceTrend(30),
      getPaymentMethodBreakdown(),
    ]).then(([s, r, g, p, rp, a, pm]) => {
      if (s.success && s.data) setStats(s.data);
      if (r.success && r.data) setRevenueData(r.data);
      if (g.success && g.data) setGrowthData(g.data);
      if (p.success && p.data) setPlanData(p.data);
      if (rp.success && rp.data) setRecentPayments(rp.data);
      if (a.success && a.data) setAttendanceData(a.data);
      if (pm.success && pm.data) setPaymentMethodData(pm.data);
      setLoading(false);
    }).catch(() => {
      setError("Failed to load dashboard data");
      setLoading(false);
    });
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="flex flex-col items-center justify-center h-64 gap-3"
      >
        <AlertCircle className="h-10 w-10 text-[var(--danger)]" />
        <p className="text-sm text-[var(--muted)]">{error}</p>
      </motion.div>
    );
  }

  const last6Revenue = revenueData.slice(-6);
  const last7Attendance = attendanceData.slice(-7);

  return (
    <div className="space-y-8 pb-8">
      {/* === 1. Hero Welcome Banner === */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 150, damping: 20 }}
        className="relative overflow-hidden rounded-3xl p-6 lg:p-8"
        style={{ background: 'linear-gradient(135deg, var(--accent), #064e3b)' }}
      >
        {/* Decorative pulsing orbs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-green-300/20 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-10 right-1/3 h-40 w-40 rounded-full bg-white/10 blur-2xl"
        />

        {/* Hero content */}
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">
                {new Date().getHours() < 12
                  ? 'Good morning'
                  : new Date().getHours() < 17
                  ? 'Good afternoon'
                  : 'Good evening'}, Admin 👋
              </h1>
              <p className="text-green-100/80 mt-1 text-sm lg:text-base">Here&apos;s what&apos;s happening at your gym today.</p>
            </div>

            {/* Compact stat pills */}
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 min-w-[130px]">
                <p className="text-[10px] font-medium text-green-100/70 uppercase tracking-wider">Total Members</p>
                <p className="text-xl font-bold text-white mt-0.5">{stats?.totalMembers ?? 0}</p>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 min-w-[130px]">
                <p className="text-[10px] font-medium text-green-100/70 uppercase tracking-wider">Today&apos;s Check-ins</p>
                <p className="text-xl font-bold text-white mt-0.5">{stats?.todayCheckIns ?? 0}</p>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 min-w-[130px]">
                <p className="text-[10px] font-medium text-green-100/70 uppercase tracking-wider">Revenue (Month)</p>
                <p className="text-xl font-bold text-white mt-0.5">₹{(stats?.thisMonthRevenue ?? 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 min-w-[130px]">
                <p className="text-[10px] font-medium text-green-100/70 uppercase tracking-wider">Pending</p>
                <p className="text-xl font-bold text-white mt-0.5">{stats?.pendingRequests ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* === 2. Key Metrics Strip === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Members" value={stats?.totalMembers ?? 0}
          sublabel={`${stats?.newMembersThisMonth ?? 0} new this month`} color="#22c55e" index={0} />
        <StatCard icon={Activity} label="Active Members" value={stats?.activeMembers ?? 0}
          sublabel={`${stats?.todayCheckIns ?? 0} checked in today`} color="#3b82f6" index={1} />
        <StatCard icon={IndianRupee} label="Revenue This Month" value={`₹${(stats?.thisMonthRevenue ?? 0).toLocaleString('en-IN')}`}
          sublabel={`Total: ₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`} color="#f59e0b" index={2} />
        <StatCard icon={CalendarCheck} label="Pending Requests" value={stats?.pendingRequests ?? 0}
          sublabel="Plan requests awaiting approval" color="#ef4444" index={3} />
      </div>

      {/* === 3. Quick Action Cards === */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } } }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <motion.div
          variants={{ hidden: { opacity: 0, x: -20, rotateY: 5 }, visible: { opacity: 1, x: 0, rotateY: 0, transition: { type: 'spring', stiffness: 200 } } }}
          whileHover={{ y: -3 }}
        >
          <button onClick={() => router.push('/admin/members')}
            className="group relative w-full flex items-center gap-3 rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/80 backdrop-blur-xl p-4 text-left transition-all duration-300 shadow-lg shadow-black/5 hover:border-[var(--accent)]/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.4))' }}>
              <Users className="h-5 w-5 text-green-500" />
              <div className="absolute inset-0 rounded-xl bg-green-500/20 blur-lg opacity-0 group-hover:opacity-60 transition-opacity" />
            </div>
            <div className="relative">
              <p className="text-sm font-semibold text-[var(--foreground)]">Manage Members</p>
              <p className="text-xs text-[var(--muted)]">View and manage member profiles</p>
            </div>
          </button>
        </motion.div>
        <motion.div
          variants={{ hidden: { opacity: 0, x: -20, rotateY: 5 }, visible: { opacity: 1, x: 0, rotateY: 0, transition: { type: 'spring', stiffness: 200 } } }}
          whileHover={{ y: -3 }}
        >
          <button onClick={() => router.push('/admin/payments')}
            className="group relative w-full flex items-center gap-3 rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/80 backdrop-blur-xl p-4 text-left transition-all duration-300 shadow-lg shadow-black/5 hover:border-[var(--accent)]/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.4))' }}>
              <CreditCard className="h-5 w-5 text-yellow-500" />
              <div className="absolute inset-0 rounded-xl bg-yellow-500/20 blur-lg opacity-0 group-hover:opacity-60 transition-opacity" />
            </div>
            <div className="relative">
              <p className="text-sm font-semibold text-[var(--foreground)]">View Payments</p>
              <p className="text-xs text-[var(--muted)]">Track payment history</p>
            </div>
          </button>
        </motion.div>
        <motion.div
          variants={{ hidden: { opacity: 0, x: -20, rotateY: 5 }, visible: { opacity: 1, x: 0, rotateY: 0, transition: { type: 'spring', stiffness: 200 } } }}
          whileHover={{ y: -3 }}
        >
          <button onClick={() => router.push('/admin/plans')}
            className="group relative w-full flex items-center gap-3 rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/80 backdrop-blur-xl p-4 text-left transition-all duration-300 shadow-lg shadow-black/5 hover:border-[var(--accent)]/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.4))' }}>
              <ClipboardList className="h-5 w-5 text-blue-500" />
              <div className="absolute inset-0 rounded-xl bg-blue-500/20 blur-lg opacity-0 group-hover:opacity-60 transition-opacity" />
            </div>
            <div className="relative">
              <p className="text-sm font-semibold text-[var(--foreground)]">Browse Plans</p>
              <p className="text-xs text-[var(--muted)]">View membership plans and pricing</p>
            </div>
          </button>
        </motion.div>
      </motion.div>

      {/* === 4. Charts Section === */}
      <div className="space-y-6">
        {/* Full Width Revenue Chart */}
        <ChartCard title="Monthly Revenue" subtitle="Revenue trend over the last 6 months" delay={0.2}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={last6Revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }}
                formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {last6Revenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Two Smaller Charts Side By Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Member Growth" subtitle="New member signups over time" delay={0.35}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={last6Revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }} />
                <Area type="monotone" dataKey="count" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Payment Methods" subtitle="Revenue breakdown by payment type" delay={0.45}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={paymentMethodData} dataKey="total" nameKey="method" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={4}>
                  {paymentMethodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Total']} />
                <Legend wrapperStyle={{ fontSize: '12px' }} formatter={(value) => <span style={{ color: 'var(--foreground)' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* === 5. Recent Payments (Enhanced) === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 150, damping: 20 }}
        className="rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/80 backdrop-blur-xl p-5 shadow-lg shadow-black/5"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Recent Payments</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">Latest 5 payment transactions</p>
          </div>
          <button onClick={() => router.push('/admin/payments')}
            className="flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline transition-all">
            View All <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-3 px-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Member</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Plan</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Method</th>
                <th className="text-right py-3 px-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((p, index) => {
                const amounts = recentPayments.map(p => p.amount);
                const avg = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
                const isUp = p.amount >= avg;
                return (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05, type: 'spring', stiffness: 200, damping: 25 }}
                    className="group border-b border-[var(--border)]/50 last:border-0 transition-all duration-200 hover:bg-[var(--accent)]/[0.03]"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        {p.memberImageUrl ? (
                          <img src={p.memberImageUrl} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-[var(--border)]" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 flex items-center justify-center ring-1 ring-[var(--border)]">
                            <Users className="h-3 w-3 text-[var(--muted)]" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-[var(--foreground)]">{p.memberName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-sm text-[var(--muted)]">{p.planName || '\u2014'}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-secondary)] text-xs font-medium text-[var(--muted)] border border-[var(--border)]/30">
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          p.paymentMethod === 'Credit Card' ? 'bg-blue-500' :
                          p.paymentMethod === 'UPI' ? 'bg-green-500' :
                          p.paymentMethod === 'Cash' ? 'bg-yellow-500' :
                          p.paymentMethod === 'Debit Card' ? 'bg-purple-500' : 'bg-gray-500'
                        }`} />
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={`text-xs font-semibold ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                          {isUp ? '\u2191' : '\u2193'}
                        </span>
                        <span className="font-semibold text-[var(--foreground)]">₹{p.amount.toLocaleString('en-IN')}</span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {recentPayments.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-[var(--muted)]">No payments yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* === 6. Analytics Section === */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">Analytics</h2>
            <p className="text-sm text-[var(--muted)] mt-0.5">Detailed insights into your gym</p>
          </div>
          <div className="flex gap-1 p-1 rounded-xl bg-[var(--surface-secondary)]/80 backdrop-blur-xl border border-[var(--border)]/50">
            {ANALYTICS_TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} onClick={() => setAnalyticsTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    analyticsTab === tab.key
                      ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm border border-[var(--border)]/50'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]/50'
                  }`}>
                  <Icon className="h-3.5 w-3.5" /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Members Tab */}
        {analyticsTab === 'members' && (
          <motion.div layout className="space-y-6">
            <ChartCard title="Member Growth (12 months)" subtitle="New members joining each month">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }} />
                  <Area type="monotone" dataKey="count" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Members Overview">
                <div className="space-y-4">
                  {[
                    { label: 'Total Registered', value: stats?.totalMembers ?? 0 },
                    { label: 'With Active Plans', value: stats?.activeMembers ?? 0 },
                    { label: 'New This Month', value: stats?.newMembersThisMonth ?? 0 },
                    { label: 'Pending Approvals', value: stats?.pendingRequests ?? 0 },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-secondary)]">
                      <span className="text-sm text-[var(--muted)]">{item.label}</span>
                      <span className="text-lg font-bold text-[var(--foreground)]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </ChartCard>
              <ChartCard title="Active Members by Plan">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={planData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={4}>
                      {planData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} formatter={(value) => <span style={{ color: 'var(--foreground)' }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </motion.div>
        )}

        {/* Revenue Tab */}
        {analyticsTab === 'revenue' && (
          <motion.div layout className="space-y-6">
            <ChartCard title="Monthly Revenue (12 months)" subtitle="Total revenue collected per month">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']} />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {revenueData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Revenue by Payment Method">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={paymentMethodData} dataKey="total" nameKey="method" cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={4}
                      label={({ method, percent }: any) => `${method} ${((percent || 0) * 100).toFixed(0)}%`}>
                      {paymentMethodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }}
                      formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Total']} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Members per Plan">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={planData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--muted)' }} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: 'var(--muted)' }} width={120} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {planData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </motion.div>
        )}

        {/* Attendance Tab */}
        {analyticsTab === 'attendance' && (
          <motion.div layout className="space-y-6">
            <ChartCard title="Daily Check-ins (30 days)" subtitle="Number of members checking in each day">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--muted)' }} interval={Math.floor(attendanceData.length / 10)} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }} />
                  <Area type="monotone" dataKey="checkIns" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Attendance Summary">
                <div className="space-y-4">
                  {[
                    { label: "Today's Check-ins", value: stats?.todayCheckIns ?? 0 },
                    { label: '7-Day Average', value: attendanceData.length >= 7 ? Math.round(attendanceData.slice(-7).reduce((s, d) => s + d.checkIns, 0) / 7) : 0 },
                    { label: '30-Day Average', value: attendanceData.length > 0 ? Math.round(attendanceData.reduce((s, d) => s + d.checkIns, 0) / attendanceData.length) : 0 },
                    { label: 'Peak Day (last 30 days)', value: attendanceData.length > 0 ? `${Math.max(...attendanceData.map(d => d.checkIns))} check-ins` : '\u2014' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-secondary)]">
                      <span className="text-sm text-[var(--muted)]">{item.label}</span>
                      <span className="text-lg font-bold text-[var(--foreground)]">{item.value as any}</span>
                    </div>
                  ))}
                </div>
              </ChartCard>
              <ChartCard title="Week-over-Week Trend">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={attendanceData.slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }} />
                    <Line type="monotone" dataKey="checkIns" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </motion.div>
        )}

        {/* Plans Tab */}
        {analyticsTab === 'plans' && (
          <motion.div layout className="space-y-6">
            <ChartCard title="Members per Plan" subtitle="Distribution of active members across plans">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={planData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--muted)' }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: 'var(--muted)' }} width={120} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {planData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Plan Comparison">
                <div className="space-y-3">
                  {planData.map((plan, i) => (
                    <div key={plan.name} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-secondary)]">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm font-medium text-[var(--foreground)]">{plan.name}</span>
                      </div>
                      <span className="text-sm font-bold text-[var(--foreground)]">{plan.count} member{plan.count !== 1 ? 's' : ''} ({(stats?.totalMembers ? ((plan.count / stats.totalMembers) * 100).toFixed(1) : '0')}%)</span>
                    </div>
                  ))}
                  {planData.length === 0 && <p className="text-sm text-[var(--muted)] text-center py-4">No active plans data available</p>}
                </div>
              </ChartCard>
              <ChartCard title="Revenue by Plan">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={planData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={4}>
                      {planData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} formatter={(value) => <span style={{ color: 'var(--foreground)' }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
