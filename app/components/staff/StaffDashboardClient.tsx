'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, IndianRupee, Activity, AlertCircle,
  ChevronRight, Dumbbell, CreditCard, UserCheck, ClipboardList,
  ShieldOff, BarChart3, CalendarCheck
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line
} from 'recharts';
import {
  getDashboardStats, getMonthlyRevenue, getPlanDistribution,
  getRecentPayments, getAttendanceTrend, DashboardStats,
  MonthlyRevenue, PlanDistribution, RecentPayment, AttendanceTrend
} from '@/app/staff/dashboard/action';
import { StaffDashboardSkeleton } from '@/app/components/shared/Skeleton';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const ANALYTICS_TABS = [
  { key: 'members', label: 'Members', icon: Users },
  { key: 'revenue', label: 'Revenue', icon: IndianRupee },
  { key: 'attendance', label: 'Attendance', icon: Activity },
  { key: 'plans', label: 'Plans', icon: BarChart3 },
];

function StatCard({ icon: Icon, label, value, sublabel, color }: {
  icon: React.ElementType; label: string; value: string | number | undefined;
  sublabel?: string; color: string;
}) {
  if (value === undefined) return null;
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

export default function StaffDashboardClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsTab, setAnalyticsTab] = useState('members');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<MonthlyRevenue[]>([]);
  const [planData, setPlanData] = useState<PlanDistribution[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceTrend[]>([]);

  const canViewPayments = stats?.totalRevenue !== undefined;
  const canViewMembers = stats?.totalMembers !== undefined;
  const canViewAnalytics = stats?.canViewAnalytics || false;

  useEffect(() => {
    getDashboardStats().then(s => {
      if (s.success && s.data) {
        setStats(s.data);
        if (s.data.canViewAnalytics) {
          setLoadingAnalytics(true);
          Promise.all([
            getMonthlyRevenue(12),
            getPlanDistribution(),
            getAttendanceTrend(30),
            getRecentPayments(5),
          ]).then(([r, p, a, rp]) => {
            if (r.success && r.data) setRevenueData(r.data);
            if (p.success && p.data) setPlanData(p.data);
            if (a.success && a.data) setAttendanceData(a.data);
            if (rp.success && rp.data) setRecentPayments(rp.data);
            setLoadingAnalytics(false);
          }).catch(() => setLoadingAnalytics(false));
        }
      }
      setLoading(false);
    }).catch(() => {
      setError("Failed to load dashboard data");
      setLoading(false);
    });
  }, []);

  if (loading) return <StaffDashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="h-10 w-10 text-[var(--danger)]" />
        <p className="text-sm text-[var(--muted)]">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Staff Dashboard</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Monitor gym operations at a glance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Members" value={stats?.totalMembers}
          sublabel={`${stats?.todayCheckIns ?? 0} checked in today`} color="#22c55e" />
        <StatCard icon={Activity} label="Active Members" value={stats?.activeMembers}
          sublabel={canViewMembers ? 'Currently active plans' : undefined} color="#3b82f6" />
        <StatCard icon={IndianRupee} label="Revenue This Month"
          value={stats?.thisMonthRevenue !== undefined ? `₹${stats.thisMonthRevenue.toLocaleString('en-IN')}` : undefined}
          sublabel={canViewPayments ? `Total: ₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}` : undefined} color="#f59e0b" />
        <StatCard icon={CalendarCheck} label="Pending Requests" value={stats?.pendingRequests}
          sublabel="Awaiting approval" color="#ef4444" />
      </div>

      {/* No permissions state */}
      {!canViewMembers && !canViewPayments && !canViewAnalytics && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <Dumbbell className="h-12 w-12 mx-auto text-[var(--muted)] mb-3" />
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Welcome to Staff Dashboard</h3>
          <p className="text-sm text-[var(--muted)] mt-2 max-w-md mx-auto">
            You don&apos;t have any data permissions yet. Contact an admin to get access to member management, payments, or analytics.
          </p>
          <button onClick={() => router.push('/staff/members')}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            Go to Members <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Quick Actions */}
      {(canViewMembers || canViewPayments) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {canViewMembers && (
            <button onClick={() => router.push('/staff/members')}
              className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:bg-[var(--surface-secondary)] transition-colors text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-500"><UserCheck className="h-5 w-5" /></div>
              <div><p className="text-sm font-semibold text-[var(--foreground)]">Manage Members</p><p className="text-xs text-[var(--muted)]">View and manage member profiles</p></div>
            </button>
          )}
          {canViewPayments && (
            <button onClick={() => router.push('/staff/payments')}
              className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:bg-[var(--surface-secondary)] transition-colors text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-500"><CreditCard className="h-5 w-5" /></div>
              <div><p className="text-sm font-semibold text-[var(--foreground)]">View Payments</p><p className="text-xs text-[var(--muted)]">Track payment history</p></div>
            </button>
          )}
          <button onClick={() => router.push('/staff/plans')}
            className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:bg-[var(--surface-secondary)] transition-colors text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500"><ClipboardList className="h-5 w-5" /></div>
            <div><p className="text-sm font-semibold text-[var(--foreground)]">View Plans</p><p className="text-xs text-[var(--muted)]">Browse membership plans</p></div>
          </button>
        </div>
      )}

      {/* Dashboard Charts (only if analytics permission) */}
      {canViewAnalytics && loadingAnalytics && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse flex items-center gap-3 text-sm text-[var(--muted)]">
            <div className="h-2 w-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-2 w-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="h-2 w-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '300ms' }} />
            Loading analytics...
          </div>
        </div>
      )}

      {canViewAnalytics && !loadingAnalytics && (
        <>
          {/* Dashboard Charts */}
          {(revenueData.length > 0 || planData.length > 0 || attendanceData.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {revenueData.length > 0 && (
                <ChartCard title="Monthly Revenue">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={revenueData.slice(-6)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                      <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }}
                        formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']} />
                      <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                        {revenueData.slice(-6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
              {planData.length > 0 && (
                <ChartCard title="Active Members by Plan">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={planData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={4}>
                        {planData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--muted)' }}
                        formatter={(value) => <span style={{ color: 'var(--foreground)' }}>{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
              {attendanceData.length > 0 && (
                <ChartCard title="Daily Check-ins (7 days)">
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={attendanceData.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                      <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }} />
                      <Area type="monotone" dataKey="checkIns" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>
          )}

          {/* Recent Payments */}
          {recentPayments.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Recent Payments</h3>
                <button onClick={() => router.push('/staff/payments')}
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
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* No analytics permission */}
      {!canViewAnalytics && (canViewMembers || canViewPayments) && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <ShieldOff className="h-12 w-12 mx-auto text-orange-500 mb-3" />
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Analytics Access Restricted</h3>
          <p className="text-sm text-[var(--muted)] mt-2 max-w-md mx-auto">
            You don&apos;t have permission to view analytics. Contact an admin to request analytics access.
          </p>
        </div>
      )}

      {/* Analytics tabs (only if permission exists) */}
      {canViewAnalytics && !loadingAnalytics && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">Analytics</h2>
              <p className="text-sm text-[var(--muted)] mt-0.5">Detailed insights</p>
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
              <ChartCard title="Members Overview">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[var(--surface-secondary)]">
                    <p className="text-xs text-[var(--muted)]">Total Registered</p>
                    <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{stats?.totalMembers ?? 0}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--surface-secondary)]">
                    <p className="text-xs text-[var(--muted)]">With Active Plans</p>
                    <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{stats?.activeMembers ?? 0}</p>
                  </div>
                </div>
              </ChartCard>
              {planData.length > 0 && (
                <ChartCard title="Active Members by Plan">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={planData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--muted)' }} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: 'var(--muted)' }} width={100} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                        {planData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>
          )}

          {/* Revenue Tab */}
          {analyticsTab === 'revenue' && (
            <div className="space-y-6">
              <ChartCard title="Monthly Revenue (12 months)">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-xs text-[var(--muted)]">Total Revenue</p>
                  <p className="text-2xl font-bold text-[var(--foreground)] mt-1">₹{(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-xs text-[var(--muted)]">This Month</p>
                  <p className="text-2xl font-bold text-[var(--foreground)] mt-1">₹{(stats?.thisMonthRevenue ?? 0).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {analyticsTab === 'attendance' && (
            <div className="space-y-6">
              <ChartCard title="Daily Check-ins (30 days)">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-xs text-[var(--muted)]">Today&apos;s Check-ins</p>
                  <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{stats?.todayCheckIns ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-xs text-[var(--muted)]">Pending Requests</p>
                  <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{stats?.pendingRequests ?? 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Plans Tab */}
          {analyticsTab === 'plans' && (
            <div className="space-y-6">
              <ChartCard title="Members per Plan">
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
              <div className="space-y-3">
                {planData.map((plan, i) => (
                  <div key={plan.name} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-secondary)]">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm font-medium text-[var(--foreground)]">{plan.name}</span>
                    </div>
                    <span className="text-sm font-bold text-[var(--foreground)]">{plan.count} member{plan.count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
                {planData.length === 0 && <p className="text-sm text-[var(--muted)] text-center py-4">No active plans data</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
