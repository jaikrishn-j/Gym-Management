"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MessageSquare, Megaphone, Calendar, CheckCircle2, Loader2,
  MailOpen, Mail, ExternalLink
} from "lucide-react"
import { toast } from "sonner"
import { markBroadcastRead } from "@/app/admin/broadcast/action"

interface MessageItem {
  id: string
  title: string
  message: string
  target: string
  sentBy: string
  createdAt: Date
  isRead: boolean
}

export default function MessagesClient({ initial }: { initial: MessageItem[] }) {
  const [messages, setMessages] = useState<MessageItem[]>(initial)
  const [selected, setSelected] = useState<MessageItem | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [marking, setMarking] = useState<string | null>(null)

  const unread = messages.filter(m => !m.isRead)
  const read = messages.filter(m => m.isRead)

  const handleMarkRead = async (id: string) => {
    setMarking(id)
    try {
      const result = await markBroadcastRead(id)
      if (!result.success) throw new Error(result.error || 'Failed to mark as read')
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m))
      toast.success('Message marked as read')
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark as read')
    } finally {
      setMarking(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10">
          <MessageSquare className="h-6 w-6 text-green-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)]">Messages</h1>
          <p className="text-sm text-[var(--muted)]">Announcements from the gym</p>
        </div>
      </div>

      {unread.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Mail className="h-3.5 w-3.5" /> Unread ({unread.length})
          </h2>
          <div className="space-y-2">
            {unread.map(m => (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => { setSelected(m); setShowModal(true) }}
                className="w-full text-left p-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 shrink-0 mt-0.5">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                      <p className="text-sm font-bold text-[var(--foreground)]">{m.title}</p>
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">{m.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="h-3 w-3 text-[var(--muted)]" />
                      <span className="text-[10px] text-[var(--muted)]">
                        {new Date(m.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-[var(--muted)] shrink-0 mt-1" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {read.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
            <MailOpen className="h-3.5 w-3.5" /> Read ({read.length})
          </h2>
          <div className="space-y-2">
            {read.map(m => (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => { setSelected(m); setShowModal(true) }}
                className="w-full text-left p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)]/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--field-background)] text-[var(--muted)] shrink-0 mt-0.5">
                    <MailOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{m.title}</p>
                    <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">{m.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="h-3 w-3 text-[var(--muted)]" />
                      <span className="text-[10px] text-[var(--muted)]">
                        {new Date(m.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-[var(--muted)] shrink-0 mt-1" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {messages.length === 0 && (
        <div className="text-center py-20">
          <MessageSquare className="h-12 w-12 text-[var(--muted)] mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium text-[var(--foreground)]">No messages yet</p>
          <p className="text-xs text-[var(--muted)] mt-1">Announcements from the gym will appear here</p>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showModal && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
              className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl z-10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                  <Megaphone className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-[var(--foreground)]">{selected.title}</h3>
                  <p className="text-sm text-[var(--muted)]">
                    {new Date(selected.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--field-background)]/50 border border-[var(--border)]">
                <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">{selected.message}</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowModal(false); setSelected(null) }}
                  className="flex-1 h-12 rounded-xl border-2 border-[var(--border)] font-semibold text-sm"
                >
                  Close
                </button>
                {!selected.isRead && (
                  <button
                    onClick={async () => {
                      await handleMarkRead(selected.id)
                      setSelected(prev => prev ? { ...prev, isRead: true } : null)
                      setShowModal(false)
                    }}
                    disabled={marking === selected.id}
                    className="flex-1 h-12 rounded-xl bg-orange-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {marking === selected.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <><CheckCircle2 className="h-4 w-4" /> Mark as Read</>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
