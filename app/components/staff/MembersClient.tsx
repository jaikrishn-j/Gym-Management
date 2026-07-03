'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  canRead: boolean;
  canUpdate: boolean;
  readMemberPlans: (clerkUserId: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
  readPayments: (clerkUserId: string, limit?: number) => Promise<{ success: boolean; data?: any[]; error?: string }>;
  createPayment: (data: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  checkPendingSyncs: () => Promise<{ count: number }>;
  readAttendanceHistory?: (clerkUserId: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
  markAttendance?: (data: any) => Promise<{ success: boolean; data?: any; error?: string }>;
}

const MembersClient = ({
  initialMembers,
  initialPlans,
  canRead,
  canUpdate,
  readMemberPlans,
  readPayments,
  createPayment,
  checkPendingSyncs: checkPendingSyncsAction,
  readAttendanceHistory,
  markAttendance,
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

  // Plan/Payment modal states
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

  // Fetch member details
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

  // Handle plan selection
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)]">Gym Members</h1>
          <p className="text-sm text-[var(--muted)] mt-1">View and manage all gym members</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            isOnline
              ? 'bg-green-500/10 text-green-500 border-green-500/20'
              : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
          }`}>
            {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {isOnline ? 'Online' : 'Offline'}
          </div>

          {pendingSyncs > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 text-xs font-semibold">
              <Clock className="h-3.5 w-3.5" />
              {pendingSyncs} pending sync{pendingSyncs > 1 ? 's' : ''}
            </div>
          )}

          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-500 font-semibold text-sm">
            <Users className="h-4 w-4" />
            {members.length} Members
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search members by name or email..."
          className="w-full h-12 pl-10 pr-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all" />
      </div>

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
      {filteredMembers.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-12 w-12 text-[var(--muted)] mx-auto mb-3" />
          <p className="text-[var(--muted)] text-lg">{searchTerm ? 'No members found' : 'No members yet'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase">Member</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase hidden lg:table-cell">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase hidden md:table-cell">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredMembers.map((member) => (
                <motion.tr key={member.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="hover:bg-[var(--surface-secondary)]/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {member.imageUrl ? (
                        <img src={member.imageUrl} alt={member.firstName}
                          className="h-9 w-9 rounded-full object-cover border border-[var(--border)]" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/10 text-blue-500 font-semibold text-xs">
                          {getInitials(member.firstName, member.lastName)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm text-[var(--foreground)]">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-[var(--muted)]">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-[var(--muted)]">
                      {member.role || 'No Plan'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-[var(--muted)]">{formatDate(member.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      member.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${member.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`} />
                      {member.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canRead && (
                      <button onClick={() => handleViewMember(member)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-500/90 font-medium text-xs transition-colors">
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Member Detail Modal (Tabbed) */}
      <AnimatePresence>
        {showDetailsModal && selectedMember && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowDetailsModal(false); setSelectedMember(null); }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl z-10">

              <div className="w-10 h-1 rounded-full bg-[var(--border)] mx-auto mb-6 sm:hidden" />

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {selectedMember.imageUrl ? (
                    <img src={selectedMember.imageUrl} alt={selectedMember.firstName}
                      className="h-10 w-10 rounded-full object-cover border border-[var(--border)]" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/10 text-blue-500 font-semibold text-sm">
                      {getInitials(selectedMember.firstName, selectedMember.lastName)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-[var(--foreground)]">
                      {selectedMember.firstName} {selectedMember.lastName}
                    </h2>
                    <p className="text-sm text-[var(--muted)]">{selectedMember.email}</p>
                  </div>
                </div>
                <button onClick={() => { setShowDetailsModal(false); setSelectedMember(null); }}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-secondary)]">
                  <X className="h-5 w-5 text-[var(--muted)]" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-6 rounded-xl bg-[var(--field-background)] p-1">
                <button onClick={() => setActiveTab('attendance')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'attendance'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}>
                  <Footprints className="h-4 w-4" /> Attendance
                </button>
                <button onClick={() => setActiveTab('plans')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'plans'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}>
                  <CreditCard className="h-4 w-4" /> Payments & Plans
                </button>
              </div>

              {/* Tab 1: Attendance */}
              {activeTab === 'attendance' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" /> Login Activity
                      <span className="text-xs text-[var(--muted)] font-normal">({attendanceHistory.length} records)</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      {canUpdate && markAttendance && (
                        <button onClick={() => setShowMarkAttendance(!showMarkAttendance)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-semibold">
                          <Plus className="h-3.5 w-3.5" /> Mark Attendance
                        </button>
                      )}
                      <button onClick={() => setShowAttendanceGraph(!showAttendanceGraph)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--field-background)] text-[var(--muted)] border border-[var(--border)] text-xs font-semibold">
                        {showAttendanceGraph ? <Table className="h-3.5 w-3.5" /> : <BarChart3 className="h-3.5 w-3.5" />}
                        {showAttendanceGraph ? 'Table' : 'Graph'}
                      </button>
                    </div>
                  </div>

                  {/* Mark Attendance Form */}
                  <AnimatePresence>
                    {showMarkAttendance && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)]/50 p-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-[var(--muted)] uppercase mb-1">Date</label>
                            <input type="date" value={attendanceForm.date}
                              onChange={(e) => setAttendanceForm(prev => ({ ...prev, date: e.target.value }))}
                              className="w-full h-10 px-3 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-sm outline-none focus:border-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[var(--muted)] uppercase mb-1">Time In</label>
                            <input type="time" value={attendanceForm.timeIn}
                              onChange={(e) => setAttendanceForm(prev => ({ ...prev, timeIn: e.target.value }))}
                              className="w-full h-10 px-3 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-sm outline-none focus:border-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[var(--muted)] uppercase mb-1">Weight In</label>
                            <input type="number" step="0.1" value={attendanceForm.weightIn}
                              onChange={(e) => setAttendanceForm(prev => ({ ...prev, weightIn: e.target.value }))}
                              placeholder="kg"
                              className="w-full h-10 px-3 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-sm outline-none focus:border-blue-500" />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-semibold text-[var(--muted)] uppercase mb-1">Weight Out</label>
                            <input type="number" step="0.1" value={attendanceForm.weightOut}
                              onChange={(e) => setAttendanceForm(prev => ({ ...prev, weightOut: e.target.value }))}
                              placeholder="kg"
                              className="w-full h-10 px-3 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-sm outline-none focus:border-blue-500" />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => setShowMarkAttendance(false)}
                            className="flex-1 h-10 rounded-xl border border-[var(--border)] text-xs font-semibold">Cancel</button>
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={handleMarkAttendance} disabled={isMarkingAttendance}
                            className="flex-1 h-10 rounded-xl bg-green-500 text-white text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5">
                            {isMarkingAttendance ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            Mark Present
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Attendance Content */}
                  {attendanceHistory.length === 0 ? (
                    <div className="text-center py-10 rounded-2xl border border-dashed border-[var(--border)]">
                      <Footprints className="h-8 w-8 text-[var(--muted)] mx-auto mb-2 opacity-30" />
                      <p className="text-sm text-[var(--muted)]">No attendance records found</p>
                    </div>
                  ) : showAttendanceGraph ? (
                    <div className="rounded-2xl border border-[var(--border)] p-4">
                      <AttendanceChart records={attendanceHistory.slice(0, 30)} />
                      <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-[var(--muted)]">
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Present</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-500" /> Absent</span>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)]">
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-[var(--muted)] uppercase">Date</th>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-[var(--muted)] uppercase">Time In</th>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-[var(--muted)] uppercase">Time Out</th>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-[var(--muted)] uppercase">Weight In</th>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-[var(--muted)] uppercase">Weight Out</th>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-[var(--muted)] uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {attendanceHistory.map((record) => (
                            <tr key={record.id} className="hover:bg-[var(--surface-secondary)]/50">
                              <td className="px-3 py-2 text-xs text-[var(--foreground)]">{formatDate(record.date)}</td>
                              <td className="px-3 py-2 text-xs text-[var(--muted)]">{formatTime(record.timeIn)}</td>
                              <td className="px-3 py-2 text-xs text-[var(--muted)]">{formatTime(record.timeOut)}</td>
                              <td className="px-3 py-2 text-xs text-[var(--muted)]">{record.weightIn ?? '--'}</td>
                              <td className="px-3 py-2 text-xs text-[var(--muted)]">{record.weightOut ?? '--'}</td>
                              <td className="px-3 py-2">
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                  record.isPresent ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${record.isPresent ? 'bg-green-500' : 'bg-gray-500'}`} />
                                  {record.isPresent ? 'Present' : 'Absent'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Payments & Plans */}
              {activeTab === 'plans' && (
                <div className="space-y-4">
                  {/* Active Plan */}
                  {getActivePlan() && (
                    <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                      <p className="text-xs font-semibold text-green-500 uppercase mb-1">Current Plan</p>
                      <p className="font-bold text-[var(--foreground)]">{getActivePlan()?.plan?.name || 'Active Plan'}</p>
                      <p className="text-xs text-[var(--muted)]">
                        Ends: {formatDate(getActivePlan()?.endDate || '')}
                      </p>
                    </div>
                  )}

                  {/* Recent Payments */}
                  {recentPayments.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-[var(--muted)] uppercase mb-2 flex items-center gap-1">
                        <History className="h-3 w-3" /> Recent Payments
                      </h3>
                      <div className="space-y-2">
                        {recentPayments.slice(0, 3).map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--field-background)]">
                            <div className="flex items-center gap-2">
                              {getPaymentIcon(payment.paymentMethod)}
                              <div>
                                <p className="text-xs font-semibold">₹{payment.amount}</p>
                                <p className="text-[10px] text-[var(--muted)]">{formatDate(payment.paymentDate)}</p>
                              </div>
                            </div>
                            <span className="text-[10px] text-[var(--muted)]">+{payment.daysAdded} days</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Select Plan */}
                  {canUpdate && (
                    <>
                      <h3 className="text-xs font-semibold text-[var(--muted)] uppercase mb-2">Assign a Plan</h3>
                      <div className="space-y-2">
                        {availablePlans.filter(p => p.isActive).map((plan) => (
                          <motion.button key={plan.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                            onClick={() => handleSelectPlan(plan)}
                            className="w-full text-left p-3.5 rounded-xl border border-[var(--border)] hover:border-blue-500 bg-[var(--field-background)] transition-all">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-sm text-[var(--foreground)]">{plan.name}</p>
                                <p className="text-xs text-[var(--muted)]">
                                  {plan.billingDays >= 30 ? `${plan.billingDays / 30} month${plan.billingDays >= 60 ? 's' : ''}` : `${plan.billingDays} day${plan.billingDays > 1 ? 's' : ''}`}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-baseline gap-0.5">
                                  <IndianRupee className="h-3 w-3 text-[var(--foreground)]" />
                                  <span className="text-lg font-black">{plan.offerPrice || plan.price}</span>
                                </div>
                                {plan.offerPrice && (
                                  <span className="text-[10px] text-[var(--muted)] line-through">₹{plan.price}</span>
                                )}
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
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
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
              className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl z-10">

              <div className="w-10 h-1 rounded-full bg-[var(--border)] mx-auto mb-6 sm:hidden" />

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-[var(--foreground)]">Record Payment</h2>
                  <p className="text-xs text-[var(--muted)]">{selectedPlan.name} • {selectedMember.firstName}</p>
                </div>
                <button onClick={() => setShowPaymentModal(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-secondary)]">
                  <X className="h-5 w-5 text-[var(--muted)]" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] uppercase mb-1.5">Amount (₹)</label>
                  <input type="number" value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-bold text-lg outline-none focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] uppercase mb-1.5">Days to Add</label>
                  <input type="number" value={paymentForm.daysAdded}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, daysAdded: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-bold text-lg outline-none focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] uppercase mb-1.5">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['cash', 'upi', 'card'] as const).map((method) => (
                      <button key={method} onClick={() => setPaymentForm(prev => ({ ...prev, paymentMethod: method }))}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          paymentForm.paymentMethod === method
                            ? 'bg-blue-500 text-white'
                            : 'bg-[var(--field-background)] text-[var(--muted)] border border-[var(--border)]'
                        }`}>
                        {getPaymentIcon(method)}
                        {method.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] uppercase mb-1.5">Notes (Optional)</label>
                  <input type="text" value={paymentForm.notes}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any notes..."
                    className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] text-sm outline-none focus:border-blue-500" />
                </div>

                {!isOnline && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <WifiOff className="h-4 w-4 text-yellow-500 shrink-0" />
                    <p className="text-xs text-yellow-500 font-medium">
                      Payment will be saved offline and synced when connected.
                    </p>
                  </div>
                )}

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSavePayment} disabled={isSaving || !paymentForm.amount || !paymentForm.daysAdded}
                  className="w-full h-12 rounded-xl bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <>{isOnline ? <CheckCircle2 className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                    {isOnline ? 'Save Payment' : 'Save Offline'}
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MembersClient;
