'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dumbbell,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  User,
  LogOut,
  Loader2,
  AlertCircle,
  LayoutDashboard,
  Shield,
  Users
} from 'lucide-react';

export default function LandingTopbar() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardPath = () => {
    if (!user) return null;
    const role = (user as any)?.privateMetadata?.user as string | undefined;
    if (role === 'admin') return '/admin';
    if (role === 'staff') return '/staff';
    return '/dashboard';
  };

  const getDashboardLabel = () => {
    if (!user) return '';
    const role = (user as any)?.privateMetadata?.user as string | undefined;
    if (role === 'admin') return 'Admin Dashboard';
    if (role === 'staff') return 'Staff Portal';
    return 'My Dashboard';
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ redirectUrl: '/' });
    } catch {
      setIsLoggingOut(false);
    }
  };

  const dashboardPath = getDashboardPath();
  const dashboardLabel = getDashboardLabel();

  const navLinks = [
    { label: 'Equipment', href: '/equipments' },
    { label: 'Plans', href: '#plans' },
    { label: 'About', href: '#about' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[var(--surface)]/90 backdrop-blur-xl border-b border-[var(--border)] shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2.5 group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/70 shadow-lg shadow-[var(--accent)]/20 group-hover:shadow-xl group-hover:shadow-[var(--accent)]/30 transition-shadow">
                <Dumbbell className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-[var(--foreground)]">
                GymStitch
              </span>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  className="px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] rounded-xl hover:bg-[var(--surface-secondary)] transition-all"
                >
                  {link.label}
                </button>
              ))}

              {/* Auth-aware dashboard link */}
              {isLoaded && dashboardPath && (
                <button
                  onClick={() => router.push(dashboardPath)}
                  className="ml-2 inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm shadow-lg shadow-[var(--accent)]/20 hover:shadow-xl hover:shadow-[var(--accent)]/30 transition-all"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {dashboardLabel}
                </button>
              )}

              {isLoaded && !user && (
                <button
                  onClick={() => router.push('/login')}
                  className="ml-2 inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm shadow-lg shadow-[var(--accent)]/20 hover:shadow-xl hover:shadow-[var(--accent)]/30 transition-all"
                >
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </nav>

            {/* Desktop Account */}
            {isLoaded && user && (
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <button
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[var(--surface-secondary)] transition-colors"
                  >
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt=""
                        className="h-8 w-8 rounded-lg object-cover border border-[var(--border)]"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] font-semibold text-sm">
                        {user.firstName?.[0] || <User className="h-4 w-4" />}
                      </div>
                    )}
                    <ChevronDown className={`h-4 w-4 text-[var(--muted)] transition-transform duration-200 ${showAccountMenu ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showAccountMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ type: 'spring', duration: 0.3, bounce: 0.15 }}
                        className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-xl z-50"
                      >
                        <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                          <p className="text-xs font-medium text-[var(--muted)]">Signed in as</p>
                          <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                            {user.primaryEmailAddress?.emailAddress}
                          </p>
                        </div>
                        <button
                          onClick={() => { setShowAccountMenu(false); router.push(dashboardPath!); }}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[var(--foreground)]/80 hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-secondary)] transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4 text-[var(--muted)]" />
                          {dashboardLabel}
                        </button>
                        <button
                          onClick={() => { setShowAccountMenu(false); setShowLogoutModal(true); }}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[var(--danger)] rounded-lg hover:bg-[var(--danger)]/10 transition-colors font-medium mt-1 border-t border-[var(--border)] pt-2"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl hover:bg-[var(--surface-secondary)] transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 z-40 pt-16 sm:pt-20 bg-[var(--surface)] md:hidden"
          >
            <nav className="flex flex-col p-4 gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => { setMobileMenuOpen(false); router.push(link.href); }}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--foreground)]/80 rounded-xl hover:bg-[var(--surface-secondary)] transition-colors"
                >
                  {link.label}
                </button>
              ))}

              <div className="border-t border-[var(--border)] my-3" />

              {isLoaded && !user && (
                <button
                  onClick={() => { setMobileMenuOpen(false); router.push('/login'); }}
                  className="flex items-center justify-center gap-2 h-11 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm mx-4 mt-2"
                >
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

              {isLoaded && user && dashboardPath && (
                <>
                  <div className="flex items-center gap-3 px-4 py-3">
                    {user.imageUrl ? (
                      <img src={user.imageUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] font-semibold text-sm">
                        {user.firstName?.[0] || <User className="h-4 w-4" />}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{user.fullName || 'User'}</p>
                      <p className="text-xs text-[var(--muted)]">{user.primaryEmailAddress?.emailAddress}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setMobileMenuOpen(false); router.push(dashboardPath); }}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-[var(--foreground)] rounded-xl hover:bg-[var(--surface-secondary)] transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {dashboardLabel}
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); setShowLogoutModal(true); }}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--danger)] rounded-xl hover:bg-[var(--danger)]/10 transition-colors font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isLoggingOut && setShowLogoutModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
              className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl z-10 mx-4"
            >
              <div className="flex items-center gap-3 text-[var(--danger)] mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--danger)]/10 shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Sign out</h3>
              </div>
              <p className="text-sm text-[var(--muted)] mb-6">
                Are you sure you want to sign out?
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  disabled={isLoggingOut}
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-[var(--foreground)]/70 hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] rounded-xl transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-[var(--danger)] text-white px-4 py-2 text-sm font-semibold rounded-xl shadow-lg shadow-[var(--danger)]/10 transition-all disabled:opacity-50 min-w-[88px] justify-center"
                >
                  {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign out'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
