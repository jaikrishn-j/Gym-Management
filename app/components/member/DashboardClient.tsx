'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Zap, Star, CheckCircle2, AlertCircle, Loader2, IndianRupee, Timer, X,
  CreditCard, ArrowRight, RefreshCw, TrendingUp, TrendingDown, BarChart3,
  Calendar, ChevronLeft, ChevronRight, Plus, Scale, Activity, Target,
  Footprints, Maximize2, Minimize2, Bell, Clock, Send, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { requestPlan, verifyRazorpayPayment, saveWeight, getAttendanceData } from '@/app/dashboard/actions';

interface Plan {
  id: string; name: string; description: string; price: number;
  offerPrice: number | null; billingDays: number; features: string[]; isActive: boolean;
}

interface MemberPlan {
  id: string; clerkUserId: string; planId: string; startDate: string;
  endDate: string; status: 'active' | 'expired' | 'cancelled'; createdAt: string;
}

interface PendingRequest {
  id: string; planName: string; status: string; createdAt: string; amount: number | null;
}

interface GymSettings {
  initialPaymentAmount: number | null;
  paymentGatewayEnabled: boolean | null;
  razorpayKeyId: string | null;
}

interface AttendanceRecord {
  id: string; clerkUserId: string; date: string | Date; timeIn: string | Date | null;
  timeOut: string | Date | null; weightIn: number | null; weightOut: number | null; isPresent: boolean;
}

interface AttendanceStats {
  totalDays: number; presentDays: number; absentDays: number;
  totalWeightIn: number; totalWeightOut: number; attendanceRate: number;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const AreaChart = ({ data, labels, color, gradientId, unit, expanded }: {
  data: (number | null)[]; labels: string[]; color: string; gradientId: string; unit: string; expanded?: boolean;
}) => {
  const validData = data.filter(d => d !== null) as number[];
  if (validData.length === 0) return null;
  const maxVal = Math.max(...validData);
  const minVal = Math.min(...validData, 0);
  const range = maxVal - minVal || 1;
  const padding = 20;
  const chartWidth = 100;
  const chartHeight = 80;
  const points = data.map((d, i) => {
    if (d === null) return null;
    const x = padding + (i / (data.length - 1 || 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - ((d - minVal) / range) * (chartHeight - padding * 2);
    return `${x},${y}`;
  });
  const linePoints = points.filter(Boolean).join(' ');
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className={`w-full ${expanded ? 'h-96' : 'h-48'}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = chartHeight - padding - ratio * (chartHeight - padding * 2);
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="var(--border)" strokeWidth="0.3" strokeDasharray="2,2" />
              <text x={padding - 2} y={y + 1} fontSize="2.5" fill="var(--muted)" textAnchor="end">{Math.round(minVal + ratio * range)}{unit}</text>
            </g>
          );
        })}
        <polygon points={`${padding},${chartHeight - padding} ${linePoints} ${padding + (data.length - 1) * ((chartWidth - padding * 2) / (data.length - 1 || 1))},${chartHeight - padding}`} fill={`url(#${gradientId})`} />
        <polyline points={linePoints} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          if (d === null) return null;
          const x = padding + (i / (data.length - 1 || 1)) * (chartWidth - padding * 2);
          const y = chartHeight - padding - ((d - minVal) / range) * (chartHeight - padding * 2);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="2" fill="var(--surface)" stroke={color} strokeWidth="1" />
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between px-2 mt-1">
        {labels.filter((_, i) => i % Math.ceil(labels.length / 7) === 0 || i === labels.length - 1).map((label, i) => (
          <span key={i} className="text-[10px] text-[var(--muted)]">{label}</span>
        ))}
      </div>
    </div>
  );
};

const BarChart = ({ data, labels, color, maxValue, expanded }: {
  data: number[]; labels: string[]; color: string; maxValue: number; expanded?: boolean;
}) => {
  const chartHeight = 100;
  const barWidth = 100 / data.length - 4;
  return (
    <div className="relative">
      <svg viewBox={`0 0 100 ${chartHeight}`} className={`w-full ${expanded ? 'h-80' : 'h-40'}`} preserveAspectRatio="xMidYMid meet">
        {[0, 0.5, 1].map((ratio, i) => {
          const y = chartHeight - 10 - ratio * (chartHeight - 20);
          return (
            <g key={i}>
              <line x1="5" y1={y} x2="95" y2={y} stroke="var(--border)" strokeWidth="0.3" strokeDasharray="2,2" />
              <text x="4" y={y + 1} fontSize="3" fill="var(--muted)" textAnchor="end">
                {ratio === 1 ? maxValue : ratio === 0.5 ? maxValue / 2 : 0}
              </text>
            </g>
          );
        })}
        {data.map((value, i) => {
          const height = maxValue > 0 ? ((value / maxValue) * (chartHeight - 20)) : 0;
          const x = 6 + i * (90 / data.length);
          const y = chartHeight - 10 - height;
          const w = Math.max(1, barWidth);
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={height} rx="1" fill={color} opacity={value > 0 ? 0.8 : 0.2} />
              <rect x={x} y={chartHeight - 10 - Math.max(height, 5)} width={w} height={Math.max(height, 5)} fill="transparent" className="hover:fill-white/5 transition-colors cursor-pointer" />
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between px-1 mt-1">
        {labels.filter((_, i) => i % Math.ceil(labels.length / 7) === 0 || i === labels.length - 1).map((label, i) => (
          <span key={i} className="text-[10px] text-[var(--muted)]">{label}</span>
        ))}
      </div>
    </div>
  );
};

const ProgressRing = ({ percentage, size = 60, strokeWidth = 4, color }: {
  percentage: number; size?: number; strokeWidth?: number; color: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
        <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference}
          animate={{ strokeDashoffset: offset }} transition={{ duration: 1.5, ease: "easeOut" }} />
      </svg>
      <span className="absolute text-sm font-bold">{percentage}%</span>
    </div>
  );
};

interface DashboardClientProps {
  initialPlans: Plan[];
  initialMemberPlans: MemberPlan[];
  initialCurrentPlan: MemberPlan | null;
  previousPlan: { memberPlan: MemberPlan; plan: Plan } | null;
  daysRemaining: number | null;
  planName: string | null;
  initialPendingRequest: PendingRequest | null;
  initialGymSettings: GymSettings | null;
}

export default function DashboardClient({
  initialPlans,
  initialMemberPlans,
  initialCurrentPlan,
  previousPlan,
  daysRemaining,
  planName,
  initialPendingRequest,
  initialGymSettings,
}: DashboardClientProps) {
  const [plans] = useState<Plan[]>(initialPlans);
  const [currentPlan, setCurrentPlan] = useState<MemberPlan | null>(initialCurrentPlan);
  const [memberPlans] = useState<MemberPlan[]>(initialMemberPlans);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [dismissedExpiry, setDismissedExpiry] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(initialPendingRequest);
  const [gymSettings] = useState<GymSettings | null>(initialGymSettings);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [viewPeriod, setViewPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentWeek, setCurrentWeek] = useState(1);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightForm, setWeightForm] = useState({ weightIn: '', weightOut: '' });
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [expandedChart, setExpandedChart] = useState<'attendance' | 'weight' | null>(null);

  const fetchAttendance = useCallback(async () => {
    const result = await getAttendanceData(viewPeriod, currentMonth, currentYear, currentWeek);
    if (result.success) {
      setAttendance(result.data || []);
      setStats(result.stats);
    }
  }, [viewPeriod, currentMonth, currentYear, currentWeek]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  useEffect(() => {
    if (daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 3 && !dismissedExpiry) {
      const timer = setTimeout(() => setShowExpiryWarning(true), 500)
      return () => clearTimeout(timer)
    }
  }, [daysRemaining, dismissedExpiry]);

  const handleRequestPlan = async () => {
    if (!selectedPlan) return;
    try {
      setIsRequesting(true);
      setError('');

      const result = await requestPlan(selectedPlan.id);
      if (!result.success) throw new Error(result.error || 'Failed to request plan');

      if (result.gateway && result.data && 'orderId' in result.data) {
        // Razorpay flow
        const gatewayData = result.data as { orderId: string; amount: number; keyId: string; planName: string; requestId: string };
        await loadRazorpayScript();

        const options = {
          key: gatewayData.keyId,
          amount: Math.round(gatewayData.amount * 100),
          currency: "INR",
          name: gatewayData.planName,
          order_id: gatewayData.orderId,
          handler: async (response: any) => {
            const verify = await verifyRazorpayPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
            );
            if (verify.success) {
              setRequestSuccess(`Payment successful! Your ${gatewayData.planName} plan is now active.`);
              setShowSuccessBanner(true);
              setCurrentPlan(null);
              setPendingRequest(null);
              setShowPlanModal(false);
              setSelectedPlan(null);
              toast.success('Plan activated');
              window.location.reload();
            } else {
              setError(verify.error || 'Payment verification failed');
              toast.error(verify.error || 'Payment verification failed');
            }
          },
          modal: {
            ondismiss: () => {
              setIsRequesting(false);
            },
          },
          prefill: { contact: '', email: '' },
          theme: { color: "#22c55e" },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else if (!result.gateway && result.data && 'id' in result.data) {
        // Offline flow
        const offlineData = result.data as { id: string; amount: number | null; createdAt: Date };
        setRequestSuccess(`Request sent to admin! They will review and activate your plan.`);
        setShowSuccessBanner(true);
        setPendingRequest({
          id: offlineData.id,
          planName: selectedPlan.name,
          status: 'pending',
          createdAt: new Date().toISOString(),
          amount: offlineData.amount,
        });
        setShowPlanModal(false);
        setSelectedPlan(null);
        toast.success('Plan request submitted');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request plan');
      toast.error(err.message || 'Failed to request plan');
    } finally {
      setIsRequesting(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay'));
      document.body.appendChild(script);
    });
  };

  const handleSaveWeight = async () => {
    try {
      setIsSavingWeight(true);
      const result = await saveWeight(
        weightForm.weightIn ? parseFloat(weightForm.weightIn) : undefined,
        weightForm.weightOut ? parseFloat(weightForm.weightOut) : undefined,
      );
      if (!result.success) throw new Error(result.error || 'Failed to save');
      await fetchAttendance();
      setShowWeightModal(false);
      setWeightForm({ weightIn: '', weightOut: '' });
      toast.success('Weight recorded');
    } catch (err: any) {
      setError(err.message || 'Failed to save weight');
      toast.error(err.message || 'Failed to save weight');
    } finally { setIsSavingWeight(false); }
  };

  const navigateMonth = (direction: number) => {
    if (currentMonth + direction < 1) { setCurrentMonth(12); setCurrentYear(currentYear - 1); }
    else if (currentMonth + direction > 12) { setCurrentMonth(1); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + direction);
  };
  const navigateWeek = (direction: number) => setCurrentWeek(Math.max(1, Math.min(5, currentWeek + direction)));

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const getDaysRemaining = (endDate: string) => Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const getProgress = (startDate: string, endDate: string) => Math.max(0, Math.min(100, ((Date.now() - new Date(startDate).getTime()) / (new Date(endDate).getTime() - new Date(startDate).getTime())) * 100));

  const getPlanIcon = (name: string, size = 'h-5 w-5') => {
    const lower = name.toLowerCase();
    if (lower.includes('pro')) return <Zap className={size} />;
    if (lower.includes('elite') || lower.includes('vip') || lower.includes('premium')) return <Crown className={size} />;
    return <Star className={size} />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20"><CheckCircle2 className="h-3 w-3" /> Active</span>;
      case 'expired': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-medium border border-red-500/20"><AlertCircle className="h-3 w-3" /> Expired</span>;
      case 'cancelled': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500 text-xs font-medium border border-gray-500/20"><X className="h-3 w-3" /> Cancelled</span>;
    }
  };

  const attendanceData = attendance.map(a => a.isPresent ? 1 : 0);
  const weightInData = attendance.map(a => a.weightIn);
  const weightOutData = attendance.map(a => a.weightOut);
  const dateLabels = attendance.map(a => new Date(a.date).getDate().toString());

  const weightLogDays = attendance.filter(a => a.weightIn !== null || a.weightOut !== null).length
  const weightLogPercentage = stats?.totalDays ? Math.round((weightLogDays / stats.totalDays) * 100) : 0

  const todayRecord = attendance.find(a => {
    const d = a.date instanceof Date ? a.date : new Date(a.date)
    const now = new Date()
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  })
  const hasTodayWeight = todayRecord !== undefined && (todayRecord.weightIn !== null || todayRecord.weightOut !== null)

  const isFirstPlan = memberPlans.length === 0
  const totalAmount = selectedPlan
    ? (selectedPlan.offerPrice ?? selectedPlan.price) + (isFirstPlan && gymSettings?.initialPaymentAmount ? gymSettings.initialPaymentAmount : 0)
    : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 py-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)]">My Membership</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Manage your plan & track progress</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowWeightModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500/20 font-semibold text-sm transition-colors">
          {hasTodayWeight ? <RefreshCw className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {hasTodayWeight ? "Update Today's Weight" : "Log Today's Weight"}
        </motion.button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-500 font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessBanner && requestSuccess && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-2xl bg-green-500/10 border border-green-500/20 p-4">
            <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />
            <p className="text-sm text-green-500 font-medium">{requestSuccess}</p>
            <button onClick={() => { setShowSuccessBanner(false); setRequestSuccess(null); }}
              className="ml-auto text-green-500/50 hover:text-green-500">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending request banner */}
      <AnimatePresence>
        {pendingRequest && pendingRequest.status === 'pending' && !currentPlan && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-6 text-white shadow-2xl shadow-blue-500/20">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full border-8 border-white" />
              <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full border-8 border-white" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Plan Request Pending</h2>
                  <p className="text-sm text-white/80">{pendingRequest.planName}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Send className="h-5 w-5 text-white/80" />
                  <span className="font-semibold">Waiting for approval</span>
                </div>
                <p className="text-sm text-white/70">
                  Your plan request has been sent to the gym staff. They will review and activate your plan shortly.
                </p>
                {pendingRequest.amount && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <span className="text-sm text-white/60">Amount: </span>
                    <span className="font-bold">₹{pendingRequest.amount}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {currentPlan && plans.find(p => p.id === currentPlan.planId) && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 p-6 text-white shadow-2xl shadow-green-500/20">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full border-8 border-white" />
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full border-8 border-white" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                  {getPlanIcon(plans.find(p => p.id === currentPlan.planId)?.name || '')}
                </div>
                <div>
                  <h2 className="text-xl font-black">{plans.find(p => p.id === currentPlan.planId)?.name} Plan</h2>
                  {getStatusBadge(currentPlan.status)}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-0.5">
                  <IndianRupee className="h-4 w-4" />
                  <span className="text-3xl font-black">{plans.find(p => p.id === currentPlan.planId)?.offerPrice || plans.find(p => p.id === currentPlan.planId)?.price}</span>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${getProgress(currentPlan.startDate, currentPlan.endDate)}%` }}
                  className="h-full rounded-full bg-white" />
              </div>
              <div className="flex items-center justify-between text-xs text-white/80 mt-1.5">
                <span>{formatDate(currentPlan.startDate)}</span>
                <span>{formatDate(currentPlan.endDate)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm">
                <Timer className="h-4 w-4" />
                <span className="font-semibold">{getDaysRemaining(currentPlan.endDate)} days left</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {!currentPlan && !pendingRequest && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="text-center py-10 px-6 rounded-3xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">No Active Plan</h3>
            <p className="text-sm text-[var(--muted)] mb-6">Choose a membership plan to start your fitness journey</p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowPlanModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-green-500 text-white font-bold shadow-lg shadow-green-500/20">
              Choose a Plan <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
          {previousPlan && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h3 className="text-sm font-semibold text-[var(--muted)] uppercase mb-3">Previous Plan</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-500/10">
                    {getPlanIcon(previousPlan.plan.name)}
                  </div>
                  <div>
                    <p className="font-semibold">{previousPlan.plan.name}</p>
                    <p className="text-xs text-[var(--muted)]">Expired {formatDate(previousPlan.memberPlan.endDate)}</p>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => { setSelectedPlan(previousPlan.plan); setShowPlanModal(true); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/10 text-green-500 text-sm font-semibold">
                  <RefreshCw className="h-3.5 w-3.5" /> Renew
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Analytics section — unchanged from original */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[var(--foreground)] flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-500" /> Analytics Dashboard
          </h3>
          <div className="flex rounded-xl bg-[var(--field-background)] p-1">
            {(['weekly', 'monthly'] as const).map((period) => (
              <button key={period} onClick={() => setViewPeriod(period)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewPeriod === period ? 'bg-green-500 text-white shadow-lg' : 'text-[var(--muted)]'}`}>
                {period === 'weekly' ? 'Weekly' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => viewPeriod === 'monthly' ? navigateMonth(-1) : navigateWeek(-1)}
            className="p-2 rounded-xl hover:bg-[var(--surface-secondary)] transition-colors">
            <ChevronLeft className="h-4 w-4 text-[var(--muted)]" />
          </button>
          <span className="text-sm font-bold text-[var(--foreground)]">
            {viewPeriod === 'monthly'
              ? `${new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' })} ${currentYear}`
              : `Week ${currentWeek} • ${new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'short' })} ${currentYear}`
            }
          </span>
          <button onClick={() => viewPeriod === 'monthly' ? navigateMonth(1) : navigateWeek(1)}
            className="p-2 rounded-xl hover:bg-[var(--surface-secondary)] transition-colors">
            <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <motion.div whileHover={{ scale: 1.02 }} className="p-4 rounded-2xl bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/10 text-center">
              <ProgressRing percentage={stats.attendanceRate} size={50} strokeWidth={3} color="#22c55e" />
              <p className="text-[10px] text-[var(--muted)] mt-2 font-medium">Attendance</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/10 text-center">
              <ProgressRing percentage={weightLogPercentage} size={50} strokeWidth={3} color="#3b82f6" />
              <p className="text-[10px] text-[var(--muted)] mt-2 font-medium">Weight Logs</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/10 text-center">
              <ProgressRing percentage={stats.totalDays > 0 ? Math.round((stats.presentDays / stats.totalDays) * 100) : 0} size={50} strokeWidth={3} color="#a855f7" />
              <p className="text-[10px] text-[var(--muted)] mt-2 font-medium">Present</p>
            </motion.div>
          </div>
        )}

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--field-background)]/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
              <Footprints className="h-4 w-4 text-green-500" /> Attendance Overview
            </h4>
            <button onClick={() => setExpandedChart(expandedChart === 'attendance' ? null : 'attendance')}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors">
              {expandedChart === 'attendance' ? <Minimize2 className="h-4 w-4 text-[var(--muted)]" /> : <Maximize2 className="h-4 w-4 text-[var(--muted)]" />}
            </button>
          </div>
          <BarChart data={attendanceData.length > 0 ? attendanceData : [0]}
            labels={dateLabels.length > 0 ? dateLabels : ['No data']} color="#22c55e" maxValue={1} expanded={expandedChart === 'attendance'} />
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-[10px] text-[var(--muted)]">Present Days</span>
            </div>
            <span className="text-xs font-semibold text-[var(--foreground)]">
              {stats?.presentDays || 0}/{stats?.totalDays || 0} days
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--field-background)]/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
              <Scale className="h-4 w-4 text-blue-500" /> Weight Tracking
            </h4>
            <button onClick={() => setExpandedChart(expandedChart === 'weight' ? null : 'weight')}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors">
              {expandedChart === 'weight' ? <Minimize2 className="h-4 w-4 text-[var(--muted)]" /> : <Maximize2 className="h-4 w-4 text-[var(--muted)]" />}
            </button>
          </div>
          {weightInData.some(w => w !== null) ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-xs font-medium text-[var(--muted)]">Weight In</span>
                {weightInData.filter(w => w !== null).length > 0 && (
                  <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="text-xs font-bold text-blue-500 ml-auto">
                    {weightInData.filter(w => w !== null).length} logs
                  </motion.span>
                )}
              </div>
              <AreaChart data={weightInData} labels={dateLabels} color="#3b82f6" gradientId="weightInGrad" unit="kg" expanded={expandedChart === 'weight'} />
              {weightOutData.some(w => w !== null) && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-3 w-3 rounded-full bg-orange-500" />
                    <span className="text-xs font-medium text-[var(--muted)]">Weight Out</span>
                  </div>
                  <AreaChart data={weightOutData} labels={dateLabels} color="#f97316" gradientId="weightOutGrad" unit="kg" expanded={expandedChart === 'weight'} />
                </div>
              )}
              {weightInData.some(w => w !== null) && (
                <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-blue-500/5 to-orange-500/5 border border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--muted)]">Weight Change</span>
                    {(() => {
                      const weightedRecords = attendance
                        .filter(a => a.weightIn !== null)
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      if (weightedRecords.length >= 2) {
                        const diff = weightedRecords[weightedRecords.length - 1].weightIn! - weightedRecords[0].weightIn!
                        return (
                          <span className={`text-xs font-bold flex items-center gap-1 ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-500' : 'text-[var(--muted)]'}`}>
                            {diff > 0 ? <TrendingUp className="h-3 w-3" /> : diff < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                            {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                          </span>
                        )
                      }
                      return <span className="text-xs text-[var(--muted)]">—</span>
                    })()}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Scale className="h-8 w-8 text-[var(--muted)] mx-auto mb-2 opacity-30" />
              <p className="text-xs text-[var(--muted)]">No weight data yet</p>
              <button onClick={() => setShowWeightModal(true)}
                className="text-xs text-blue-500 font-medium mt-1 hover:underline">Log your first weight</button>
            </div>
          )}
        </div>
      </div>

      {/* Plan Selection Modal */}
      <AnimatePresence>
        {showPlanModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowPlanModal(false); setSelectedPlan(null); }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Choose a Plan</h2>
                <button onClick={() => { setShowPlanModal(false); setSelectedPlan(null); }}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-secondary)]">
                  <X className="h-5 w-5 text-[var(--muted)]" />
                </button>
              </div>
              <div className="space-y-3">
                {plans.filter(p => p.isActive).map((plan) => (
                  <motion.button key={plan.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedPlan(plan); }}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedPlan?.id === plan.id
                        ? 'border-green-500 bg-green-500/5'
                        : 'border-[var(--border)] bg-[var(--field-background)] hover:border-green-500'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
                          {getPlanIcon(plan.name)}
                        </div>
                        <div>
                          <p className="font-bold text-[var(--foreground)]">{plan.name}</p>
                          <p className="text-xs text-[var(--muted)]">{plan.billingDays} day{plan.billingDays > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline gap-0.5">
                          <IndianRupee className="h-3 w-3 text-[var(--foreground)]" />
                          <span className="text-lg font-black">{plan.offerPrice || plan.price}</span>
                        </div>
                        {plan.offerPrice && <span className="text-[10px] text-[var(--muted)] line-through block">₹{plan.price}</span>}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Price breakdown for selected plan */}
              {selectedPlan && (
                <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-green-500/5 to-blue-500/5 border border-green-500/10">
                  <p className="text-xs font-semibold text-[var(--muted)] uppercase mb-2">Price Breakdown</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Plan Price</span>
                      <span className="font-semibold">₹{selectedPlan.offerPrice || selectedPlan.price}</span>
                    </div>
                    {isFirstPlan && gymSettings?.initialPaymentAmount && (
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">Initial Registration Fee</span>
                        <span className="font-semibold">₹{gymSettings.initialPaymentAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-green-500/10">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-green-500">₹{totalAmount}</span>
                    </div>
                  </div>
                </div>
              )}

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
                onClick={handleRequestPlan} disabled={!selectedPlan || isRequesting}
                className="w-full mt-4 h-12 rounded-xl bg-green-500 text-white font-bold shadow-lg shadow-green-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                {isRequesting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                ) : gymSettings?.paymentGatewayEnabled ? (
                  <><CreditCard className="h-4 w-4" /> Pay ₹{totalAmount}</>
                ) : (
                  <><Send className="h-4 w-4" /> Request Plan</>
                )}
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Expiry Warning Modal */}
      <AnimatePresence>
        {showExpiryWarning && daysRemaining !== null && daysRemaining <= 3 && daysRemaining > 0 && planName && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowExpiryWarning(false); setDismissedExpiry(true); }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl z-10">
              <div className="flex items-center gap-3 text-orange-500 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 shrink-0">
                  <Timer className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--foreground)]">Plan Expiring Soon</h3>
                  <p className="text-sm text-[var(--muted)]">{planName}</p>
                </div>
              </div>

              <div className="mb-6 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                <p className="text-sm text-[var(--foreground)]">
                  Your <strong>{planName}</strong> plan expires in{' '}
                  <strong className="text-orange-500">{daysRemaining} day{daysRemaining > 1 ? 's' : ''}</strong>.
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Renew now to keep enjoying unlimited access to your gym.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowExpiryWarning(false); setDismissedExpiry(true); setShowPlanModal(true); }}
                  className="flex-1 h-12 rounded-xl bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Renew Now
                </button>
                <button
                  onClick={() => { setShowExpiryWarning(false); setDismissedExpiry(true); }}
                  className="flex-1 h-12 rounded-xl border-2 border-[var(--border)] bg-[var(--field-background)] text-[var(--foreground)] font-semibold hover:bg-blue-500/5 transition-colors"
                >
                  Remind Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Weight Modal */}
      <AnimatePresence>
        {showWeightModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowWeightModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Log Weight</h2>
                <button onClick={() => setShowWeightModal(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-secondary)]">
                  <X className="h-5 w-5 text-[var(--muted)]" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-1 block">Weight In (kg)</label>
                  <input type="number" step="0.1" value={weightForm.weightIn}
                    onChange={(e) => setWeightForm(prev => ({ ...prev, weightIn: e.target.value }))}
                    placeholder="e.g., 75.5"
                    className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-1 block">Weight Out (kg)</label>
                  <input type="number" step="0.1" value={weightForm.weightOut}
                    onChange={(e) => setWeightForm(prev => ({ ...prev, weightOut: e.target.value }))}
                    placeholder="e.g., 74.0"
                    className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-green-500" />
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
                  onClick={handleSaveWeight} disabled={isSavingWeight || (!weightForm.weightIn && !weightForm.weightOut)}
                  className="w-full h-12 rounded-xl bg-green-500 text-white font-bold shadow-lg shadow-green-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSavingWeight ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Weight'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
