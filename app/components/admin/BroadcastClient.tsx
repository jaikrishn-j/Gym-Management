"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  MessageSquare, Send, AlertCircle, Loader2, CheckCircle2,
  Users, Shield, Globe, History, Calendar
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
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
          <MessageSquare className="h-6 w-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)]">Send Broadcast</h1>
          <p className="text-sm text-[var(--muted)]">Send an announcement to staff, members, or everyone</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-500 font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-2xl bg-green-500/10 border border-green-500/20 p-4">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <p className="text-sm text-green-500 font-medium">{success}</p>
        </div>
      )}

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-6">
        <div>
          <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-1.5 block">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title..."
            className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-1.5 block">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your announcement..."
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-3 block">Send to</label>
          <div className="grid grid-cols-3 gap-3">
            {targetOptions.map((opt) => {
              const Icon = opt.icon
              const selected = target === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setTarget(opt.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    selected
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-[var(--border)] bg-[var(--field-background)]/50 hover:border-blue-500/30'
                  }`}
                >
                  <Icon className={`h-6 w-6 ${selected ? 'text-blue-500' : 'text-[var(--muted)]'}`} />
                  <span className={`text-sm font-semibold ${selected ? 'text-blue-500' : 'text-[var(--foreground)]'}`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-[var(--muted)] text-center leading-tight">{opt.desc}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSend}
        disabled={sending || !title.trim() || !message.trim()}
        className="w-full h-14 rounded-2xl bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        {sending ? "Sending..." : "Send Broadcast"}
      </motion.button>

      {/* History */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <History className="h-5 w-5 text-[var(--muted)]" />
          <h2 className="font-bold text-[var(--foreground)]">Sent History</h2>
          {loadingHistory && <Loader2 className="h-4 w-4 animate-spin text-[var(--muted)]" />}
        </div>

        {!loadingHistory && history.length === 0 && (
          <p className="text-sm text-[var(--muted)]">No broadcasts sent yet.</p>
        )}

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {history.map((b) => {
            const t = targetLabels[b.target] || { label: b.target, color: 'bg-gray-500/10 text-gray-500' }
            return (
              <div key={b.id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--field-background)]/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{b.title}</p>
                    <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">{b.message}</p>
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
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
