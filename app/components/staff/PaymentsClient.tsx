'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Loader2, IndianRupee, CreditCard, Calendar, ChevronLeft, ChevronRight,
  X, User, AlertCircle, TrendingUp, Wallet, Building2, Smartphone, Landmark,
  Banknote, CheckCircle2, Clock, Hash, FileText, UserCircle,
  QrCode, Receipt, SlidersHorizontal
} from 'lucide-react'
import type { EnrichedPayment, PaymentStats, PaymentsResponse } from '@/app/staff/payments/action'

interface PaymentsClientProps {
  initialPayments: EnrichedPayment[]
  initialTotalCount: number
  initialStats: PaymentStats | null
  readAllPayments: (
    page: number,
    pageSize: number,
    filters?: { search?: string; paymentMethod?: string; paymentSource?: string },
  ) => Promise<{ success: boolean; data?: PaymentsResponse; error?: string }>
}

const PAGE_SIZES = [20, 50, 100]

const methodConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  cash: { label: 'Cash', icon: Banknote, color: 'text-green-500' },
  card: { label: 'Card', icon: CreditCard, color: 'text-blue-500' },
  upi: { label: 'UPI', icon: QrCode, color: 'text-purple-500' },
  razorpay: { label: 'Razorpay', icon: Smartphone, color: 'text-cyan-500' },
  bank_transfer: { label: 'Bank Transfer', icon: Landmark, color: 'text-orange-500' },
}

const sourceConfig: Record<string, { label: string; color: string }> = {
  manual: { label: 'Manual', color: 'bg-gray-500/10 text-gray-500' },
  razorpay: { label: 'Online', color: 'bg-cyan-500/10 text-cyan-500' },
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function PaymentsClient({
  initialPayments,
  initialTotalCount,
  initialStats,
  readAllPayments,
}: PaymentsClientProps) {
  const accentColor = 'blue'
  const accentVar = 'var(--accent)'

  const [payments, setPayments] = useState<EnrichedPayment[]>(initialPayments)
  const [totalCount, setTotalCount] = useState(initialTotalCount)
  const [stats, setStats] = useState<PaymentStats | null>(initialStats)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMethod, setFilterMethod] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<EnrichedPayment | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const fetchPayments = useCallback(async (p: number, ps: number, search: string, method: string, source: string) => {
    setLoading(true)
    setError('')
    try {
      const filters: { search?: string; paymentMethod?: string; paymentSource?: string } = {}
      if (search) filters.search = search
      if (method) filters.paymentMethod = method
      if (source) filters.paymentSource = source

      const result = await readAllPayments(p, ps, filters)
      if (!result.success) throw new Error(result.error || 'Failed to fetch')
      setPayments(result.data?.payments ?? [])
      setTotalCount(result.data?.totalCount ?? 0)
      setStats(result.data?.stats ?? null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [readAllPayments])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchPayments(1, pageSize, searchTerm, filterMethod, filterSource)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, pageSize, filterMethod, filterSource, fetchPayments])

  useEffect(() => {
    fetchPayments(page, pageSize, searchTerm, filterMethod, filterSource)
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  const getMethodBadge = (method: string) => {
    const config = methodConfig[method]
    if (!config) return <span className="text-xs text-[var(--muted)]">{method}</span>
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${config.color}`}>
        <Icon className="h-3.5 w-3.5" /> {config.label}
      </span>
    )
  }

  const getSourceBadge = (source: string) => {
    const config = sourceConfig[source]
    if (!config) return <span className="text-xs text-[var(--muted)]">{source}</span>
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-semibold">
          <CheckCircle2 className="h-3 w-3" /> Completed
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-semibold">
        <Clock className="h-3 w-3" /> {status}
      </span>
    )
  }

  const paymentMethods = [...new Set(['cash', 'card', 'upi', 'razorpay', 'bank_transfer', ...payments.map(p => p.paymentMethod)])]
  const paymentSources = [...new Set(['manual', 'razorpay', ...payments.map(p => p.paymentSource)])]

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
            <Wallet className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--foreground)]">Payments</h1>
            <p className="text-sm text-[var(--muted)]">Transaction history & revenue overview</p>
          </div>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-500 font-medium">{error}</p>
          <button onClick={() => setError('')} className="ml-auto"><X className="h-4 w-4 text-red-500" /></button>
        </motion.div>
      )}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div whileHover={{ scale: 1.02 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex items-center gap-2 text-[var(--muted)] text-xs font-semibold uppercase mb-2">
              <IndianRupee className="h-4 w-4" /> Total Revenue
            </div>
            <p className="text-2xl font-black text-[var(--foreground)]">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-xs text-[var(--muted)] mt-1">{stats.totalPayments} transactions</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex items-center gap-2 text-[var(--muted)] text-xs font-semibold uppercase mb-2">
              <TrendingUp className="h-4 w-4" /> This Month
            </div>
            <p className="text-2xl font-black text-blue-500">{formatCurrency(stats.thisMonthRevenue)}</p>
            <p className="text-xs text-[var(--muted)] mt-1">{stats.thisMonthPayments} payments</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex items-center gap-2 text-[var(--muted)] text-xs font-semibold uppercase mb-2">
              <CreditCard className="h-4 w-4" /> Top Method
            </div>
            <p className="text-2xl font-black text-[var(--foreground)]">
              {Object.entries(stats.methodBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A'}
            </p>
            <p className="text-xs text-[var(--muted)] mt-1 capitalize">
              {Object.entries(stats.methodBreakdown).length} method{Object.entries(stats.methodBreakdown).length !== 1 ? 's' : ''}
            </p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex items-center gap-2 text-[var(--muted)] text-xs font-semibold uppercase mb-2">
              <Wallet className="h-4 w-4" /> Source Split
            </div>
            <div className="space-y-1.5">
              {Object.entries(stats.sourceBreakdown).map(([source, amount]) => (
                <div key={source} className="flex items-center justify-between">
                  <span className="text-xs text-[var(--muted)] capitalize">{source}</span>
                  <span className="text-xs font-semibold">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by member name or email..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted)] font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-11 px-4 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all ${
              showFilters || filterMethod || filterSource
                ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                : 'border-[var(--field-border)] bg-[var(--field-background)] text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
            {(filterMethod || filterSource) && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold">
                {(filterMethod ? 1 : 0) + (filterSource ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden">
              <div className="pt-2 flex flex-wrap gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-[var(--muted)] uppercase block mb-1.5">Payment Method</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setFilterMethod('')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        !filterMethod ? 'bg-blue-500 text-white' : 'bg-[var(--field-background)] text-[var(--muted)] hover:text-[var(--foreground)]'
                      }`}>All</button>
                    {paymentMethods.map((m) => (
                      <button key={m} onClick={() => setFilterMethod(m === filterMethod ? '' : m)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                          filterMethod === m ? 'bg-blue-500 text-white' : 'bg-[var(--field-background)] text-[var(--muted)] hover:text-[var(--foreground)]'
                        }`}>{m.replace(/_/g, ' ')}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[var(--muted)] uppercase block mb-1.5">Payment Source</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setFilterSource('')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        !filterSource ? 'bg-blue-500 text-white' : 'bg-[var(--field-background)] text-[var(--muted)] hover:text-[var(--foreground)]'
                      }`}>All</button>
                    {paymentSources.map((s) => (
                      <button key={s} onClick={() => setFilterSource(s === filterSource ? '' : s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                          filterSource === s ? 'bg-blue-500 text-white' : 'bg-[var(--field-background)] text-[var(--muted)] hover:text-[var(--foreground)]'
                        }`}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16">
            <Receipt className="h-12 w-12 text-[var(--muted)] mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium text-[var(--foreground)]">No payments found</p>
            <p className="text-xs text-[var(--muted)] mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)]">
                  <th className="px-4 py-3.5 text-left text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3.5 text-left text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">Member</th>
                  <th className="px-4 py-3.5 text-right text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3.5 text-left text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">Method</th>
                  <th className="px-4 py-3.5 text-left text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">Source</th>
                  <th className="px-4 py-3.5 text-left text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">Plan</th>
                  <th className="px-4 py-3.5 text-left text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3.5 text-right text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {payments.map((payment, index) => (
                  <motion.tr
                    key={payment.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => setSelectedPayment(payment)}
                    className="hover:bg-[var(--surface-secondary)]/50 transition-colors cursor-pointer"
                  >
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-sm text-[var(--foreground)]">{formatDate(payment.paymentDate)}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {payment.memberImageUrl ? (
                          <img src={payment.memberImageUrl} alt="" className="h-6 w-6 rounded-lg object-cover border border-[var(--border)] shrink-0" />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                            <User className="h-3 w-3" />
                          </div>
                        )}
                        <span className="text-sm font-semibold text-[var(--foreground)] truncate max-w-[160px]">{payment.memberName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <span className="text-sm font-bold text-[var(--foreground)]">{formatCurrency(payment.amount)}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{getMethodBadge(payment.paymentMethod)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{getSourceBadge(payment.paymentSource)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-sm text-[var(--foreground)]">{payment.planName ?? '—'}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{getStatusBadge(payment.status)}</td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <span className="text-sm font-medium text-[var(--foreground)]">{payment.daysAdded}d</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] bg-[var(--surface-secondary)]/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted)]">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="h-8 px-2 rounded-lg border border-[var(--field-border)] bg-[var(--field-background)] text-xs font-medium text-[var(--foreground)] outline-none focus:border-blue-500"
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-xs text-[var(--muted)] ml-2">
              {totalCount === 0 ? '0' : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, totalCount)}`} of {totalCount}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-secondary)] disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const startPage = Math.max(1, Math.min(page - 2, totalPages - 4))
              const p = startPage + i
              if (p > totalPages) return null
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-lg text-xs font-semibold transition-all ${
                    p === page ? 'bg-blue-500 text-white' : 'hover:bg-[var(--surface-secondary)] text-[var(--muted)]'
                  }`}>{p}</button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-secondary)] disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {selectedPayment && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedPayment(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl z-10">
              
              <div className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                    <Receipt className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--foreground)]">Transaction Details</h2>
                    <p className="text-[10px] text-[var(--muted)] font-mono">{selectedPayment.id.slice(0, 12)}...</p>
                  </div>
                </div>
                <button onClick={() => setSelectedPayment(null)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-secondary)] transition-colors">
                  <X className="h-5 w-5 text-[var(--muted)]" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-6">
                <div className="text-center py-4">
                  <p className="text-[10px] text-[var(--muted)] font-semibold uppercase mb-1">Amount</p>
                  <p className="text-4xl font-black text-[var(--foreground)]">{formatCurrency(selectedPayment.amount)}</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {getStatusBadge(selectedPayment.status)}
                    {getSourceBadge(selectedPayment.paymentSource)}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--field-background)]/50 p-4">
                  <div className="flex items-center gap-3">
                    {selectedPayment.memberImageUrl ? (
                      <img src={selectedPayment.memberImageUrl} alt="" className="h-12 w-12 rounded-xl object-cover border border-[var(--border)]" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                        <UserCircle className="h-6 w-6 text-blue-500" />
                      </div>
                    )}
                    <div>
                      <p className="text-base font-bold text-[var(--foreground)]">{selectedPayment.memberName}</p>
                      <p className="text-xs text-[var(--muted)]">{selectedPayment.memberEmail}</p>
                      <p className="text-[10px] text-[var(--muted)] font-mono mt-0.5">ID: {selectedPayment.clerkUserId.slice(0, 12)}...</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--field-background)]/30 p-3.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--muted)] uppercase mb-1.5">
                      <CreditCard className="h-3 w-3" /> Payment Method
                    </div>
                    <div className="text-sm font-semibold text-[var(--foreground)]">{getMethodBadge(selectedPayment.paymentMethod)}</div>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--field-background)]/30 p-3.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--muted)] uppercase mb-1.5">
                      <Calendar className="h-3 w-3" /> Date & Time
                    </div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{formatDateTime(selectedPayment.paymentDate)}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--field-background)]/30 p-3.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--muted)] uppercase mb-1.5">
                      <Hash className="h-3 w-3" /> Days Added
                    </div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{selectedPayment.daysAdded} day{selectedPayment.daysAdded !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--field-background)]/30 p-3.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--muted)] uppercase mb-1.5">
                      <FileText className="h-3 w-3" /> Plan
                    </div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{selectedPayment.planName ?? 'N/A'}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--field-background)]/30 p-3.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--muted)] uppercase mb-1.5">
                    <UserCircle className="h-3 w-3" /> Recorded By
                  </div>
                  {selectedPayment.recorderName ? (
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{selectedPayment.recorderName}</p>
                      <p className="text-xs text-[var(--muted)]">{selectedPayment.recorderEmail}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--muted)]">System / Online Payment</p>
                  )}
                </div>

                {selectedPayment.notes && (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--field-background)]/30 p-3.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--muted)] uppercase mb-1.5">
                      <FileText className="h-3 w-3" /> Notes
                    </div>
                    <p className="text-sm text-[var(--foreground)]">{selectedPayment.notes}</p>
                  </div>
                )}

                <div className="text-center pt-2 border-t border-[var(--border)]">
                  <p className="text-[10px] text-[var(--muted)] font-mono">Transaction ID: {selectedPayment.id}</p>
                  <p className="text-[10px] text-[var(--muted)] font-mono mt-0.5">
                    Created: {formatDateTime(selectedPayment.createdAt)}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
