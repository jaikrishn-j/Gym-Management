// app/dashboard/components/Topbar.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk, useUser } from '@clerk/nextjs';
import {
  Bell, Settings, LogOut, User, ChevronDown, AlertCircle,
  Loader2, Dumbbell, Megaphone, ExternalLink, CheckCircle2,
  Timer, CreditCard, MessageSquare, UserCircle,
  DumbbellIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getExpiringPlanInfo } from '@/app/dashboard/actions';
import { getUnreadBroadcasts, markBroadcastRead } from '@/app/admin/broadcast/action';

// Types
interface Broadcast {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
}

// Constants
const NAV_ITEMS = [
  { path: '/dashboard/profile', label: 'Profile', icon: User },
  { path: '/dashboard/settings', label: 'Settings', icon: Settings },
  { path: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { path: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { path: '/equipments', label: 'Equipments', icon: DumbbellIcon },
] as const;

const ANIMATION_CONFIG = {
  initial: { opacity: 0, y: -10, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.95 },
  transition: { type: 'spring' as const, duration: 0.4, bounce: 0.15 }
};

// Custom hooks
const useClickOutside = (ref: React.RefObject<HTMLElement | null>, handler: () => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
};

const useNotifications = () => {
  const [expiringDays, setExpiringDays] = useState<number | null>(null);
  const [expiringPlanName, setExpiringPlanName] = useState<string | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [planInfo, broadcastData] = await Promise.all([
          getExpiringPlanInfo(),
          getUnreadBroadcasts('member')
        ]);

        if (planInfo.daysRemaining && planInfo.daysRemaining > 0 && planInfo.daysRemaining <= 3) {
          setExpiringDays(planInfo.daysRemaining);
          setExpiringPlanName(planInfo.planName);
        }

        if (broadcastData.success) {
          setBroadcasts(broadcastData.data);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchData();
  }, []);

  const totalNotifications = useMemo(() => 
    broadcasts.length + (expiringDays !== null ? 1 : 0),
    [broadcasts.length, expiringDays]
  );

  return {
    expiringDays,
    expiringPlanName,
    broadcasts,
    totalNotifications,
    setBroadcasts
  };
};

// Sub-components
const UserAvatar: React.FC<{ user: any }> = ({ user }) => {
  if (user?.imageUrl) {
    return (
      <img
        src={user.imageUrl}
        alt={user.fullName || "User avatar"}
        className="h-8 w-8 rounded-lg object-cover border border-[var(--border)]"
        loading="lazy"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-500 font-semibold text-sm">
      {user?.firstName?.[0] || <User className="h-4 w-4" />}
    </div>
  );
};

const NotificationBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count === 0) return null;
  
  return (
    <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-orange-500 text-[10px] text-white font-bold flex items-center justify-center animate-pulse">
      {count}
    </span>
  );
};

const BroadcastBar: React.FC<{
  broadcasts: Broadcast[];
  onView: (broadcast: Broadcast) => void;
  onDismissAll: () => void;
}> = ({ broadcasts, onView, onDismissAll }) => {
  if (broadcasts.length === 0) return null;

  return (
    <motion.div
      key="broadcast-bar"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-orange-500/20 bg-orange-500/5"
    >
      <div className="px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => onView(broadcasts[0])}
          className="flex items-center gap-3 flex-1 text-left"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
            <Megaphone className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {broadcasts.length > 1
                ? `${broadcasts.length} new announcements`
                : broadcasts[0].title}
            </p>
            <p className="text-xs text-[var(--muted)] truncate">
              {broadcasts.length > 1 ? 'Tap to view all announcements' : broadcasts[0].message}
            </p>
          </div>
        </button>
        <button
          onClick={onDismissAll}
          className="h-8 px-3 rounded-lg bg-orange-500/10 text-orange-500 text-xs font-semibold hover:bg-orange-500/20 transition-colors shrink-0 ml-3"
        >
          Dismiss All
        </button>
      </div>
    </motion.div>
  );
};

const Modal: React.FC<{
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ show, onClose, children, className = '' }) => (
  <AnimatePresence>
    {show && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div
          {...ANIMATION_CONFIG}
          className={`relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl z-10 mx-4 ${className}`}
        >
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// Main Component
export default function DashboardTopbar() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  
  // State
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  
  // Refs
  const accountRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  
  // Custom hooks
  const { broadcasts, totalNotifications, setBroadcasts, expiringDays, expiringPlanName } = useNotifications();
  
  // Click outside handlers
  const closeAccount = useCallback(() => setIsAccountOpen(false), []);
  const closeNotifications = useCallback(() => setIsNotificationsOpen(false), []);
  useClickOutside(accountRef, closeAccount);
  useClickOutside(notificationsRef, closeNotifications);

  // Handlers
  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ redirectUrl: '/login' });
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  }, [signOut]);

  const handleNotificationToggle = useCallback(() => {
    setIsNotificationsOpen(prev => !prev);
    setIsAccountOpen(false);
  }, []);

  const handleAccountToggle = useCallback(() => {
    setIsAccountOpen(prev => !prev);
    setIsNotificationsOpen(false);
  }, []);

  const handleDismissAll = useCallback(async () => {
    try {
      await Promise.all(broadcasts.map(b => markBroadcastRead(b.id)));
      setBroadcasts([]);
    } catch (error) {
      console.error('Failed to dismiss broadcasts:', error);
    }
  }, [broadcasts, setBroadcasts]);

  const handleBroadcastRead = useCallback(async (broadcast: Broadcast) => {
    try {
      await markBroadcastRead(broadcast.id);
      setBroadcasts(prev => prev.filter(b => b.id !== broadcast.id));
    } catch (error) {
      console.error('Failed to mark broadcast as read:', error);
    }
  }, [setBroadcasts]);

  const handleNavigation = useCallback((path: string) => {
    setIsAccountOpen(false);
    router.push(path);
  }, [router]);

  return (
    <>
      <header className="sticky top-0 z-30 h-16 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-xl">
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          {/* Logo */}
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <Dumbbell className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-[var(--foreground)] hidden sm:block">
              GymStitch
            </span>
          </button>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications */}
            <div ref={notificationsRef} className="relative">
              <button
                onClick={handleNotificationToggle}
                className="relative h-10 w-10 flex items-center justify-center rounded-xl hover:bg-[var(--surface-secondary)] transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-[var(--muted)]" />
                <NotificationBadge count={totalNotifications} />
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    {...ANIMATION_CONFIG}
                    className="absolute right-0 mt-2 w-80 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl z-50 max-h-[70vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-[var(--foreground)]">Notifications</p>
                      {expiringDays !== null && (
                        <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium">
                          {expiringDays} day{expiringDays > 1 ? 's' : ''} left
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {broadcasts.map((b) => (
                        <div key={b.id} className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 shrink-0 mt-0.5">
                              <Megaphone className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[var(--foreground)]">{b.title}</p>
                              <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-2">{b.message}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedBroadcast(b);
                              setShowBroadcastModal(true);
                              setIsNotificationsOpen(false);
                            }}
                            className="mt-2 w-full h-8 rounded-lg bg-orange-500/10 text-orange-500 text-xs font-semibold hover:bg-orange-500/20 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3 inline mr-1" /> View Details
                          </button>
                        </div>
                      ))}
                      
                      {expiringDays !== null && expiringPlanName && (
                        <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                          <div className="flex items-center gap-2 mb-1">
                            <Timer className="h-4 w-4 text-orange-500" />
                            <p className="text-sm font-medium text-[var(--foreground)]">Plan Expiring Soon</p>
                          </div>
                          <p className="text-xs text-[var(--muted)] mt-1">
                            Your {expiringPlanName} plan expires in {expiringDays} day{expiringDays > 1 ? 's' : ''}. Renew now!
                          </p>
                        </div>
                      )}
                      
                      {broadcasts.length === 0 && expiringDays === null && (
                        <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                          <p className="text-sm font-medium text-[var(--foreground)]">Welcome to GymStitch!</p>
                          <p className="text-xs text-[var(--muted)] mt-1">Start your fitness journey today</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Account Menu */}
            <div ref={accountRef} className="relative">
              <button
                onClick={handleAccountToggle}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[var(--surface-secondary)] transition-colors"
                aria-label="Account menu"
              >
                <UserAvatar user={user} />
                <div className="hidden md:flex flex-col items-start text-left max-w-[120px]">
                  <span className="text-sm font-semibold truncate w-full text-[var(--foreground)]">
                    {user?.firstName || 'Member'}
                  </span>
                  <span className="text-xs text-green-500 font-medium">Member</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-[var(--muted)] transition-transform duration-200 ${isAccountOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isAccountOpen && (
                  <motion.div
                    {...ANIMATION_CONFIG}
                    className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-xl z-50"
                  >
                    <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                      <p className="text-xs font-medium text-[var(--muted)]">Signed in as</p>
                      <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                        {user?.primaryEmailAddress?.emailAddress}
                      </p>
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-green-500/10 text-green-500 text-xs font-medium">
                        Member
                      </span>
                    </div>

                    {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
                      <button
                        key={path}
                        onClick={() => handleNavigation(path)}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[var(--foreground)]/80 hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-secondary)] transition-colors"
                      >
                        <Icon className="h-4 w-4 text-[var(--muted)]" />
                        {label}
                      </button>
                    ))}

                    <button
                      onClick={() => {
                        setIsAccountOpen(false);
                        setShowLogoutModal(true);
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[var(--danger)] rounded-lg hover:bg-[var(--danger)]/10 transition-colors font-medium mt-1 border-t border-[var(--border)] pt-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Broadcast Bar */}
      <BroadcastBar
        broadcasts={broadcasts}
        onView={(broadcast) => {
          setSelectedBroadcast(broadcast);
          setShowBroadcastModal(true);
        }}
        onDismissAll={handleDismissAll}
      />

      {/* Logout Modal */}
      <Modal show={showLogoutModal} onClose={() => !isLoggingOut && setShowLogoutModal(false)} className="max-w-sm">
        <div className="flex items-center gap-3 text-[var(--danger)] mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--danger)]/10 shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-[var(--foreground)]">Log out</h3>
        </div>
        
        <p className="text-sm text-[var(--muted)] mb-6">
          Are you sure you want to log out? You will need to sign back in to access your dashboard.
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
            {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log out'}
          </button>
        </div>
      </Modal>

      {/* Broadcast Detail Modal */}
      <Modal show={showBroadcastModal} onClose={() => setShowBroadcastModal(false)} className="max-w-lg">
        {selectedBroadcast && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                <Megaphone className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-[var(--foreground)]">{selectedBroadcast.title}</h3>
                <p className="text-sm text-[var(--muted)]">
                  {new Date(selectedBroadcast.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--field-background)]/50 border border-[var(--border)]">
              <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                {selectedBroadcast.message}
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="flex-1 h-12 rounded-xl border-2 border-[var(--border)] font-semibold text-sm hover:bg-[var(--surface-secondary)] transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleBroadcastRead(selectedBroadcast);
                  setShowBroadcastModal(false);
                }}
                className="flex-1 h-12 rounded-xl bg-orange-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" /> Mark as Read
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}