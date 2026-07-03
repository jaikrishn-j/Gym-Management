"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import {
  User, Mail, Phone, Calendar, MapPin, Droplets, Heart,
  AlertCircle, Loader2, CheckCircle2, Save, Shield, Contact,
  MessageCircle, Check
} from "lucide-react"
import { toast } from "sonner"
import { updateProfile } from "@/app/dashboard/actions"
import { useClerk } from "@clerk/nextjs"

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phoneCode: string
  phone: string
  whatsappSame: boolean
  whatsappCode: string
  whatsappPhone: string
  dob: string
  gender: string
  bloodGroup: string
  address: string
  emergencyName: string
  emergencyPhone: string
}

const countryCodes = [
  { code: "+93", label: "AF (+93)" },
  { code: "+355", label: "AL (+355)" },
  { code: "+213", label: "DZ (+213)" },
  { code: "+1", label: "US/CA (+1)" },
  { code: "+54", label: "AR (+54)" },
  { code: "+61", label: "AU (+61)" },
  { code: "+43", label: "AT (+43)" },
  { code: "+880", label: "BD (+880)" },
  { code: "+32", label: "BE (+32)" },
  { code: "+55", label: "BR (+55)" },
  { code: "+359", label: "BG (+359)" },
  { code: "+86", label: "CN (+86)" },
  { code: "+57", label: "CO (+57)" },
  { code: "+385", label: "HR (+385)" },
  { code: "+357", label: "CY (+357)" },
  { code: "+420", label: "CZ (+420)" },
  { code: "+45", label: "DK (+45)" },
  { code: "+593", label: "EC (+593)" },
  { code: "+20", label: "EG (+20)" },
  { code: "+358", label: "FI (+358)" },
  { code: "+33", label: "FR (+33)" },
  { code: "+49", label: "DE (+49)" },
  { code: "+30", label: "GR (+30)" },
  { code: "+852", label: "HK (+852)" },
  { code: "+36", label: "HU (+36)" },
  { code: "+91", label: "IN (+91)" },
  { code: "+62", label: "ID (+62)" },
  { code: "+98", label: "IR (+98)" },
  { code: "+964", label: "IQ (+964)" },
  { code: "+353", label: "IE (+353)" },
  { code: "+39", label: "IT (+39)" },
  { code: "+81", label: "JP (+81)" },
  { code: "+7", label: "KZ (+7)" },
  { code: "+254", label: "KE (+254)" },
  { code: "+965", label: "KW (+965)" },
  { code: "+60", label: "MY (+60)" },
  { code: "+960", label: "MV (+960)" },
  { code: "+52", label: "MX (+52)" },
  { code: "+977", label: "NP (+977)" },
  { code: "+31", label: "NL (+31)" },
  { code: "+64", label: "NZ (+64)" },
  { code: "+234", label: "NG (+234)" },
  { code: "+47", label: "NO (+47)" },
  { code: "+968", label: "OM (+968)" },
  { code: "+92", label: "PK (+92)" },
  { code: "+63", label: "PH (+63)" },
  { code: "+48", label: "PL (+48)" },
  { code: "+351", label: "PT (+351)" },
  { code: "+974", label: "QA (+974)" },
  { code: "+40", label: "RO (+40)" },
  { code: "+7", label: "RU (+7)" },
  { code: "+966", label: "SA (+966)" },
  { code: "+65", label: "SG (+65)" },
  { code: "+27", label: "ZA (+27)" },
  { code: "+82", label: "KR (+82)" },
  { code: "+34", label: "ES (+34)" },
  { code: "+94", label: "LK (+94)" },
  { code: "+46", label: "SE (+46)" },
  { code: "+41", label: "CH (+41)" },
  { code: "+886", label: "TW (+886)" },
  { code: "+255", label: "TZ (+255)" },
  { code: "+66", label: "TH (+66)" },
  { code: "+90", label: "TR (+90)" },
  { code: "+256", label: "UG (+256)" },
  { code: "+44", label: "GB (+44)" },
  { code: "+380", label: "UA (+380)" },
  { code: "+971", label: "AE (+971)" },
  { code: "+598", label: "UY (+598)" },
  { code: "+58", label: "VE (+58)" },
  { code: "+84", label: "VN (+84)" },
  { code: "+967", label: "YE (+967)" },
  { code: "+263", label: "ZW (+263)" },
]

const genders = ["Male", "Female", "Other", "Prefer not to say"]
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

export default function ProfileClient({ initial }: { initial: ProfileData }) {
  const { user } = useClerk()

  const [form, setForm] = useState<ProfileData>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleChange = (field: keyof ProfileData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError("")
      setSuccess("")
      const result = await updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        phoneCode: form.phoneCode,
        phone: form.phone,
        whatsappSame: form.whatsappSame,
        whatsappCode: form.whatsappSame ? form.phoneCode : form.whatsappCode,
        whatsappPhone: form.whatsappSame ? form.phone : form.whatsappPhone,
        dob: form.dob,
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        address: form.address,
        emergencyName: form.emergencyName,
        emergencyPhone: form.emergencyPhone,
      })
      if (!result.success) throw new Error(result.error || "Failed to save")
      setSuccess("Profile updated successfully")
      toast.success("Profile updated")
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden bg-green-500/10">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <User className="h-8 w-8 text-green-500" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)]">Profile</h1>
          <p className="text-sm text-[var(--muted)]">Manage your personal information</p>
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

      {/* Personal Information */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5">
        <h2 className="font-bold text-[var(--foreground)] flex items-center gap-2">
          <User className="h-5 w-5 text-green-500" /> Personal Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-1.5 block">First Name</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-1.5 block">Last Name</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-green-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-1.5 block">
            <Mail className="h-3 w-3 inline mr-1" /> Email
          </label>
          <input
            type="email"
            value={form.email}
            readOnly
            className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)]/50 text-[var(--muted)] font-medium cursor-not-allowed"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-1.5 block">
            <Phone className="h-3 w-3 inline mr-1" /> Phone Number
          </label>
          <div className="flex gap-2">
            <select
              value={form.phoneCode}
              onChange={(e) => handleChange("phoneCode", e.target.value)}
              className="h-12 w-28 shrink-0 px-3 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] text-sm font-medium outline-none focus:border-green-500"
            >
              {countryCodes.map(cc => (
                <option key={cc.code + cc.label} value={cc.code}>{cc.label}</option>
              ))}
            </select>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "")
                handleChange("phone", val)
              }}
              placeholder="9876543210"
              maxLength={15}
              className="flex-1 h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-green-500"
            />
          </div>
        </div>

        {/* WhatsApp */}
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--field-background)]/30 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-500 shrink-0 mt-0.5">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--foreground)]">WhatsApp Number</p>
              <label className="flex items-center gap-2.5 mt-2 cursor-pointer">
                <div
                  onClick={() => handleChange("whatsappSame", !form.whatsappSame)}
                  className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    form.whatsappSame
                      ? 'bg-green-500 border-green-500'
                      : 'border-[var(--field-border)] bg-[var(--field-background)]'
                  }`}
                >
                  {form.whatsappSame && <Check className="h-3.5 w-3.5 text-white" />}
                </div>
                <span className="text-xs text-[var(--muted)]">Same as phone number</span>
              </label>
            </div>
          </div>

          {!form.whatsappSame && (
            <div className="flex gap-2">
              <select
                value={form.whatsappCode}
                onChange={(e) => handleChange("whatsappCode", e.target.value)}
                className="h-12 w-28 shrink-0 px-3 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] text-sm font-medium outline-none focus:border-green-500"
              >
                {countryCodes.map(cc => (
                  <option key={cc.code + cc.label} value={cc.code}>{cc.label}</option>
                ))}
              </select>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.whatsappPhone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "")
                  handleChange("whatsappPhone", val)
                }}
                placeholder="WhatsApp number"
                maxLength={15}
                className="flex-1 h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-green-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Additional Details */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5">
        <h2 className="font-bold text-[var(--foreground)] flex items-center gap-2">
          <Heart className="h-5 w-5 text-green-500" /> Additional Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-1.5 block">
              <Calendar className="h-3 w-3 inline mr-1" /> Date of Birth
            </label>
            <input
              type="date"
              value={form.dob}
              onChange={(e) => handleChange("dob", e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-1.5 block">
              <User className="h-3 w-3 inline mr-1" /> Gender
            </label>
            <select
              value={form.gender}
              onChange={(e) => handleChange("gender", e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-green-500"
            >
              <option value="">Select gender</option>
              {genders.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-1.5 block">
              <Droplets className="h-3 w-3 inline mr-1" /> Blood Group
            </label>
            <select
              value={form.bloodGroup}
              onChange={(e) => handleChange("bloodGroup", e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-green-500"
            >
              <option value="">Select blood group</option>
              {bloodGroups.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-1.5 block">
              <MapPin className="h-3 w-3 inline mr-1" /> Address
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Your address"
              className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-green-500"
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5">
        <h2 className="font-bold text-[var(--foreground)] flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-500" /> Emergency Contact
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-1.5 block">
              <Contact className="h-3 w-3 inline mr-1" /> Contact Name
            </label>
            <input
              type="text"
              value={form.emergencyName}
              onChange={(e) => handleChange("emergencyName", e.target.value)}
              placeholder="Emergency contact name"
              className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-1.5 block">
              <Phone className="h-3 w-3 inline mr-1" /> Contact Phone
            </label>
            <input
              type="tel"
              value={form.emergencyPhone}
              onChange={(e) => handleChange("emergencyPhone", e.target.value)}
              placeholder="Emergency contact phone"
              className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-green-500"
            />
          </div>
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
        {saving ? "Saving..." : "Save Profile"}
      </motion.button>
    </div>
  )
}
