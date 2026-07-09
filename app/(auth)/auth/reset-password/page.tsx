'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSignIn, useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Shield,
  ArrowRight,
  Dumbbell,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Card } from '@heroui/react';

function ResetPasswordForm() {
  const { signIn } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState(
    token ? '' : 'Invalid or missing reset token. Please request a new password reset link.'
  );
  const [step, setStep] = useState<'verifying' | 'set_password' | 'success'>(
    token ? 'verifying' : 'set_password'
  );
  const [shake, setShake] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // Verify token on mount
  const verifyingRef = useRef(false);

  useEffect(() => {
    // If already signed in, redirect to dashboard
    if (isSignedIn) {
      router.push('/');
      return;
    }

    if (!token || !signIn || verifyingRef.current) return;
    verifyingRef.current = true;

    const verifyToken = async () => {
      try {
        // Use the ticket strategy to verify the sign-in token
        const { error: ticketError } = await signIn.ticket({ ticket: token });

        if (ticketError) {
          throw ticketError;
        }

        // Check the resulting status
        if (signIn.status === 'needs_new_password') {
          setStep('set_password');
        } else if (signIn.status === 'complete') {
          await signIn.finalize();
          setStep('success');
          setTimeout(() => router.push('/'), 1500);
        } else {
          setError('Unable to verify token. It may be expired or invalid.');
          setStep('set_password');
        }
      } catch (err: any) {
        console.error('Token verification error:', err);
        const msg = err?.errors?.[0]?.longMessage
          || err?.errors?.[0]?.message
          || err?.message
          || 'This link is invalid or has expired. Please request a new one from your administrator.';
        setError(msg);
        setStep('set_password');
      }
    };

    verifyToken();
  }, [signIn, token, router, isSignedIn]);

  const checkPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) strength++;
    if (pass.match(/\d/)) strength++;
    if (pass.match(/[^a-zA-Z\d]/)) strength++;
    setPasswordStrength(strength);
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      triggerShake();
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      triggerShake();
      return;
    }

    if (!signIn) {
      setError('Authentication service not available');
      return;
    }

    try {
      setIsPending(true);

      // Submit the new password
      const { error: resetError } = await signIn.resetPasswordEmailCode.submitPassword({
        password,
        signOutOfOtherSessions: true,
      });

      if (resetError) {
        throw resetError;
      }

      // Finalize the sign-in to activate the session
      const { error: finalizeError } = await signIn.finalize();

      if (finalizeError) {
        throw finalizeError;
      }

      setStep('success');
      setTimeout(() => router.push('/'), 1500);
    } catch (err: any) {
      console.error('Password reset error:', err);
      const msg = err?.errors?.[0]?.longMessage
        || err?.errors?.[0]?.message
        || err?.message
        || 'Failed to reset password. Please try again.';
      setError(msg);
      triggerShake();
    } finally {
      setIsPending(false);
    }
  };

  const getStrengthColor = (strength: number) => {
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'];
    return colors[strength] || 'bg-gray-500';
  };

  const getStrengthText = (strength: number) => {
    const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return texts[strength] || 'Very Weak';
  };

  // Success state
  if (step === 'success') {
    return (
      <div className="text-center py-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-green-500/20 mb-6"
        >
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </motion.div>
        <h2 className="text-2xl font-black text-[var(--foreground)] mb-2">Password Set!</h2>
        <p className="text-[var(--foreground)]/60">Redirecting you to your dashboard...</p>
      </div>
    );
  }

  // Verifying state
  if (step === 'verifying') {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--accent)] mx-auto mb-4" />
        <p className="text-[var(--foreground)]/60">Verifying your reset link...</p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        animate={shake ? { x: [0, -15, 15, -15, 15, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/70 mb-6 shadow-lg shadow-[var(--accent)]/20"
          >
            <Lock className="h-10 w-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-black tracking-tight">Set Your Password</h2>
          <p className="mt-2 text-[var(--foreground)]/60">
            {token
              ? 'Choose a strong password for your account.'
              : 'This reset link is invalid. Please contact your administrator for a new one.'}
          </p>
        </div>

        <form onSubmit={handleSetPassword} className="space-y-5">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4"
              >
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-500 font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--foreground)]/80">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--foreground)]/40" />
              <input
                type={isVisible ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  checkPasswordStrength(e.target.value);
                  setError('');
                }}
                placeholder="••••••••"
                disabled={!token}
                className="w-full h-14 pl-12 pr-12 rounded-2xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--foreground)]/35 font-medium transition-all outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 hover:border-[var(--foreground)]/20 disabled:opacity-50"
                required
              />
              <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--foreground)]/40 hover:text-[var(--foreground)]/60 transition-colors"
              >
                {isVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {password && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2"
              >
                <div className="flex gap-1 mb-1">
                  {[0, 1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        index < passwordStrength
                          ? getStrengthColor(passwordStrength)
                          : 'bg-[var(--border)]'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-medium ${
                  passwordStrength <= 1 ? 'text-red-500' :
                  passwordStrength === 2 ? 'text-yellow-500' :
                  'text-green-500'
                }`}>
                  {getStrengthText(passwordStrength)}
                </p>
              </motion.div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--foreground)]/80">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--foreground)]/40" />
              <input
                type={isVisible ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                placeholder="••••••••"
                disabled={!token}
                className="w-full h-14 pl-12 pr-4 rounded-2xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--foreground)]/35 font-medium transition-all outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 hover:border-[var(--foreground)]/20 disabled:opacity-50"
                required
              />
              {confirmPassword && password === confirmPassword && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </motion.div>
              )}
            </div>
          </div>

          <motion.div
            whileHover={{ scale: token ? 1.02 : 1 }}
            whileTap={{ scale: token ? 0.98 : 1 }}
          >
            <button
              type="submit"
              disabled={isPending || !token}
              className="w-full h-14 bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]/80 text-white font-bold text-lg rounded-2xl shadow-lg shadow-[var(--accent)]/20 hover:shadow-xl hover:shadow-[var(--accent)]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group flex items-center justify-center gap-2"
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Set Password
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)]">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[-200px] top-[-200px] h-[600px] w-[600px] rounded-full bg-[var(--accent)]/20 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute bottom-[-200px] right-[-200px] h-[600px] w-[600px] rounded-full bg-[var(--accent)]/10 blur-3xl"
        />
      </div>

      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10">
        <div className="grid w-full items-center gap-16 lg:grid-cols-2">
          {/* Left Side - Branding */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden lg:flex flex-col justify-center"
          >
            <div className="max-w-xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-[var(--surface)]/70 px-5 py-3 backdrop-blur-xl shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/70 shadow-lg shadow-[var(--accent)]/20">
                  <Dumbbell className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-black tracking-tight text-[var(--foreground)]">
                  GymStitch
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl font-black leading-[1.1] tracking-[-0.04em] xl:text-6xl"
              >
                <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]/70 bg-clip-text text-transparent">
                  Secure Your
                </span>
                <br />
                Account.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 text-lg text-[var(--foreground)]/60 max-w-md"
              >
                Set a strong password to protect your account and access the gym management system.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-10 grid grid-cols-3 gap-4"
              >
                {[
                  { icon: Sparkles, text: 'Smart Tracking' },
                  { icon: Shield, text: 'Secure Data' },
                  { icon: Lock, text: 'Password Protected' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-[var(--foreground)]/60">
                    <item.icon className="h-5 w-5 text-[var(--accent)]" />
                    <span className="font-medium">{item.text}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Right Side - Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto w-full max-w-md"
          >
            <Card className="rounded-[2.5rem] border border-[var(--border)] bg-[var(--surface)]/80 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl shadow-black/5">
              {/* Mobile Logo */}
              <div className="lg:hidden mb-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/70 shadow-lg">
                  <Dumbbell className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-black">GymStitch</span>
              </div>

              <Suspense fallback={
                <div className="text-center py-12">
                  <Loader2 className="h-10 w-10 animate-spin text-[var(--accent)] mx-auto mb-4" />
                  <p className="text-[var(--foreground)]/60">Loading...</p>
                </div>
              }>
                <ResetPasswordForm />
              </Suspense>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
