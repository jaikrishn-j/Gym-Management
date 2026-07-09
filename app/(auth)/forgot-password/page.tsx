'use client';

import React, { useState } from 'react';
import { useSignIn, useAuth } from '@clerk/nextjs';
import { Card } from '@heroui/react';
import {
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Dumbbell,
  Sparkles,
  Shield,
  MessageSquare,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPasswordPage() {
  const { signIn } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // If already signed in, redirect
  React.useEffect(() => {
    if (isSignedIn) router.push('/');
  }, [isSignedIn, router]);

  // ─── Step 1: Send reset code ──────────────────────────────
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signIn) {
      setError('Authentication service not available');
      return;
    }

    if (!email) {
      setError('Please enter your email address');
      triggerShake();
      return;
    }

    try {
      setIsPending(true);
      setError('');

      // Identify the user first
      const { error: createError } = await signIn.create({ identifier: email });

      if (createError) {
        if (createError.code === 'form_identifier_not_found') {
          setError('No account found with this email address.');
        } else {
          setError(createError.message || 'Unable to find account');
        }
        triggerShake();
        return;
      }

      // Send the password reset code to the identified email
      const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();

      if (sendError) {
        setError(sendError.message || 'Failed to send reset code');
        triggerShake();
        return;
      }

      setStep('otp');
    } catch (err: any) {
      console.error('Send code error:', err);
      const msg = err?.errors?.[0]?.longMessage
        || err?.errors?.[0]?.message
        || err?.message
        || 'Failed to send reset code. Please try again.';
      setError(msg);
      triggerShake();
    } finally {
      setIsPending(false);
    }
  };

  // ─── Step 2: Verify OTP ──────────────────────────────────
  const handleVerifyOTP = async () => {
    if (!signIn) return;

    if (!code || code.length < 6) {
      setError('Please enter the complete verification code');
      triggerShake();
      return;
    }

    try {
      setIsPending(true);
      setError('');

      const { error: verifyError } = await signIn.resetPasswordEmailCode.verifyCode({ code });

      if (verifyError) {
        setError(verifyError.message || 'Invalid or expired code');
        triggerShake();
        return;
      }

      // Status should now be 'needs_new_password'
      if (signIn.status === 'needs_new_password') {
        setStep('password');
      } else if (signIn.status === 'complete') {
        // Edge case: if password was just being reset directly
        await signIn.finalize();
        setStep('success');
        setTimeout(() => router.push('/'), 1500);
      } else {
        setError('Unexpected sign-in status. Please try again.');
        triggerShake();
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      const msg = err?.errors?.[0]?.message || 'Verification failed';
      setError(msg);
      triggerShake();
    } finally {
      setIsPending(false);
    }
  };

  // ─── Step 3: Set new password ────────────────────────────
  const checkPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) strength++;
    if (pass.match(/\d/)) strength++;
    if (pass.match(/[^a-zA-Z\d]/)) strength++;
    setPasswordStrength(strength);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signIn) {
      setError('Authentication service not available');
      return;
    }

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

    try {
      setIsPending(true);
      setError('');

      const { error: resetError } = await signIn.resetPasswordEmailCode.submitPassword({
        password,
        signOutOfOtherSessions: true,
      });

      if (resetError) {
        throw resetError;
      }

      // Finalize to create the session
      const { error: finalizeError } = await signIn.finalize();

      if (finalizeError) {
        throw finalizeError;
      }

      setStep('success');
      setTimeout(() => router.push('/'), 2000);
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

  // ─── Resend Code ─────────────────────────────────────────
  const handleResendCode = async () => {
    if (!signIn) return;
    try {
      setIsPending(true);
      setError('');
      const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
      if (sendError) {
        setError(sendError.message || 'Failed to resend code');
      } else {
        // Brief success indication
        setError('');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code');
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

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)]">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[-200px] top-[-200px] h-[600px] w-[600px] rounded-full bg-[var(--accent)]/20 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
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
                  Forgot Your
                </span>
                <br />
                Password?
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 text-lg text-[var(--foreground)]/60 max-w-md"
              >
                No worries. Enter your email and we'll send you a code to reset your password in no time.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-10 grid grid-cols-3 gap-4"
              >
                {[
                  { icon: Sparkles, text: 'Quick Recovery' },
                  { icon: Shield, text: 'Secure Process' },
                  { icon: Lock, text: 'Encrypted Data' },
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
            <motion.div
              animate={shake ? { x: [0, -15, 15, -15, 15, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Card className="rounded-[2.5rem] border border-[var(--border)] bg-[var(--surface)]/80 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl shadow-black/5">
                {/* Mobile Logo */}
                <div className="lg:hidden mb-8 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/70 shadow-lg">
                    <Dumbbell className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-black">GymStitch</span>
                </div>

                {/* Back link - only on non-email steps */}
                {step !== 'email' && step !== 'success' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (step === 'otp') setStep('email');
                      else if (step === 'password') setStep('otp');
                      setError('');
                    }}
                    className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
                    type="button"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </motion.button>
                )}

                {/* ─── Step: Success ───────────────────────────────── */}
                {step === 'success' && (
                  <div className="text-center py-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-green-500/20 mb-6"
                    >
                      <CheckCircle2 className="h-10 w-10 text-green-500" />
                    </motion.div>
                    <h2 className="text-3xl font-black tracking-tight text-[var(--foreground)] mb-2">
                      Password Reset!
                    </h2>
                    <p className="text-[var(--foreground)]/60">
                      Your password has been successfully reset. Redirecting you...
                    </p>
                  </div>
                )}

                {/* ─── Step: Email ────────────────────────────────── */}
                {step === 'email' && (
                  <>
                    <div className="mb-8">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/70 mb-6 shadow-lg shadow-[var(--accent)]/20"
                      >
                        <Lock className="h-10 w-10 text-white" />
                      </motion.div>
                      <h2 className="text-3xl font-black tracking-tight">Forgot Password?</h2>
                      <p className="mt-2 text-[var(--foreground)]/60">
                        Enter the email address associated with your account and we'll send you a code to reset your password.
                      </p>
                    </div>

                    <form onSubmit={handleSendCode} className="space-y-5">
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
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--foreground)]/40" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              setError('');
                            }}
                            placeholder="you@example.com"
                            className="w-full h-14 pl-12 pr-4 rounded-2xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--foreground)]/35 font-medium transition-all outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 hover:border-[var(--foreground)]/20"
                            autoFocus
                            required
                          />
                        </div>
                      </div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <button
                          type="submit"
                          disabled={isPending}
                          className="w-full h-14 bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]/80 text-white font-bold text-lg rounded-2xl shadow-lg shadow-[var(--accent)]/20 hover:shadow-xl hover:shadow-[var(--accent)]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group flex items-center justify-center gap-2"
                        >
                          {isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              Send Reset Code
                              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </motion.div>
                    </form>

                    <p className="mt-8 text-center text-sm text-[var(--foreground)]/40">
                      Remember your password?{' '}
                      <Link href="/login" className="text-[var(--accent)] font-semibold hover:underline">
                        Sign in
                      </Link>
                    </p>
                  </>
                )}

                {/* ─── Step: OTP ──────────────────────────────────── */}
                {step === 'otp' && (
                  <>
                    <div className="text-center mb-8">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/70 mb-6 shadow-lg shadow-[var(--accent)]/20"
                      >
                        <MessageSquare className="h-10 w-10 text-white" />
                      </motion.div>
                      <h2 className="text-3xl font-black tracking-tight">Check Your Email</h2>
                      <p className="mt-3 text-[var(--foreground)]/60">
                        We've sent a 6-digit code to{' '}
                        <span className="font-semibold text-[var(--foreground)]">{email}</span>
                      </p>
                    </div>

                    <div className="space-y-5">
                      <div
                        className="flex justify-center gap-3 relative cursor-text"
                        onClick={() => {
                          const inputEl = document.getElementById('otp-input');
                          inputEl?.focus();
                        }}
                      >
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <motion.div
                            key={i}
                            animate={code.length === i ? { scale: [1, 1.05, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className={`h-14 w-12 rounded-2xl border-2 transition-all duration-200 ${
                              i < code.length
                                ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                                : code.length === i
                                ? 'border-[var(--accent)] bg-[var(--accent)]/5 ring-4 ring-[var(--accent)]/10'
                                : 'border-[var(--border)] bg-[var(--field-background)]'
                            } flex items-center justify-center`}
                          >
                            <span className="text-2xl font-bold text-[var(--foreground)]">
                              {code[i] || ''}
                            </span>
                          </motion.div>
                        ))}
                      </div>

                      <input
                        id="otp-input"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={code}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                          setCode(value);
                          setError('');
                        }}
                        autoFocus
                        autoComplete="one-time-code"
                        className="absolute opacity-0 pointer-events-none"
                        style={{
                          position: 'absolute',
                          width: '1px',
                          height: '1px',
                          padding: '0',
                          margin: '-1px',
                          overflow: 'hidden',
                          clip: 'rect(0, 0, 0, 0)',
                          whiteSpace: 'nowrap',
                          borderWidth: '0',
                        }}
                      />

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

                      <motion.div
                        animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        <button
                          onClick={handleVerifyOTP}
                          disabled={code.length !== 6 || isPending}
                          className="w-full h-14 bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]/80 text-white font-bold text-lg rounded-2xl shadow-lg shadow-[var(--accent)]/20 hover:shadow-xl hover:shadow-[var(--accent)]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            'Verify Code'
                          )}
                        </button>
                      </motion.div>

                      <button
                        onClick={handleResendCode}
                        disabled={isPending}
                        className="w-full h-12 text-[var(--foreground)]/60 hover:text-[var(--foreground)] font-medium transition-colors disabled:opacity-50"
                      >
                        {isPending ? 'Sending...' : 'Resend Code'}
                      </button>
                    </div>
                  </>
                )}

                {/* ─── Step: Password ─────────────────────────────── */}
                {step === 'password' && (
                  <>
                    <div className="mb-8">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/70 mb-6 shadow-lg shadow-[var(--accent)]/20"
                      >
                        <Lock className="h-10 w-10 text-white" />
                      </motion.div>
                      <h2 className="text-3xl font-black tracking-tight">Set New Password</h2>
                      <p className="mt-2 text-[var(--foreground)]/60">
                        Choose a strong password for your account.
                      </p>
                    </div>

                    <form onSubmit={handleResetPassword} className="space-y-5">
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
                            className="w-full h-14 pl-12 pr-12 rounded-2xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--foreground)]/35 font-medium transition-all outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 hover:border-[var(--foreground)]/20"
                            autoFocus
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
                            className="w-full h-14 pl-12 pr-4 rounded-2xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--foreground)]/35 font-medium transition-all outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 hover:border-[var(--foreground)]/20"
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
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <button
                          type="submit"
                          disabled={isPending}
                          className="w-full h-14 bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]/80 text-white font-bold text-lg rounded-2xl shadow-lg shadow-[var(--accent)]/20 hover:shadow-xl hover:shadow-[var(--accent)]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group flex items-center justify-center gap-2"
                        >
                          {isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              Reset Password
                              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </motion.div>
                    </form>
                  </>
                )}
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
