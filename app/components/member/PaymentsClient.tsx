'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  AlertCircle,
  IndianRupee,
  CreditCard,
  Banknote,
  Smartphone,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  History,
  Filter,
  ChevronRight,
  Download,
  Receipt
} from 'lucide-react';

interface Payment {
  id: string;
  clerkUserId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  daysAdded: number;
  status: string;
  notes: string | null;
  isSynced: boolean;
}

interface PaymentStats {
  totalSpent: number;
  totalPayments: number;
  averagePayment: number;
  lastPayment: Payment | null;
  thisMonthSpent: number;
  lastMonthSpent: number;
  paymentMethods: {
    cash: number;
    upi: number;
    card: number;
  };
  monthlyBreakdown: {
    month: string;
    amount: number;
    count: number;
  }[];
}

interface PaymentsClientProps {
  initialPayments: Payment[];
  initialStats: PaymentStats | null;
  error?: string;
}

export default function PaymentsClient({ initialPayments, initialStats, error: initialError }: PaymentsClientProps) {
  const [payments] = useState<Payment[]>(initialPayments);
  const [stats] = useState<PaymentStats | null>(initialStats);
  const [error] = useState(initialError || '');
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);

  const filteredPayments = useMemo(() => {
    let filtered = payments;
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    switch (filter) {
      case 'thisMonth':
        filtered = payments.filter(p => {
          const d = new Date(p.paymentDate);
          return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        });
        break;
      case 'lastMonth':
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
        filtered = payments.filter(p => {
          const d = new Date(p.paymentDate);
          return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        });
        break;
      case 'cash':
        filtered = payments.filter(p => p.paymentMethod === 'cash');
        break;
      case 'upi':
        filtered = payments.filter(p => p.paymentMethod === 'upi');
        break;
      case 'card':
        filtered = payments.filter(p => p.paymentMethod === 'card');
        break;
    }

    return filtered;
  }, [filter, payments]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getPaymentIcon = (method: string, size = 'h-4 w-4') => {
    switch (method) {
      case 'cash': return <Banknote className={size} />;
      case 'upi': return <Smartphone className={size} />;
      case 'card': return <CreditCard className={size} />;
      default: return <CreditCard className={size} />;
    }
  };

  const getPaymentColor = (method: string) => {
    switch (method) {
      case 'cash': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'upi': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'card': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
      case 'pending': return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
      case 'failed': return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      default: return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    }
  };

  const getSpendingTrend = () => {
    if (!stats) return 0;
    return stats.thisMonthSpent - stats.lastMonthSpent;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 py-6 pb-24">
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .receipt-print-area, .receipt-print-area * { visibility: visible; }
          .receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)]">My Payments</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Track your payment history</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            filter !== 'all'
              ? 'bg-green-500 text-white'
              : 'bg-[var(--field-background)] text-[var(--muted)] border border-[var(--border)]'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filter
          {filter !== 'all' && <span className="text-xs">•</span>}
        </motion.button>
      </div>

      {/* Filter Chips */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden no-print"
          >
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'thisMonth', label: 'This Month' },
                { value: 'lastMonth', label: 'Last Month' },
                { value: 'cash', label: 'Cash' },
                { value: 'upi', label: 'UPI' },
                { value: 'card', label: 'Card' },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filter === f.value
                      ? 'bg-green-500 text-white'
                      : 'bg-[var(--field-background)] text-[var(--muted)] border border-[var(--border)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 no-print"
          >
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-500 font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 no-print">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-500 text-xs font-medium mb-2">
              <IndianRupee className="h-3.5 w-3.5" /> Total Spent
            </div>
            <span className="text-2xl font-black text-[var(--foreground)]">₹{stats.totalSpent.toLocaleString()}</span>
            <p className="text-xs text-[var(--muted)] mt-1">{stats.totalPayments} payments</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 text-blue-500 text-xs font-medium mb-2">
              <Calendar className="h-3.5 w-3.5" /> This Month
            </div>
            <span className="text-2xl font-black text-[var(--foreground)]">₹{stats.thisMonthSpent.toLocaleString()}</span>
            <div className="flex items-center gap-1 mt-1">
              {getSpendingTrend() !== 0 && (
                <>
                  {getSpendingTrend() > 0 ? <TrendingUp className="h-3 w-3 text-red-500" /> : <TrendingDown className="h-3 w-3 text-green-500" />}
                  <span className={`text-xs font-medium ${getSpendingTrend() > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    ₹{Math.abs(getSpendingTrend()).toLocaleString()}
                  </span>
                </>
              )}
              <span className="text-xs text-[var(--muted)]">vs last month</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 text-purple-500 text-xs font-medium mb-2">
              <TrendingUp className="h-3.5 w-3.5" /> Average Payment
            </div>
            <span className="text-2xl font-black text-[var(--foreground)]">₹{stats.averagePayment.toLocaleString()}</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
            <div className="flex items-center gap-2 text-orange-500 text-xs font-medium mb-2">
              <Clock className="h-3.5 w-3.5" /> Last Payment
            </div>
            {stats.lastPayment ? (
              <>
                <span className="text-2xl font-black text-[var(--foreground)]">₹{stats.lastPayment.amount.toLocaleString()}</span>
                <p className="text-xs text-[var(--muted)] mt-1">{formatDate(stats.lastPayment.paymentDate)}</p>
              </>
            ) : (
              <span className="text-sm text-[var(--muted)]">No payments yet</span>
            )}
          </motion.div>
        </div>
      )}

      {/* Payment Methods Breakdown */}
      {stats && (stats.paymentMethods.cash > 0 || stats.paymentMethods.upi > 0 || stats.paymentMethods.card > 0) && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 no-print">
          <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">Payment Methods</h3>
          <div className="space-y-3">
            {[
              { method: 'cash', label: 'Cash', value: stats.paymentMethods.cash, color: 'bg-green-500' },
              { method: 'upi', label: 'UPI', value: stats.paymentMethods.upi, color: 'bg-purple-500' },
              { method: 'card', label: 'Card', value: stats.paymentMethods.card, color: 'bg-blue-500' },
            ].filter(m => m.value > 0).map((method) => (
              <div key={method.method}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {getPaymentIcon(method.method, 'h-3.5 w-3.5')}
                    <span className="text-xs font-medium text-[var(--muted)]">{method.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-[var(--foreground)]">
                    {stats.totalPayments > 0 ? Math.round((method.value / stats.totalPayments) * 100) : 0}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--field-background)] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.totalPayments > 0 ? (method.value / stats.totalPayments) * 100 : 0}%` }}
                    className={`h-full rounded-full ${method.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="no-print">
        <h3 className="text-sm font-bold text-[var(--foreground)] mb-3 flex items-center gap-2">
          <History className="h-4 w-4 text-green-500" />
          Payment History
          <span className="text-xs text-[var(--muted)] font-normal">
            ({filteredPayments.length} {filteredPayments.length === 1 ? 'payment' : 'payments'})
          </span>
        </h3>

        {filteredPayments.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]">
            <Receipt className="h-10 w-10 text-[var(--muted)] mx-auto mb-3 opacity-30" />
            <p className="text-sm text-[var(--muted)]">
              {filter !== 'all' ? 'No payments found for this filter' : 'No payment history yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPayments.map((payment, index) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => { setSelectedPayment(payment); setShowReceipt(true); }}
                className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-green-500/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${getPaymentColor(payment.paymentMethod)}`}>
                      {getPaymentIcon(payment.paymentMethod)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[var(--foreground)]">
                          ₹{payment.amount.toLocaleString()}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${
                          payment.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                          payment.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-red-500/10 text-red-500'
                        }`}>
                          {getStatusIcon(payment.status)}
                          {payment.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[var(--muted)]">{formatDate(payment.paymentDate)}</span>
                        <span className="text-[10px] text-[var(--muted)]">•</span>
                        <span className="text-xs text-green-500 font-medium">+{payment.daysAdded} days</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!payment.isSynced && (
                      <span className="text-[10px] text-yellow-500 font-medium">Pending sync</span>
                    )}
                    <ChevronRight className="h-4 w-4 text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Receipt Modal */}
      <AnimatePresence>
        {showReceipt && selectedPayment && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowReceipt(false); setSelectedPayment(null); }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl z-10"
            >
              <div className="w-10 h-1 rounded-full bg-[var(--border)] mx-auto mb-6 sm:hidden no-print" />

              {/* Receipt Content */}
              <div ref={receiptRef} className="receipt-print-area">
                <div className="text-center mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 mx-auto mb-3">
                    <Receipt className="h-8 w-8 text-green-500" />
                  </div>
                  <h2 className="text-lg font-bold text-[var(--foreground)]">Payment Receipt</h2>
                  <p className="text-xs text-[var(--muted)] mt-1">Receipt #{selectedPayment.id.slice(-8).toUpperCase()}</p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--field-background)]">
                    <span className="text-xs text-[var(--muted)]">Amount</span>
                    <span className="text-lg font-black text-[var(--foreground)]">₹{selectedPayment.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--field-background)]">
                    <span className="text-xs text-[var(--muted)]">Method</span>
                    <span className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                      {getPaymentIcon(selectedPayment.paymentMethod, 'h-4 w-4')}
                      {selectedPayment.paymentMethod.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--field-background)]">
                    <span className="text-xs text-[var(--muted)]">Days Added</span>
                    <span className="text-sm font-semibold text-green-500">+{selectedPayment.daysAdded} days</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--field-background)]">
                    <span className="text-xs text-[var(--muted)]">Date</span>
                    <span className="text-sm font-semibold text-[var(--foreground)]">{formatDate(selectedPayment.paymentDate)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--field-background)]">
                    <span className="text-xs text-[var(--muted)]">Time</span>
                    <span className="text-sm font-semibold text-[var(--foreground)]">{formatTime(selectedPayment.paymentDate)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--field-background)]">
                    <span className="text-xs text-[var(--muted)]">Status</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      selectedPayment.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                      selectedPayment.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {getStatusIcon(selectedPayment.status)}
                      {selectedPayment.status}
                    </span>
                  </div>
                  {selectedPayment.notes && (
                    <div className="p-3 rounded-xl bg-[var(--field-background)]">
                      <span className="text-xs text-[var(--muted)] block mb-1">Notes</span>
                      <span className="text-sm text-[var(--foreground)]">{selectedPayment.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 no-print">
                <button
                  onClick={() => { setShowReceipt(false); setSelectedPayment(null); }}
                  className="flex-1 h-12 rounded-xl border-2 border-[var(--border)] bg-[var(--field-background)] text-[var(--foreground)] font-semibold hover:bg-[var(--surface-secondary)] transition-colors"
                >
                  Close
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 px-4 h-12 rounded-xl bg-green-500 text-white font-semibold"
                >
                  <Download className="h-4 w-4" />
                  Print
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
