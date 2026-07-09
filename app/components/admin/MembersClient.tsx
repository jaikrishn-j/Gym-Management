'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Loader2,
  Users,
  Calendar,
  AlertCircle,
  CreditCard,
  IndianRupee,
  CheckCircle2,
  X,
  Wifi,
  WifiOff,
  Clock,
  Banknote,
  Smartphone,
  History,
  Eye,
  Footprints,
  Scale,
  BarChart3,
  Table,
  Plus,
  Activity,
  Timer,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  createdAt: string;
  lastSignIn: string;
  status: string;
  role: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  offerPrice: number | null;
  billingDays: number;
  features: string[];
  isActive: boolean;
}

interface MemberPlan {
  id: string;
  clerkUserId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: string;
  isSynced: boolean;
  plan?: Plan;
}

interface Payment {
  id: string;
  clerkUserId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  daysAdded: number;
  recordedBy: string;
  isSynced: boolean;
}

interface AttendanceRecord {
  id: string;
  clerkUserId: string;
  date: string | Date;
  timeIn: string | Date | null;
  timeOut: string | Date | null;
  weightIn: number | null;
  weightOut: number | null;
  isPresent: boolean;
}

interface MembersClientProps {
  initialMembers: Member[];
  initialPlans: Plan[];
  readMemberPlans: (clerkUserId: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
  readPayments: (clerkUserId: string, limit?: number) => Promise<{ success: boolean; data?: any[]; error?: string }>;
  createPayment: (data: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  checkPendingSyncs: () => Promise<{ count: number }>;
  markAttendance?: (data: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  readAttendanceHistory?: (clerkUserId: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
}

const MembersClient = ({
  initialMembers,
  initialPlans,
  readMemberPlans,
  readPayments,
  createPayment,
  checkPendingSyncs: checkPendingSyncsAction,
  markAttendance,
  readAttendanceHistory,
}: MembersClientProps) => {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>(initialPlans);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncs, setPendingSyncs] = useState(0);

  // Detail modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'attendance' | 'plans'>('attendance');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [showAttendanceGraph, setShowAttendanceGraph] = useState(false);
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    timeIn: '',
    timeOut: '',
    weightIn: '',
    weightOut: '',
  });
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);

  // Plan/Payment modal states (nested within detail modal tab 2)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [memberPlans, setMemberPlans] = useState<MemberPlan[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-fill timeIn when mark attendance opens
  useEffect(() => {
    if (showMarkAttendance) {
      const now = new Date()
      const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      setAttendanceForm(prev => ({ ...prev, timeIn: t }))
    }
  }, [showMarkAttendance])

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'upi' | 'card',
    daysAdded: '',
    notes: '',
  });

  // Online status detection
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check pending syncs on mount
  useEffect(() => {
    checkPendingSyncsAction().then(result => {
      setPendingSyncs(result.count);
    }).catch(() => {});
  }, [checkPendingSyncsAction]);

  // Filter members
  const filteredMembers = useMemo(() => {
    if (!searchTerm) return members;
    return members.filter(member =>
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, members]);

  // Fetch member details (attendance + plans + payments)
  const fetchMemberDetails = useCallback(async (memberId: string) => {
    setLoadingDetails(true);
    const promises: Promise<any>[] = [
      readMemberPlans(memberId),
      readPayments(memberId, 5),
    ]
    if (readAttendanceHistory) {
      promises.push(readAttendanceHistory(memberId))
    }

    const [plansRes, paymentsRes, attendanceRes] = await Promise.all(promises)

    if (plansRes.success) {
      setMemberPlans(plansRes.data || []);
    }
    if (paymentsRes.success) {
      setRecentPayments(paymentsRes.data || []);
    }
    if (attendanceRes?.success) {
      setAttendanceHistory(attendanceRes.data || []);
    }
    setLoadingDetails(false);
  }, [readMemberPlans, readPayments, readAttendanceHistory]);

  // Handle view member
  const handleViewMember = async (member: Member) => {
    setSelectedMember(member);
    setSelectedPlan(null);
    setActiveTab('attendance');
    setShowAttendanceGraph(false);
    setShowMarkAttendance(false);
    setPaymentForm({ amount: '', paymentMethod: 'cash', daysAdded: '', notes: '' });
    setAttendanceForm({
      date: new Date().toISOString().split('T')[0],
      timeIn: '',
      timeOut: '',
      weightIn: '',
      weightOut: '',
    });
    await fetchMemberDetails(member.id);
    setShowDetailsModal(true);
  };

  // Handle mark attendance
  const handleMarkAttendance = async () => {
    if (!selectedMember || !markAttendance) return;
    try {
      setIsMarkingAttendance(true);
      const timeInDate = attendanceForm.timeIn
        ? new Date(`${attendanceForm.date}T${attendanceForm.timeIn}`).toISOString()
        : undefined;
      const timeOutDate = attendanceForm.timeOut
        ? new Date(`${attendanceForm.date}T${attendanceForm.timeOut}`).toISOString()
        : undefined;

      const result = await markAttendance({
        clerkUserId: selectedMember.id,
        date: new Date(attendanceForm.date).toISOString(),
        timeIn: timeInDate,
        timeOut: timeOutDate,
        weightIn: attendanceForm.weightIn ? parseFloat(attendanceForm.weightIn) : undefined,
        weightOut: attendanceForm.weightOut ? parseFloat(attendanceForm.weightOut) : undefined,
        isPresent: true,
      });

      if (!result.success) throw new Error(result.error || 'Failed to mark attendance');

      if (readAttendanceHistory) {
        const res = await readAttendanceHistory(selectedMember.id);
        if (res.success) setAttendanceHistory(res.data || []);
      }

      setShowMarkAttendance(false);
      setAttendanceForm({
        date: new Date().toISOString().split('T')[0],
        timeIn: '',
        timeOut: '',
        weightIn: '',
        weightOut: '',
      });
      toast.success('Attendance marked');
    } catch (err: any) {
      setError(err.message || 'Failed to mark attendance');
      toast.error(err.message || 'Failed to mark attendance');
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  // Handle plan selection (opens payment modal)
  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setPaymentForm({
      amount: (plan.offerPrice || plan.price).toString(),
      paymentMethod: 'cash',
      daysAdded: plan.billingDays.toString(),
      notes: '',
    });
    setShowPaymentModal(true);
  };

  // Save payment and plan (offline-capable)
  const handleSavePayment = async () => {
    if (!selectedMember || !selectedPlan) return;

    try {
      setIsSaving(true);

      const payload = {
        clerkUserId: selectedMember.id,
        planId: selectedPlan.id,
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        daysAdded: parseInt(paymentForm.daysAdded),
        notes: paymentForm.notes,
        memberName: `${selectedMember.firstName} ${selectedMember.lastName}`,
        planName: selectedPlan.name,
      };

      if (isOnline) {
        const result = await createPayment(payload);
        if (!result.success) {
          throw new Error(result.error || 'Failed to save');
        }
      } else {
        await storeOfflineSync(payload);
        setPendingSyncs(prev => prev + 1);
      }

      setShowPaymentModal(false);
      setShowDetailsModal(false);
      setSelectedMember(null);
      setSelectedPlan(null);
      toast.success(isOnline ? 'Payment recorded' : 'Payment saved offline');

      checkPendingSyncsAction().then(result => {
        setPendingSyncs(result.count);
      }).catch(() => {});
    } catch (err: any) {
      setError(err.message || 'Failed to save payment');
      toast.error(err.message || 'Failed to save payment');
    } finally {
      setIsSaving(false);
    }
  };

  // Store offline sync data
  const storeOfflineSync = async (payload: any) => {
    const db = await openOfflineDB();
    const transaction = db.transaction(['pendingSyncs'], 'readwrite');
    const store = transaction.objectStore('pendingSyncs');
    await store.add({
      id: Date.now().toString(),
      action: 'create_payment',
      payload: JSON.stringify(payload),
      createdAt: new Date().toISOString(),
    });
  };

  // Open IndexedDB
  const openOfflineDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('GymStitchOffline', 1);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('pendingSyncs')) {
          db.createObjectStore('pendingSyncs', { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  // Format helpers
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString: string | Date | null) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="h-3.5 w-3.5" />;
      case 'upi': return <Smartphone className="h-3.5 w-3.5" />;
      case 'card': return <CreditCard className="h-3.5 w-3.5" />;
      default: return <CreditCard className="h-3.5 w-3.5" />;
    }
  };

  const getActivePlan = () => {
    return memberPlans.find(mp => mp.status === 'active');
  };

  // Simple attendance bar chart
  const AttendanceChart = ({ records }: { records: AttendanceRecord[] }) => {
    const maxVal = records.length || 1;
    return (
      <div className="h-32">
        <svg viewBox={`0 0 ${Math.max(records.length * 12, 50)} 100`} className="w-full h-full">
          {records.map((r, i) => {
            const barH = r.isPresent ? 60 : 20;
            const x = i * 12 + 4;
            const y = 90 - barH;
            return (
              <g key={r.id}>
                <rect x={x} y={y} width={8} height={barH} rx={2}
                  fill={r.isPresent ? '#22c55e' : '#6b7280'} opacity={0.7} />
                <text x={x + 4} y={104} fontSize="6" textAnchor="middle" fill="var(--muted)">
                  {new Date(r.date).getDate()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Hero Header Section */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-gradient-to-r from-[var(--accent)]/10 via-[var(--accent)]/5 to-transparent rounded-2xl border border-[var(--border)] p-6 space-y-4 shadow-lg shadow-black/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--accent)]" />
              <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">Gym Members</h1>
            </div>
            <p className="text-sm text-[var(--muted)] mt-1 ml-7">View and manage all gym members</p>
          </div>
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md transition-all ${
              isOnline
                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
            }`}>
              <motion.span animate={{ rotate: isOnline ? 0 : 180 }} transition={{ duration: 0.3 }}>
                {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              </motion.span>
              {isOnline ? 'Online' : 'Offline'}
            </motion.div>

            <AnimatePresence>
              {pendingSyncs > 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 text-xs font-semibold backdrop-blur-md">
                  <Clock className="h-3.5 w-3.5" />
                  {pendingSyncs} pending sync{pendingSyncs > 1 ? 's' : ''}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] font-semibold text-sm border border-[var(--accent)]/20 backdrop-blur-md transition-all">
              <Users className="h-4 w-4" />
              {members.length} Members
            </motion.div>
          </div>
        </div>

        {/* Quick Stat Pills */}
        <div className="flex flex-wrap gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex items-center gap-2 backdrop-blur-md bg-[var(--surface)]/60 border border-[var(--border)]/50 rounded-xl px-4 py-2 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inset-0 rounded-full bg-green-500" />
              <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-50" />
            </span>
            <span className="text-xs font-bold text-[var(--foreground)]">{members.filter(m => m.status === 'active').length}</span>
            <span className="text-xs text-[var(--muted)]">Active</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="flex items-center gap-2 backdrop-blur-md bg-[var(--surface)]/60 border border-[var(--border)]/50 rounded-xl px-4 py-2 shadow-sm">
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
            <span className="text-xs font-bold text-[var(--foreground)]">{members.filter(m => {
              const d = new Date(m.createdAt); const now = new Date();
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length}</span>
            <span className="text-xs text-[var(--muted)]">New This Month</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex items-center gap-2 backdrop-blur-md bg-[var(--surface)]/60 border border-[var(--border)]/50 rounded-xl px-4 py-2 shadow-sm">
            <Calendar className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span className="text-xs font-bold text-[var(--foreground)]">{members.length}</span>
            <span className="text-xs text-[var(--muted)]">Total Members</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="backdrop-blur-xl bg-[var(--surface)]/80 rounded-2xl border border-[var(--border)]/50 p-1.5 shadow-lg shadow-black/5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search members by name or email..."
              className="w-full h-12 pl-10 pr-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20 transition-all duration-300" />
          </div>
          <motion.button whileHover={{ scale: 1.05, backgroundColor: 'var(--surface-secondary)' }} whileTap={{ scale: 0.95 }}
            className="h-12 w-12 flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] transition-all duration-300 shrink-0">
            <SlidersHorizontal className="h-4 w-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-500 font-medium">{error}</p>
            <button onClick={() => setError('')} className="ml-auto">
              <X className="h-4 w-4 text-red-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Members Table */}
      <AnimatePresence mode="wait">
        {filteredMembers.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="text-center py-20 rounded-2xl border border-dashed border-[var(--border)]/50 bg-[var(--surface)]/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', damping: 15 }}>
              <Users className="h-12 w-12 text-[var(--muted)] mx-auto mb-3 opacity-40" />
            </motion.div>
            <p className="text-[var(--muted)] text-lg font-medium">{searchTerm ? 'No members found' : 'No members yet'}</p>
            {searchTerm && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="text-xs text-[var(--muted)] mt-1 opacity-60">Try a different search term</motion.p>
            )}
          </motion.div>
        ) : (
          <motion.div key="table" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="overflow-x-auto rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/80 backdrop-blur-sm shadow-lg shadow-black/5">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)]/80">
                  <th className="px-4 py-3.5 text-left text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Member</th>
                  <th className="px-4 py-3.5 text-left text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider hidden lg:table-cell">Plan</th>
                  <th className="px-4 py-3.5 text-left text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider hidden md:table-cell">Joined</th>
                  <th className="px-4 py-3.5 text-left text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3.5 text-right text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/50">
                {filteredMembers.map((member, index) => (
                  <motion.tr key={member.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                    whileHover={{ backgroundColor: 'var(--surface-secondary)', scale: 1.002 }}
                    className="transition-colors cursor-default">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {member.imageUrl ? (
                          <div className="relative group">
                            <img src={member.imageUrl} alt={member.firstName}
                              className="h-9 w-9 rounded-full object-cover border border-[var(--border)] transition-all duration-300 group-hover:border-[var(--accent)] group-hover:shadow-lg group-hover:shadow-[var(--accent)]/20" />
                            {member.status === 'active' && (
                              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                                <span className="absolute inset-0 rounded-full bg-green-500 border-2 border-[var(--surface)]" />
                                <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75 border-2 border-[var(--surface)]" />
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)]/30 to-[var(--accent)]/10 text-[var(--accent)] font-semibold text-xs border border-[var(--accent)]/20">
                              {getInitials(member.firstName, member.lastName)}
                            </div>
                            {member.status === 'active' && (
                              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                                <span className="absolute inset-0 rounded-full bg-green-500 border-2 border-[var(--surface)]" />
                                <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75 border-2 border-[var(--surface)]" />
                              </span>
                            )}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-sm text-[var(--foreground)] tracking-tight">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-xs text-[var(--muted)]">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                        {member.role || 'No Plan'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="text-xs text-[var(--muted)] flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 opacity-40" />
                        {formatDate(member.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        member.status === 'active'
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }`}>
                        <span className="relative flex h-2 w-2">
                          <span className={`absolute inset-0 rounded-full ${member.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`} />
                          {member.status === 'active' && (
                            <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                          )}
                        </span>
                        {member.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button size="sm"
                        onClick={() => handleViewMember(member)}
                        className="min-w-0 h-9 px-4 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-bold text-xs shadow-lg shadow-[var(--accent)]/20 border-none hover:opacity-90 transition-opacity">
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Member Detail Modal (Tabbed) */}
      <AnimatePresence>
        {showDetailsModal && selectedMember && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowDetailsModal(false); setSelectedMember(null); }}
              className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, y: 100, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 100, scale: 0.97 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[var(--border)]/50 bg-[var(--surface)]/95 backdrop-blur-xl p-6 shadow-2xl shadow-black/20 z-10">

              <div className="w-10 h-1 rounded-full bg-[var(--border)] mx-auto mb-6 sm:hidden" />

              {/* Header with Avatar Animation */}
              <div className="flex items-center justify-between mb-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                  className="flex items-center gap-3">
                  <div className="relative">
                    {selectedMember.imageUrl ? (
                      <>
                        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-[var(--accent)] via-[var(--accent)]/50 to-[var(--accent)] opacity-60 animate-pulse blur-sm" />
                        <img src={selectedMember.imageUrl} alt={selectedMember.firstName}
                          className="relative h-12 w-12 rounded-full object-cover border-2 border-[var(--surface)]" />
                      </>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)]/30 to-[var(--accent)]/10 text-[var(--accent)] font-bold text-sm border-2 border-[var(--accent)]/30">
                        {getInitials(selectedMember.firstName, selectedMember.lastName)}
                      </div>
                    )}
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }}
                      className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[var(--surface)] ${
                        selectedMember.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                      }`}>
                      {selectedMember.status === 'active' && (
                        <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                      )}
                    </motion.span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--foreground)] tracking-tight">
                      {selectedMember.firstName} {selectedMember.lastName}
                    </h2>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-[var(--muted)]">{selectedMember.email}</p>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedMember.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                      }`}>
                        {selectedMember.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </motion.div>
                <motion.button whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}
                  onClick={() => { setShowDetailsModal(false); setSelectedMember(null); }}
                  className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-[var(--surface-secondary)] transition-colors">
                  <X className="h-5 w-5 text-[var(--muted)]" />
                </motion.button>
              </div>

              {/* Tabs - Pill Design with Icons */}
              <div className="relative flex gap-1 mb-6 rounded-2xl bg-[var(--surface-secondary)]/80 border border-[var(--border)]/30 p-1">
                <div className="absolute top-1 bottom-1 rounded-xl bg-[var(--accent)] shadow-lg shadow-[var(--accent)]/20 transition-all duration-300"
                  style={{
                    left: activeTab === 'attendance' ? '0.25rem' : '50%',
                    width: 'calc(50% - 0.5rem)',
                  }} />
                <button onClick={() => setActiveTab('attendance')}
                  className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 z-10 ${
                    activeTab === 'attendance'
                      ? 'text-[var(--accent-foreground)]'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}>
                  <motion.span animate={{ scale: activeTab === 'attendance' ? 1 : 0.9 }}>
                    <Footprints className="h-4 w-4" />
                  </motion.span>
                  Attendance
                </button>
                <button onClick={() => setActiveTab('plans')}
                  className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 z-10 ${
                    activeTab === 'plans'
                      ? 'text-[var(--accent-foreground)]'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}>
                  <motion.span animate={{ scale: activeTab === 'plans' ? 1 : 0.9 }}>
                    <CreditCard className="h-4 w-4" />
                  </motion.span>
                  Payments & Plans
                </button>
              </div>

              {/* Tab Content with AnimatePresence */}
              <AnimatePresence mode="wait">
                {activeTab === 'attendance' && (
                  <motion.div key="attendance" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}
                    className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                        <Activity className="h-4 w-4 text-green-500" /> Login Activity
                        <span className="text-xs text-[var(--muted)] font-normal">({attendanceHistory.length} records)</span>
                      </h3>
                      <div className="flex items-center gap-2">
                        {markAttendance && (
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => setShowMarkAttendance(!showMarkAttendance)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] text-xs font-bold shadow-lg shadow-[var(--accent)]/20 transition-all">
                            <Plus className="h-3.5 w-3.5" /> Mark Attendance
                          </motion.button>
                        )}
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => setShowAttendanceGraph(!showAttendanceGraph)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--field-background)] text-[var(--muted)] border border-[var(--border)] text-xs font-bold transition-all">
                          {showAttendanceGraph ? <Table className="h-3.5 w-3.5" /> : <BarChart3 className="h-3.5 w-3.5" />}
                          {showAttendanceGraph ? 'Table' : 'Graph'}
                        </motion.button>
                      </div>
                    </div>

                    {/* Mark Attendance Form - Glassmorphism */}
                    <AnimatePresence>
                      {showMarkAttendance && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden">
                          <motion.div layout className="rounded-2xl border border-[var(--border)]/50 bg-[var(--surface-secondary)]/60 backdrop-blur-md p-5 shadow-lg shadow-black/5">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1.5 tracking-wider">Date</label>
                                <input type="date" value={attendanceForm.date}
                                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, date: e.target.value }))}
                                  className="w-full h-11 px-3 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-sm text-[var(--foreground)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all duration-300" />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1.5 tracking-wider">Time In</label>
                                <input type="time" value={attendanceForm.timeIn}
                                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, timeIn: e.target.value }))}
                                  className="w-full h-11 px-3 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-sm text-[var(--foreground)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all duration-300" />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1.5 tracking-wider">Weight In</label>
                                <input type="number" step="0.1" value={attendanceForm.weightIn}
                                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, weightIn: e.target.value }))}
                                  placeholder="kg"
                                  className="w-full h-11 px-3 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-sm text-[var(--foreground)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all duration-300" />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1.5 tracking-wider">Weight Out</label>
                                <input type="number" step="0.1" value={attendanceForm.weightOut}
                                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, weightOut: e.target.value }))}
                                  placeholder="kg"
                                  className="w-full h-11 px-3 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-sm text-[var(--foreground)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all duration-300" />
                              </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => setShowMarkAttendance(false)}
                                className="flex-1 h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Cancel</motion.button>
                              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={handleMarkAttendance} disabled={isMarkingAttendance}
                                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-green-500/20">
                                {isMarkingAttendance ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                Mark Present
                              </motion.button>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Attendance Content */}
                    <AnimatePresence mode="wait">
                      {attendanceHistory.length === 0 ? (
                        <motion.div key="empty-attendance" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                          className="text-center py-12 rounded-2xl border border-dashed border-[var(--border)]/50 bg-[var(--surface)]/50 backdrop-blur-sm">
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }}>
                            <Footprints className="h-10 w-10 text-[var(--muted)] mx-auto mb-3 opacity-30" />
                          </motion.div>
                          <p className="text-sm text-[var(--muted)] font-medium">No attendance records found</p>
                        </motion.div>
                      ) : showAttendanceGraph ? (
                        <motion.div key="graph" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/50 backdrop-blur-sm p-4">
                          <AttendanceChart records={attendanceHistory.slice(0, 30)} />
                          <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-[var(--muted)]">
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Present</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-500" /> Absent</span>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="overflow-x-auto rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/50 backdrop-blur-sm">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)]/60">
                                <th className="px-3 py-3 text-left text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Date</th>
                                <th className="px-3 py-3 text-left text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Time In</th>
                                <th className="px-3 py-3 text-left text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Time Out</th>
                                <th className="px-3 py-3 text-left text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Weight In</th>
                                <th className="px-3 py-3 text-left text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Weight Out</th>
                                <th className="px-3 py-3 text-left text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]/30">
                              {attendanceHistory.map((record, idx) => (
                                <motion.tr key={record.id}
                                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.02 }} whileHover={{ backgroundColor: 'var(--surface-secondary)' }}
                                  className="transition-colors">
                                  <td className="px-3 py-2.5 text-xs font-medium text-[var(--foreground)]">{formatDate(record.date)}</td>
                                  <td className="px-3 py-2.5 text-xs text-[var(--muted)]">{formatTime(record.timeIn)}</td>
                                  <td className="px-3 py-2.5 text-xs text-[var(--muted)]">{formatTime(record.timeOut)}</td>
                                  <td className="px-3 py-2.5 text-xs text-[var(--muted)]">{record.weightIn ?? '--'}</td>
                                  <td className="px-3 py-2.5 text-xs text-[var(--muted)]">{record.weightOut ?? '--'}</td>
                                  <td className="px-3 py-2.5">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      record.isPresent ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                    }`}>
                                      <span className={`relative flex h-1.5 w-1.5`}>
                                        <span className={`absolute inset-0 rounded-full ${record.isPresent ? 'bg-green-500' : 'bg-gray-500'}`} />
                                        {record.isPresent && <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />}
                                      </span>
                                      {record.isPresent ? 'Present' : 'Absent'}
                                    </span>
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {activeTab === 'plans' && (
                  <motion.div key="plans" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                    className="space-y-4">
                    {/* Active Plan with Pulsing Glow */}
                    {getActivePlan() && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="relative p-5 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/30 overflow-hidden">
                        <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-50 animate-pulse" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-green-500" />
                            <p className="text-xs font-bold text-green-500 uppercase tracking-wider">Current Plan</p>
                          </div>
                          <p className="font-bold text-[var(--foreground)] text-lg">{getActivePlan()?.plan?.name || 'Active Plan'}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-[var(--muted)] flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Ends: {formatDate(getActivePlan()?.endDate || '')}
                            </p>
                            <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">Active</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Recent Payments - Glass Card */}
                    {recentPayments.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                        <h3 className="text-xs font-bold text-[var(--muted)] uppercase mb-2.5 flex items-center gap-1.5 tracking-wider">
                          <History className="h-3 w-3" /> Recent Payments
                        </h3>
                        <div className="space-y-2">
                          {recentPayments.slice(0, 3).map((payment, idx) => (
                            <motion.div key={payment.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                              className="flex items-center justify-between p-3 rounded-xl backdrop-blur-md bg-[var(--surface-secondary)]/60 border border-[var(--border)]/30 hover:border-[var(--accent)]/20 transition-all duration-300">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                                  {getPaymentIcon(payment.paymentMethod)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-[var(--foreground)]">₹{payment.amount}</p>
                                  <p className="text-[10px] text-[var(--muted)]">{formatDate(payment.paymentDate)}</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 rounded-full">+{payment.daysAdded} days</span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Select Plan - Glass Cards */}
                    <div>
                      <h3 className="text-xs font-bold text-[var(--muted)] uppercase mb-2.5 flex items-center gap-1.5 tracking-wider">
                        <Sparkles className="h-3 w-3 text-[var(--accent)]" /> Assign a Plan
                      </h3>
                      <div className="space-y-2.5">
                        {availablePlans.filter(p => p.isActive).map((plan, idx) => (
                          <motion.button key={plan.id}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                            whileHover={{ scale: 1.015, borderColor: 'var(--accent)' }} whileTap={{ scale: 0.99 }}
                            onClick={() => handleSelectPlan(plan)}
                            className="w-full text-left p-4 rounded-xl border border-[var(--border)]/50 hover:border-[var(--accent)]/50 bg-[var(--surface-secondary)]/40 backdrop-blur-md hover:bg-[var(--surface-secondary)]/80 hover:shadow-lg hover:shadow-[var(--accent)]/5 transition-all duration-300 group">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold text-sm text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">{plan.name}</p>
                                <p className="text-xs text-[var(--muted)] mt-0.5">
                                  {plan.billingDays >= 30 ? `${plan.billingDays / 30} month${plan.billingDays >= 60 ? 's' : ''}` : `${plan.billingDays} day${plan.billingDays > 1 ? 's' : ''}`}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-baseline gap-0.5">
                                  <IndianRupee className="h-3 w-3 text-[var(--foreground)]" />
                                  <span className="text-xl font-black text-[var(--foreground)]">{plan.offerPrice || plan.price}</span>
                                </div>
                                {plan.offerPrice && (
                                  <span className="text-[10px] text-[var(--muted)] line-through">₹{plan.price}</span>
                                )}
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedMember && selectedPlan && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, y: 100, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl border border-[var(--border)]/50 bg-[var(--surface)]/95 backdrop-blur-xl p-6 shadow-2xl shadow-black/20 z-10">

              {/* Decorative background accent */}
              <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[var(--accent)]/5 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-[var(--accent)]/5 blur-3xl pointer-events-none" />

              <div className="relative">
                <div className="w-10 h-1 rounded-full bg-[var(--border)] mx-auto mb-6 sm:hidden" />

                <div className="flex items-center justify-between mb-6">
                  <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                    <h2 className="text-lg font-bold text-[var(--foreground)] tracking-tight">
                      <span className="text-[var(--accent)]">Record</span> Payment
                    </h2>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{selectedPlan.name} • {selectedMember.firstName}</p>
                  </motion.div>
                  <motion.button whileHover={{ rotate: 90, scale: 1.1 }} transition={{ duration: 0.2 }}
                    onClick={() => setShowPaymentModal(false)}
                    className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-[var(--surface-secondary)] transition-colors">
                    <X className="h-5 w-5 text-[var(--muted)]" />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                    <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1.5 tracking-wider">Amount (₹)</label>
                    <input type="number" value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-bold text-lg outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20 transition-all duration-300" />
                  </motion.div>

                  <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
                    <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1.5 tracking-wider">Days to Add</label>
                    <input type="number" value={paymentForm.daysAdded}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, daysAdded: e.target.value }))}
                      className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-bold text-lg outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20 transition-all duration-300" />
                  </motion.div>

                  <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                    <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1.5 tracking-wider">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['cash', 'upi', 'card'] as const).map((method) => (
                        <motion.button key={method} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={() => setPaymentForm(prev => ({ ...prev, paymentMethod: method }))}
                          className={`flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${
                            paymentForm.paymentMethod === method
                              ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20'
                              : 'bg-[var(--field-background)] text-[var(--muted)] border border-[var(--border)] hover:border-[var(--accent)]/30 hover:text-[var(--foreground)]'
                          }`}>
                          {getPaymentIcon(method)}
                          {method.toUpperCase()}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
                    <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1.5 tracking-wider">Notes (Optional)</label>
                    <input type="text" value={paymentForm.notes}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any notes..."
                      className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] text-sm outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20 transition-all duration-300" />
                  </motion.div>

                  <AnimatePresence>
                    {!isOnline && (
                      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border border-yellow-500/30">
                        <div className="h-8 w-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                          <WifiOff className="h-4 w-4 text-yellow-500" />
                        </div>
                        <p className="text-xs text-yellow-500 font-medium">
                          Payment will be saved offline and synced when connected.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleSavePayment} disabled={isSaving || !paymentForm.amount || !paymentForm.daysAdded}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]/90 text-[var(--accent-foreground)] font-bold shadow-lg shadow-[var(--accent)]/30 disabled:opacity-50 flex items-center justify-center gap-2 transition-all duration-300">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <>{isOnline ? <CheckCircle2 className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                      {isOnline ? 'Save Payment' : 'Save Offline'}
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MembersClient;
