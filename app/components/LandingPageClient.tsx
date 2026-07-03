'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dumbbell,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  Users,
  Calendar,
  Clock,
  Star,
  ChevronRight,
  TrendingUp,
  Heart,
  Target,
  Sparkles,
  BarChart3,
  Smartphone,
  CreditCard,
  MessageSquare,
  Activity
} from 'lucide-react';
import LandingTopbar from './LandingTopbar';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
};

const stagger = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { staggerChildren: 0.08 },
};

export default function LandingPageClient() {
  const router = useRouter();
  const { isLoaded } = useUser();
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    setHeroLoaded(true);
  }, []);

  const features = [
    {
      icon: BarChart3,
      title: 'Smart Analytics',
      description: 'Track attendance, performance, and growth with real-time dashboards and insights.',
      color: 'from-emerald-500 to-green-600',
    },
    {
      icon: Users,
      title: 'Member Management',
      description: 'Manage members, plans, payments, and attendance all in one place.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Calendar,
      title: 'Attendance Tracking',
      description: 'Seamless check-in system with weight tracking and workout history.',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: CreditCard,
      title: 'Payment Processing',
      description: 'Accept payments online via Razorpay or offline with manual recording.',
      color: 'from-amber-500 to-orange-600',
    },
    {
      icon: Smartphone,
      title: 'Member Portal',
      description: 'Members can view plans, track progress, and manage their profile.',
      color: 'from-rose-500 to-pink-600',
    },
    {
      icon: MessageSquare,
      title: 'Broadcast System',
      description: 'Send announcements to all members instantly with the broadcast feature.',
      color: 'from-cyan-500 to-teal-600',
    },
  ];

  const stats = [
    { value: '24/7', label: 'Access' },
    { value: '100%', label: 'Uptime' },
    { value: '3', label: 'Portals' },
    { value: 'Real-time', label: 'Sync' },
  ];

  const getCtaHref = () => {
    if (!isLoaded) return '/login';
    return '/login';
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <LandingTopbar />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20 sm:pt-24 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent)]/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[var(--accent)]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-[var(--accent)]/5 rounded-full blur-2xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={heroLoaded ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-sm font-medium text-[var(--accent)] mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                All-in-one fitness management
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--foreground)] tracking-tight leading-[1.1]">
                Complete Gym{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-emerald-400">
                  Management
                </span>{' '}
                Platform
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-[var(--muted)] max-w-xl leading-relaxed">
                Streamline your gym operations with member management, attendance tracking,
                payment processing, and real-time analytics — all from one powerful dashboard.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button
                  onClick={() => router.push(getCtaHref())}
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-[var(--accent)] text-white font-bold text-sm shadow-xl shadow-[var(--accent)]/20 hover:shadow-2xl hover:shadow-[var(--accent)]/30 transition-all"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => router.push('/equipments')}
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl border border-[var(--border)] text-[var(--foreground)] font-semibold text-sm hover:bg-[var(--surface-secondary)] transition-all"
                >
                  Browse Equipment
                </button>
              </div>

              {/* Trusted bar */}
              <div className="flex flex-wrap items-center gap-6 mt-10 text-sm text-[var(--muted)]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
                  <span>No setup required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
                  <span>Secure & private</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
                  <span>Free to start</span>
                </div>
              </div>
            </motion.div>

            {/* Right - Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={heroLoaded ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent z-10" />
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
                  {/* Mini dashboard preview */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Dumbbell className="h-5 w-5 text-[var(--accent)]" />
                        <span className="text-sm font-bold text-[var(--foreground)]">GymStitch</span>
                      </div>
                      <div className="flex gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Members', value: '128', trend: '+12', color: 'text-green-500' },
                        { label: 'Revenue', value: '₹84K', trend: '+18%', color: 'text-green-500' },
                        { label: 'Attendance', value: '94%', trend: '+5%', color: 'text-green-500' },
                      ].map((s, i) => (
                        <div key={i} className="rounded-xl bg-[var(--surface-secondary)] p-3">
                          <p className="text-xs text-[var(--muted)] mb-1">{s.label}</p>
                          <p className="text-lg font-bold text-[var(--foreground)]">{s.value}</p>
                          <p className={`text-xs font-medium ${s.color}`}>{s.trend}</p>
                        </div>
                      ))}
                    </div>
                    <div className="h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                      <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[var(--accent)] to-emerald-400" />
                    </div>
                    <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                      <span>Monthly goal progress</span>
                      <span className="font-semibold text-[var(--foreground)]">75%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <motion.section {...fadeUp} className="border-y border-[var(--border)] bg-[var(--surface)]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl sm:text-3xl font-black text-[var(--foreground)]">{stat.value}</p>
                <p className="text-sm text-[var(--muted)] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features */}
      <section className="py-20 sm:py-28" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
              Everything you need to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-emerald-400">
                run your gym
              </span>
            </h2>
            <p className="mt-4 text-lg text-[var(--muted)]">
              Three dedicated portals for admins, staff, and members — each tailored to their needs.
            </p>
          </motion.div>

          <motion.div {...stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={{
                  initial: { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0 },
                }}
                className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg mb-4`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <motion.section {...fadeUp} className="py-20 sm:py-28 bg-[var(--surface)]/30 border-t border-[var(--border)]" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-sm font-medium text-[var(--accent)] mb-6">
                <Activity className="h-3.5 w-3.5" />
                Three portals
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
                Role-based dashboards for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-emerald-400">
                  every need
                </span>
              </h2>
              <p className="mt-4 text-lg text-[var(--muted)]">
                Each user gets a tailored experience — admins have full control, staff manage day-to-day
                operations, and members track their fitness journey.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { icon: Shield, title: 'Admin Portal', desc: 'Full control over members, staff, plans, payments, equipment, and analytics.' },
                  { icon: Users, title: 'Staff Portal', desc: 'Manage memberships, track attendance, process payments, and update equipment.' },
                  { icon: Heart, title: 'Member Portal', desc: 'View plans, track weight progress, check attendance, and receive announcements.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 shrink-0">
                      <item.icon className="h-5 w-5 text-[var(--accent)]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--foreground)]">{item.title}</p>
                      <p className="text-sm text-[var(--muted)] mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border)]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/70">
                    <Dumbbell className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--foreground)]">Quick Stats</p>
                    <p className="text-xs text-[var(--muted)]">Real-time overview</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Active Members', value: '85', icon: Users, change: '+8 this month' },
                    { label: 'Today Check-ins', value: '42', icon: Calendar, change: '12 pending' },
                    { label: 'Monthly Revenue', value: '₹62,400', icon: TrendingUp, change: '+15% vs last month' },
                    { label: 'Equipment Status', value: 'All Good', icon: Activity, change: '2 under maintenance' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-secondary)]">
                          <item.icon className="h-4 w-4 text-[var(--muted)]" />
                        </div>
                        <div>
                          <p className="text-xs text-[var(--muted)]">{item.label}</p>
                          <p className="text-sm font-bold text-[var(--foreground)]">{item.value}</p>
                        </div>
                      </div>
                      <span className="text-xs text-[var(--muted)]">{item.change}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section {...fadeUp} className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-br from-[var(--accent)]/10 via-[var(--surface)] to-[var(--accent)]/5 border border-[var(--accent)]/20 p-8 sm:p-12 lg:p-16 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/10 rounded-full blur-3xl" />
            <div className="relative text-center max-w-2xl mx-auto">
              <div className="flex justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/70 shadow-xl shadow-[var(--accent)]/20">
                  <Dumbbell className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
                Ready to transform your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-emerald-400">
                  gym management
                </span>
                ?
              </h2>
              <p className="mt-4 text-lg text-[var(--muted)]">
                Join GymStitch and take control of your fitness business with powerful tools
                designed for modern gyms.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => router.push('/login')}
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-[var(--accent)] text-white font-bold text-sm shadow-xl shadow-[var(--accent)]/20 hover:shadow-2xl hover:shadow-[var(--accent)]/30 transition-all min-w-[180px]"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => router.push('/equipments')}
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl border border-[var(--border)] text-[var(--foreground)] font-semibold text-sm hover:bg-[var(--surface-secondary)] transition-all"
                >
                  Browse Equipment
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/70">
                <Dumbbell className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-black tracking-tight text-[var(--foreground)]">
                GymStitch
              </span>
            </div>
            <p className="text-sm text-[var(--muted)]">
              &copy; {new Date().getFullYear()} GymStitch. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
