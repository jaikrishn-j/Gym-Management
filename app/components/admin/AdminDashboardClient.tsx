'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, IndianRupee, CalendarCheck, Activity, AlertCircle,
  ChevronRight, CreditCard, BarChart3
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
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

function StatCard({ icon: Icon, label, value, sublabel, color }: {
  icon: React.ElementType; label: string; value: string | number;
  sublabel?: string; color: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{value}</p>
          {sublabel && <p className="text-xs text-[var(--muted)] mt-1">{sublabel}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--muted)] mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
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
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="h-10 w-10 text-[var(--danger)]" />
        <p className="text-sm text-[var(--muted)]">{error}</p>
      </div>
    );
  }

  const last6Revenue = revenueData.slice(-6);
  const last7Attendance = attendanceData.slice(-7);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Dashboard</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Overview of your gym operations</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Members" value={stats?.totalMembers ?? 0}
          sublabel={`${stats?.newMembersThisMonth ?? 0} new this month`} color="#22c55e" />
        <StatCard icon={Activity} label="Active Members" value={stats?.activeMembers ?? 0}
          sublabel={`${stats?.todayCheckIns ?? 0} checked in today`} color="#3b82f6" />
        <StatCard icon={IndianRupee} label="Revenue This Month" value={`₹${(stats?.thisMonthRevenue ?? 0).toLocaleString('en-IN')}`}
          sublabel={`Total: ₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`} color="#f59e0b" />
        <StatCard icon={CalendarCheck} label="Pending Requests" value={stats?.pendingRequests ?? 0}
          sublabel="Plan requests awaiting approval" color="#ef4444" />
      </div>

      {/* Dashboard Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Monthly Revenue">
          <ResponsiveContainer width="100%" height={280}>
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
        <ChartCard title="Member Growth">
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
      </div>

      {/* Recent Payments */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Recent Payments</h3>
          <button onClick={() => router.push('/admin/payments')}
            className="flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline">
            View All <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 px-3 text-xs font-medium text-[var(--muted)]">Member</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-[var(--muted)]">Plan</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-[var(--muted)]">Method</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-[var(--muted)]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border)]/50 last:border-0">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      {p.memberImageUrl ? <img src={p.memberImageUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                        : <div className="h-6 w-6 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center"><Users className="h-3 w-3 text-[var(--muted)]" /></div>}
                      <span className="text-sm font-medium text-[var(--foreground)]">{p.memberName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[var(--muted)]">{p.planName || '—'}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--surface-secondary)] text-xs font-medium text-[var(--muted)]">
                      <CreditCard className="h-3 w-3" /> {p.paymentMethod}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-[var(--foreground)]">₹{p.amount.toLocaleString('en-IN')}</td>
                </tr>
              ))}
              {recentPayments.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-sm text-[var(--muted)]">No payments yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* === Analytics Section === */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">Analytics</h2>
            <p className="text-sm text-[var(--muted)] mt-0.5">Detailed insights into your gym</p>
          </div>
          <div className="flex gap-1 p-1 rounded-xl bg-[var(--surface-secondary)]">
            {ANALYTICS_TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} onClick={() => setAnalyticsTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    analyticsTab === tab.key ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}>
                  <Icon className="h-3.5 w-3.5" /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Members Tab */}
        {analyticsTab === 'members' && (
          <div className="space-y-6">
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
          </div>
        )}

        {/* Revenue Tab */}
        {analyticsTab === 'revenue' && (
          <div className="space-y-6">
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
          </div>
        )}

        {/* Attendance Tab */}
        {analyticsTab === 'attendance' && (
          <div className="space-y-6">
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
                    { label: 'Peak Day (last 30 days)', value: attendanceData.length > 0 ? `${Math.max(...attendanceData.map(d => d.checkIns))} check-ins` : '—' },
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
          </div>
        )}

        {/* Plans Tab */}
        {analyticsTab === 'plans' && (
          <div className="space-y-6">
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
          </div>
        )}
      </div>
    </div>
  );
}
