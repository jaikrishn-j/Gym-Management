"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  MessageSquare, Send, AlertCircle, Loader2, CheckCircle2,
  Users, Shield, Globe, History, Calendar, X
} from "lucide-react"
import { createBroadcast, getSentBroadcasts } from "@/app/admin/broadcast/action"

const targetOptions = [
  { value: 'staff' as const, label: 'Staff', icon: Shield, desc: 'Send to all staff members' },
  { value: 'members' as const, label: 'Members', icon: Users, desc: 'Send to all gym members' },
  { value: 'both' as const, label: 'Both', icon: Globe, desc: 'Send to everyone' },
]

const targetLabels: Record<string, { label: string, color: string }> = {
  staff: { label: 'Staff', color: 'bg-blue-500/10 text-blue-500' },
  members: { label: 'Members', color: 'bg-green-500/10 text-green-500' },
  both: { label: 'Both', color: 'bg-purple-500/10 text-purple-500' },
}

interface BroadcastItem {
  id: string
  title: string
  message: string
  target: string
  sentBy: string
  createdAt: Date
}

export default function BroadcastClient() {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [target, setTarget] = useState<'staff' | 'members' | 'both'>('both')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [history, setHistory] = useState<BroadcastItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null)

  const fetchHistory = async () => {
    setLoadingHistory(true)
    const result = await getSentBroadcasts()
    if (result.success) setHistory(result.data)
    setLoadingHistory(false)
  }

  useEffect(() => { fetchHistory() }, [])

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return
    try {
      setSending(true)
      setError("")
      setSuccess("")
      const result = await createBroadcast({ title: title.trim(), message: message.trim(), target })
      if (!result.success) throw new Error(result.error || "Failed to send")
      setSuccess("Broadcast sent successfully!")
      setTitle("")
      setMessage("")
      setTarget('both')
      fetchHistory()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 py-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent rounded-2xl border border-[var(--border)] p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-blue-500 shadow-lg shadow-blue-500/10">
              <MessageSquare className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[var(--foreground)]">Send Broadcast</h1>
              <p className="text-sm text-[var(--muted)]">Send an announcement to staff, members, or everyone</p>
            </div>
          </div>
        </div>

        {/* Stat Pills */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--border)]/50">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <Send className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] text-[var(--muted)] font-semibold uppercase">Total Sent</p>
              <p className="text-sm font-bold text-[var(--foreground)]">{history.length}</p>
            </div>
          </div>
          <div className="w-px h-8 bg-[var(--border)]" />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
              <Globe className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <p className="text-[10px] text-[var(--muted)] font-semibold uppercase">Latest</p>
              <p className="text-sm font-bold text-[var(--foreground)]">{history.length > 0 ? new Date(history[0].createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="flex items-center gap-3 rounded-2xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 p-4"
        >
          <AlertCircle className="h-5 w-5 text-[var(--danger)] shrink-0" />
          <p className="text-sm text-[var(--danger)] font-medium flex-1">{error}</p>
          <motion.button
            whileHover={{ rotate: 90 }}
            onClick={() => setError("")}
            className="shrink-0 rounded-full p-1 hover:bg-[var(--danger)]/10 transition-colors"
          >
            <X className="h-4 w-4 text-[var(--danger)]" />
          </motion.button>
        </motion.div>
      )}

      {/* Success Banner */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="flex items-center gap-3 rounded-2xl bg-green-500/10 border border-green-500/20 p-4"
        >
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <p className="text-sm text-green-500 font-medium flex-1">{success}</p>
          <motion.button
            whileHover={{ rotate: 90 }}
            onClick={() => setSuccess("")}
            className="shrink-0 rounded-full p-1 hover:bg-green-500/10 transition-colors"
          >
            <X className="h-4 w-4 text-green-500" />
          </motion.button>
        </motion.div>
      )}

      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="backdrop-blur-xl bg-[var(--surface)]/80 border border-[var(--border)]/50 rounded-2xl p-6 space-y-6"
      >
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, type: 'spring', stiffness: 200, damping: 20 }}
        >
          <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-1.5 block">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title..."
            className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all"
          />
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
        >
          <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-1.5 block">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
            placeholder="Write your announcement..."
            rows={5}
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all resize-none"
          />
          <div className="flex justify-end mt-1">
            <span className={`text-[11px] font-medium ${message.length >= 500 ? 'text-red-500' : 'text-[var(--muted)]'}`}>
              {message.length}/500
            </span>
          </div>
        </motion.div>

        {/* Target */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 20 }}
        >
          <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-3 block">Send to</label>
          <div className="grid grid-cols-3 gap-3">
            {targetOptions.map((opt) => {
              const Icon = opt.icon
              const selected = target === opt.value
              return (
                <motion.button
                  key={opt.value}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setTarget(opt.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    selected
                      ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                      : 'border-[var(--border)] bg-[var(--field-background)]/50 hover:border-blue-500/30'
                  }`}
                >
                  <Icon className={`h-6 w-6 ${selected ? 'text-blue-500' : 'text-[var(--muted)]'}`} />
                  <span className={`text-sm font-semibold ${selected ? 'text-blue-500' : 'text-[var(--foreground)]'}`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-[var(--muted)] text-center leading-tight">{opt.desc}</span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </motion.div>

      {/* Send Button */}
      <motion.button
        whileHover={!sending && title.trim() && message.trim() ? { scale: 1.02, boxShadow: '0 0 30px rgba(59,130,246,0.3)' } : {}}
        whileTap={{ scale: 0.95 }}
        onClick={handleSend}
        disabled={sending || !title.trim() || !message.trim()}
        className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
      >
        {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        {sending ? "Sending..." : "Send Broadcast"}
      </motion.button>

      {/* History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
        className="backdrop-blur-xl bg-[var(--surface)]/80 border border-[var(--border)]/50 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <History className="h-5 w-5 text-[var(--muted)]" />
          <h2 className="font-bold text-[var(--foreground)]">Sent History</h2>
          {loadingHistory && <Loader2 className="h-4 w-4 animate-spin text-[var(--muted)]" />}
        </div>

        {/* Loading Skeleton */}
        {loadingHistory && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-[var(--border)]/50 p-4 space-y-2"
              >
                <div className="h-4 w-2/3 rounded-md bg-[var(--surface-secondary)] animate-pulse" />
                <div className="h-3 w-full rounded-md bg-[var(--surface-secondary)] animate-pulse" />
                <div className="h-3 w-1/3 rounded-md bg-[var(--surface-secondary)] animate-pulse" />
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loadingHistory && history.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="text-center py-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 15 }}
              className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[var(--surface-secondary)] mx-auto mb-3"
            >
              <History className="h-7 w-7 text-[var(--muted)]" />
            </motion.div>
            <p className="text-sm font-semibold text-[var(--foreground)]">No broadcasts sent yet</p>
            <p className="text-xs text-[var(--muted)] mt-1">Your first broadcast will appear here</p>
          </motion.div>
        )}

        {/* History List */}
        {!loadingHistory && history.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history.map((b, idx) => {
              const t = targetLabels[b.target] || { label: b.target, color: 'bg-gray-500/10 text-gray-500' }
              const isLong = b.message.length > 100
              const isExpanded = expandedMessage === b.id
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
                  whileHover={{ x: 4, backgroundColor: 'rgba(59,130,246,0.03)' }}
                  className="backdrop-blur-sm bg-[var(--surface-secondary)]/50 border border-[var(--border)]/50 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--foreground)]">{b.title}</p>
                      <p className="text-xs text-[var(--muted)] mt-1">
                        {isLong && !isExpanded ? `${b.message.slice(0, 100)}...` : b.message}
                      </p>
                      {isLong && (
                        <button
                          onClick={() => setExpandedMessage(isExpanded ? null : b.id)}
                          className="text-xs font-semibold text-blue-500 hover:text-blue-400 mt-1 transition-colors"
                        >
                          {isExpanded ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold ${t.color}`}>
                      {t.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="h-3 w-3 text-[var(--muted)]" />
                    <span className="text-[10px] text-[var(--muted)]">
                      {new Date(b.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
