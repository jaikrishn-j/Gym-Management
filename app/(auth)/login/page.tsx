'use client';

import React, { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import type { OAuthStrategy } from '@clerk/types';
import { Card } from '@heroui/react';
import { 
  ArrowRight, 
  Dumbbell, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Sparkles,
  ArrowLeft,
  Shield,
  MessageSquare,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignInPage() {
  const { signIn } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'login' | 'verify_email' | 'mfa'>('login');
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };
  
  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signIn) return;
    
    if (!email || !password) {
      setError('Please fill in all fields');
      triggerShake();
      return;
    }

    try {
      setIsPending(true);
      setError('');

      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.error) {
        const clerkError = result.error;
        if (clerkError.code === 'form_password_incorrect') {
          setError('Invalid password. Please check your password and try again.');
        } else if (clerkError.code === 'form_identifier_not_found') {
          setError('No account found with this email.');
        } else {
          setError(clerkError.message || 'Invalid credentials');
        }
        triggerShake();
        return;
      }

      const status = signIn.status;

      if (status === 'complete') {
        await signIn.finalize();
        router.push('/');
        return;
      }

      if (status === 'needs_client_trust') {
        await signIn.emailCode.sendCode();
        setStep('verify_email');
        return;
      }

      setError('Unable to complete sign in. Please try again.');
      triggerShake();
      
    } catch (err: any) {
      console.error('Sign in error:', err);
      
      if (err?.errors?.[0]) {
        const clerkError = err.errors[0];
        
        if (clerkError.code === 'form_password_incorrect') {
          setError('Invalid password. Please check your password and try again.');
        } else if (clerkError.code === 'form_identifier_not_found') {
          setError('No account found with this email. Please check your email or create a new account.');
        } else if (clerkError.code === 'form_param_format_invalid') {
          setError('Please enter a valid email address.');
        } else {
          setError(clerkError.longMessage || clerkError.message || 'Invalid credentials');
        }
      } else {
        setError(err?.message || 'Sign in failed. Please try again.');
      }
      
      triggerShake();
    } finally {
      setIsPending(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!signIn) return;
    
    if (!code || code.length < 6) {
      setError('Please enter a valid verification code');
      triggerShake();
      return;
    }

    try {
      setIsPending(true);
      setError('');
      
      const result = await signIn.emailCode.verifyCode({ code });

      if (result.error) {
        setError(result.error.message || 'Invalid code');
        triggerShake();
        return;
      }

      if (signIn.status === 'complete') {
        await signIn.finalize();
        router.push('/');
      } else {
        setError('Invalid or expired code');
        triggerShake();
      }
    } catch (err: any) {
      console.error('OTP error:', err);
      setError(err?.errors?.[0]?.message || 'Verification failed');
      triggerShake();
    } finally {
      setIsPending(false);
    }
  };

  const handleOAuth = async (strategy: OAuthStrategy) => {
    if (!signIn) return;
    
    try {
      setIsPending(true);
      setError('');
      
      await signIn.reset();
      
      const result = await signIn.sso({
        strategy,
        redirectUrl: '/auth/sso-callback',
        redirectCallbackUrl: window.location.origin + '/',
      });

      if (result?.error) {
        setError(result.error.message || 'OAuth sign-in failed');
      }
      setIsPending(false);
    } catch (err: any) {
      console.error('OAuth error:', err);
      setError(err?.errors?.[0]?.message || 'Failed to sign in with provider. Please try again.');
      setIsPending(false);
    }
  };

  const handleResendCode = async () => {
    if (!signIn) return;
    try {
      await signIn.emailCode.sendCode();
    } catch (err) {
      console.error('Resend error:', err);
    }
  };

  // Verify Email Step
  if (step === 'verify_email') {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[var(--background)]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[-120px] top-[-120px] h-[400px] w-[400px] rounded-full bg-[var(--accent)]/20 blur-3xl animate-pulse" />
          <div className="absolute bottom-[-120px] right-[-120px] h-[400px] w-[400px] rounded-full bg-[var(--accent)]/10 blur-3xl animate-pulse delay-1000" />
        </div>
        <div id="clerk-captcha" style={{ display: 'none' }}></div>
        <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <Card className="rounded-[2.5rem] border border-[var(--border)] bg-[var(--surface)]/80 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl shadow-black/5 relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setStep('login');
                  setCode('');
                  setError('');
                }}
                className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </motion.button>

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
                {/* Visual OTP Box Container */}
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

                {/* Completely hidden but operational input */}
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
                  className="w-full h-12 text-[var(--foreground)]/60 hover:text-[var(--foreground)] font-medium transition-colors"
                >
                  Resend Code
                </button>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4"
                  >
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                    <p className="text-sm text-red-500 font-medium">{error}</p>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main Sign In
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)]">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[-200px] top-[-200px] h-[600px] w-[600px] rounded-full bg-[var(--accent)]/20 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 4 }}
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
                  Welcome Back.
                </span>
                <br />
                Let's Get Cooking.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 text-lg text-[var(--foreground)]/60 max-w-md"
              >
                Log in to continue your fitness journey and access your personalized dashboard.
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
                  { icon: Dumbbell, text: 'Pro Workouts' },
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

                <div className="mb-8">
                  <h2 className="text-3xl font-black tracking-tight">
                    Welcome Back
                  </h2>
                  <p className="mt-2 text-[var(--foreground)]/60">
                    Enter your credentials to access your portal
                  </p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-5">
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
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[var(--foreground)]/80">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--foreground)]/40" />
                      <input
                        type={isVisible ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError('');
                        }}
                        placeholder="••••••••"
                        className="w-full h-14 pl-12 pr-12 rounded-2xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--foreground)]/35 font-medium transition-all outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 hover:border-[var(--foreground)]/20"
                      />
                      <button
                        type="button"
                        onClick={toggleVisibility}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--foreground)]/40 hover:text-[var(--foreground)]/60 transition-colors"
                      >
                        {isVisible ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <div className="flex justify-end mt-1">
                      <Link
                        href="/forgot-password"
                        className="text-sm text-[var(--accent)] font-semibold hover:underline"
                      >
                        Forgot Password?
                      </Link>
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
                          Sign In
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </motion.div>
                </form>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--border)]"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-[var(--surface)] text-[var(--foreground)]/40 font-medium">
                      or continue with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <button
                      onClick={() => handleOAuth('oauth_google')}
                      className="w-full h-12 border-2 border-[var(--border)] bg-[var(--field-background)] hover:bg-[var(--accent)]/5 hover:border-[var(--accent)]/50 transition-all rounded-2xl font-semibold flex items-center justify-center gap-2"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Google
                    </button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <button
                      onClick={() => handleOAuth('oauth_facebook')}
                      className="w-full h-12 border-2 border-[var(--border)] bg-[var(--field-background)] hover:bg-[var(--accent)]/5 hover:border-[var(--accent)]/50 transition-all rounded-2xl font-semibold flex items-center justify-center gap-2"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </button>
                  </motion.div>
                </div>

                <p className="mt-8 text-center text-sm text-[var(--foreground)]/40">
                  Don't have an account?{' '}
                  <a href="/register" className="text-[var(--accent)] font-semibold hover:underline">
                    Create one
                  </a>
                </p>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}