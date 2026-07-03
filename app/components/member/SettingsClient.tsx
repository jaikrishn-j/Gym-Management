"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import {
  Settings, Bell, Mail, Smartphone, Eye, AlertCircle, Loader2,
  CheckCircle2, Save, Shield, ToggleLeft, ToggleRight
} from "lucide-react"
import { toast } from "sonner"
import { updateDashboardSettings } from "@/app/dashboard/actions"

interface SettingsData {
  emailNotifications: boolean
  smsNotifications: boolean
  profileVisibility: string
}

export default function SettingsClient({ initial }: { initial: SettingsData }) {
  const [form, setForm] = useState<SettingsData>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSave = async () => {
    try {
      setSaving(true)
      setError("")
      setSuccess("")
      const result = await updateDashboardSettings(form)
      if (!result.success) throw new Error(result.error || "Failed to save")
      setSuccess("Settings saved successfully")
      toast.success("Settings saved")
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10">
          <Settings className="h-6 w-6 text-green-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)]">Settings</h1>
          <p className="text-sm text-[var(--muted)]">Manage your preferences</p>
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

      {/* Notifications */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5">
        <h2 className="font-bold text-[var(--foreground)] flex items-center gap-2">
          <Bell className="h-5 w-5 text-green-500" /> Notification Preferences
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--field-background)]/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Mail className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Email Notifications</p>
                <p className="text-xs text-[var(--muted)]">Receive updates via email</p>
              </div>
            </div>
            <button
              onClick={() => setForm(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                form.emailNotifications
                  ? "bg-green-500/10 text-green-500"
                  : "bg-gray-500/10 text-[var(--muted)]"
              }`}
            >
              {form.emailNotifications ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
              {form.emailNotifications ? "Enabled" : "Disabled"}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--field-background)]/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Smartphone className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">SMS Notifications</p>
                <p className="text-xs text-[var(--muted)]">Receive updates via SMS</p>
              </div>
            </div>
            <button
              onClick={() => setForm(prev => ({ ...prev, smsNotifications: !prev.smsNotifications }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                form.smsNotifications
                  ? "bg-green-500/10 text-green-500"
                  : "bg-gray-500/10 text-[var(--muted)]"
              }`}
            >
              {form.smsNotifications ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
              {form.smsNotifications ? "Enabled" : "Disabled"}
            </button>
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5">
        <h2 className="font-bold text-[var(--foreground)] flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-500" /> Privacy
        </h2>

        <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--field-background)]/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Eye className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Profile Visibility</p>
              <p className="text-xs text-[var(--muted)]">Who can see your profile</p>
            </div>
          </div>
          <select
            value={form.profileVisibility}
            onChange={(e) => setForm(prev => ({ ...prev, profileVisibility: e.target.value }))}
            className="h-10 px-3 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-sm font-medium text-[var(--foreground)] outline-none focus:border-green-500"
          >
            <option value="public">Public</option>
            <option value="members">Members Only</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSave}
        disabled={saving}
        className="w-full h-14 rounded-2xl bg-green-500 text-white font-bold text-lg shadow-lg shadow-green-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
        {saving ? "Saving..." : "Save Settings"}
      </motion.button>
    </div>
  )
}
