"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import {
  Settings, IndianRupee, CreditCard, ShieldCheck, AlertCircle, Loader2,
  Save, Eye, EyeOff, KeyRound, ToggleLeft, ToggleRight
} from "lucide-react"
import { toast } from "sonner"
import { updateSettings } from "@/app/admin/settings/action"

interface GymSettings {
  id: string
  initialPaymentAmount: number | null
  paymentGatewayEnabled: boolean | null
  razorpayKeyId: string | null
  razorpaySecretKey: string | null
}

export default function SettingsClient({ initialSettings }: { initialSettings: GymSettings | null }) {
  const [form, setForm] = useState({
    initialPaymentAmount: initialSettings?.initialPaymentAmount ?? 0,
    paymentGatewayEnabled: initialSettings?.paymentGatewayEnabled ?? false,
    razorpayKeyId: initialSettings?.razorpayKeyId ?? "",
    razorpaySecretKey: initialSettings?.razorpaySecretKey ?? "",
  })
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError("")
      setSuccess("")

      const result = await updateSettings({
        initialPaymentAmount: form.initialPaymentAmount,
        paymentGatewayEnabled: form.paymentGatewayEnabled,
        razorpayKeyId: form.razorpayKeyId || undefined,
        razorpaySecretKey: form.razorpaySecretKey || undefined,
      })

      if (!result.success) throw new Error(result.error || "Failed to save")
      setSuccess("Settings saved successfully")
      toast.success("Settings saved")
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message || "Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10">
          <Settings className="h-6 w-6 text-green-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)]">Gym Settings</h1>
          <p className="text-sm text-[var(--muted)]">Configure membership & payment options</p>
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
          <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />
          <p className="text-sm text-green-500 font-medium">{success}</p>
        </div>
      )}

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-6">
        <h2 className="font-bold text-[var(--foreground)] flex items-center gap-2">
          <IndianRupee className="h-5 w-5 text-green-500" /> Membership Pricing
        </h2>

        <div>
          <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-1.5 block">
            Initial Registration Fee (₹) — charged once for new members
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={form.initialPaymentAmount}
            onChange={(e) => setForm(prev => ({ ...prev, initialPaymentAmount: parseFloat(e.target.value) || 0 }))}
            className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-green-500"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[var(--foreground)] flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-500" /> Online Payment Gateway
          </h2>
          <button
            onClick={() => setForm(prev => ({ ...prev, paymentGatewayEnabled: !prev.paymentGatewayEnabled }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              form.paymentGatewayEnabled
                ? "bg-green-500/10 text-green-500"
                : "bg-gray-500/10 text-[var(--muted)]"
            }`}
          >
            {form.paymentGatewayEnabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
            {form.paymentGatewayEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        <div className={`space-y-4 transition-all ${form.paymentGatewayEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
          <div>
            <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-1.5 block">
              Razorpay Key ID
            </label>
            <input
              type="text"
              value={form.razorpayKeyId}
              onChange={(e) => setForm(prev => ({ ...prev, razorpayKeyId: e.target.value }))}
              placeholder="rzp_live_..."
              className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-1.5 block">
              Razorpay Secret Key
            </label>
            <div className="relative">
              <input
                type={showSecretKey ? "text" : "password"}
                value={form.razorpaySecretKey}
                onChange={(e) => setForm(prev => ({ ...prev, razorpaySecretKey: e.target.value }))}
                placeholder="••••••••"
                className="w-full h-12 px-4 pr-12 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-green-500"
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                {showSecretKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSave}
        disabled={isSaving}
        className="w-full h-14 rounded-2xl bg-green-500 text-white font-bold text-lg shadow-lg shadow-green-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
        {isSaving ? "Saving..." : "Save Settings"}
      </motion.button>
    </div>
  )
}
