'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useClerk, useUser } from '@clerk/nextjs';
import { 
  Dumbbell, 
  Bell, 
  Settings, 
  LogOut, 
  User, 
  ChevronDown, 
  AlertCircle, 
  Loader2,
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Menu,
  Package,
  ShoppingCart,
  TrendingUp,
  ClipboardList,
  X,
  CheckCircle2,
  IndianRupee,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Footer from '../Footer';
import { getPendingPlanRequests, approvePlanRequest, rejectPlanRequest } from '@/app/admin/members/action';

const useClickOutside = (ref: React.RefObject<HTMLElement | null>, handler: () => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
};

const sidebarItems = [
  {
    section: 'Main',
    items: [
      { title: 'Dashboard', icon: LayoutDashboard, path: '/admin', exact: true }
      // { title: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
    ]
  },
  {
    section: 'Management',
    items: [
      { title: 'Members', icon: Users, path: '/admin/members', exact: false },
      { title: 'Trainers', icon: Dumbbell, path: '/admin/trainers', exact: false },
      { title: 'Plans', icon: ClipboardList, path: '/admin/plans', exact: false },
      { title: 'Equipment', icon: Package, path: '/admin/equipment', exact: false }
    ]
  },
  {
    section: 'Finance',
    items: [
      { title: 'Payments', icon: CreditCard, path: '/admin/payments', exact: false },
    ]
  },
  {
    section: 'Communication',
    items: [
      { title: 'Broadcast', icon: MessageSquare, path: '/admin/broadcast', exact: false }
    ]
  },
  {
    section: 'System',
    items: [
      { title: 'Settings', icon: Settings, path: '/admin/settings', exact: false }
    ]
  }
];

interface PendingRequestItem {
  id: string;
  clerkUserId: string;
  planName: string | null;
  amount: number | null;
  createdAt: Date;
}

export default function AdminSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  
  const [pendingRequests, setPendingRequests] = useState<PendingRequestItem[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PendingRequestItem | null>(null);
  const [approveForm, setApproveForm] = useState({ amount: '', paymentMethod: 'cash', notes: '' });
  const [actionError, setActionError] = useState('');

  const accountRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useClickOutside(accountRef, () => setIsAccountOpen(false));
  useClickOutside(notificationsRef, () => setIsNotificationsOpen(false));

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    const result = await getPendingPlanRequests();
    if (result.success) {
      setPendingRequests(result.data as PendingRequestItem[]);
    }
    setLoadingRequests(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setApprovingId(selectedRequest.id);
    setActionError('');
    try {
      const result = await approvePlanRequest(selectedRequest.id, {
        amount: parseFloat(approveForm.amount),
        paymentMethod: approveForm.paymentMethod,
        notes: approveForm.notes || undefined,
      });
      if (!result.success) throw new Error(result.error || 'Failed to approve');
      setPendingRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
      setShowApproveModal(false);
      setSelectedRequest(null);
      setApproveForm({ amount: '', paymentMethod: 'cash', notes: '' });
      toast.success('Payment approved');
    } catch (err: any) {
      setActionError(err.message);
      toast.error(err.message || 'Failed to approve');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setActionError('');
    try {
      const result = await rejectPlanRequest(requestId);
      if (!result.success) throw new Error(result.error || 'Failed to reject');
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success('Request rejected');
    } catch (err: any) {
      setActionError(err.message);
      toast.error(err.message || 'Failed to reject');
    }
  };

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    await signOut({ redirectUrl: '/login' });
  }, [signOut]);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return pathname === path;
    return pathname === path || pathname?.startsWith(path + '/');
  };

  const currentPage = sidebarItems
    .flatMap(s => s.items)
    .find(item => isActive(item.path, item.exact));

  const getContentPadding = () => {
    if (isMobile) return '0px';
    return isSidebarCollapsed ? '80px' : '256px';
  };

  const notificationCount = pendingRequests.length;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{ 
          width: isMobile ? 256 : (isSidebarCollapsed ? 80 : 256),
          x: isMobile ? (isMobileSidebarOpen ? 0 : -256) : 0
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        onMouseEnter={() => !isMobile && setIsSidebarHovered(true)}
        onMouseLeave={() => !isMobile && setIsSidebarHovered(false)}
        className="fixed left-0 top-0 z-40 h-full bg-[var(--surface)] border-r border-[var(--border)] flex flex-col"
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/70 shrink-0">
              <Dumbbell className="h-4 w-4 text-[var(--accent-foreground)]" />
            </div>
            <AnimatePresence mode="wait">
              {(!isSidebarCollapsed || isMobile) && (
                <motion.span
                  key="gymstitch-text"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm font-black tracking-tight text-[var(--foreground)] whitespace-nowrap overflow-hidden"
                >
                  GymStitch
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          
          {(!isSidebarCollapsed || isSidebarHovered) && !isMobile && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--accent)]/10 transition-colors shrink-0"
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-[var(--muted)]" />
              )}
            </motion.button>
          )}

          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--accent)]/10"
          >
            <X className="h-4 w-4 text-[var(--muted)]" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 scrollbar-thin">
          {sidebarItems.map((section) => (
            <div key={section.section} className="mb-6">
              <AnimatePresence>
                {(!isSidebarCollapsed || isMobile) && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-3 mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)] overflow-hidden"
                  >
                    {section.section}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.path, item.exact);
                  const Icon = item.icon;

                  return (
                    <motion.button
                      key={item.path}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        router.push(item.path);
                        setIsMobileSidebarOpen(false);
                      }}
                      onMouseEnter={() => setHoveredItem(item.path)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden ${
                        active 
                          ? 'bg-[var(--accent)]/10 text-[var(--accent)]' 
                          : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/5'
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-[var(--accent)]"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}

                      <motion.div
                        animate={active ? { scale: 1.1 } : { scale: 1 }}
                        className="relative shrink-0"
                      >
                        <Icon className="h-5 w-5" />
                        {active && (
                          <motion.div
                            layoutId="iconGlow"
                            className="absolute inset-0 bg-[var(--accent)]/20 blur-lg rounded-full"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                      </motion.div>

                      <AnimatePresence mode="wait">
                        {(!isSidebarCollapsed || isMobile) && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="whitespace-nowrap overflow-hidden"
                          >
                            {item.title}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {isSidebarCollapsed && !isMobile && hoveredItem === item.path && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-[var(--foreground)] text-[var(--background)] text-xs font-medium whitespace-nowrap z-50 shadow-lg"
                        >
                          {item.title}
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-[var(--border)] shrink-0">
          <AnimatePresence>
            {(!isSidebarCollapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 py-2"
              >
                <p className="text-xs text-[var(--muted)]">© 2024 GymStitch</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      <motion.div
        animate={{ paddingLeft: getContentPadding() }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="min-h-screen flex flex-col"
      >
        <header className="sticky top-0 z-30 h-16 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-xl shrink-0">
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden h-10 w-10 flex items-center justify-center rounded-xl hover:bg-[var(--surface-secondary)] transition-colors"
              >
                <Menu className="h-5 w-5 text-[var(--foreground)]" />
              </button>
              
              {currentPage && (() => {
                const PageIcon = currentPage.icon;
                return (
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] shadow-lg shadow-[var(--accent)]/20">
                      <PageIcon className="h-5 w-5 text-[var(--accent-foreground)]" />
                    </div>
                    <div>
                      <h1 className="text-lg font-black tracking-tight text-[var(--foreground)]">{currentPage.title}</h1>
                      <p className="text-xs text-[var(--muted)] font-medium">Admin Dashboard</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center gap-3">
              <div ref={notificationsRef} className="relative">
                <button
                  onClick={() => {
                    setIsNotificationsOpen(!isNotificationsOpen);
                    setIsAccountOpen(false);
                  }}
                  className="relative h-10 w-10 flex items-center justify-center rounded-xl hover:bg-[var(--surface-secondary)] transition-colors"
                >
                  <Bell className="h-5 w-5 text-[var(--muted)]" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-[var(--danger)] text-[10px] text-white font-bold flex items-center justify-center">
                      {notificationCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-96 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl z-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-[var(--foreground)]">Notifications</p>
                        {loadingRequests && <Loader2 className="h-4 w-4 animate-spin text-[var(--muted)]" />}
                      </div>

                      {actionError && (
                        <div className="mb-3 p-2 rounded-lg bg-red-500/10 text-xs text-red-500">
                          {actionError}
                        </div>
                      )}

                      {notificationCount === 0 && !loadingRequests && (
                        <p className="text-xs text-[var(--muted)] mt-1">No new updates.</p>
                      )}

                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {pendingRequests.map((req) => (
                          <div key={req.id} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--field-background)]/50">
                            <div className="flex items-start gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
                                <Send className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[var(--foreground)]">Plan Request</p>
                                <p className="text-xs text-[var(--muted)] mt-0.5">
                                  {req.planName ?? 'Unknown plan'}
                                </p>
                                {req.amount && (
                                  <p className="text-xs font-medium text-green-500 mt-0.5">
                                    ₹{req.amount}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setApproveForm(prev => ({ ...prev, amount: req.amount?.toString() ?? '' }));
                                  setShowApproveModal(true);
                                  setIsNotificationsOpen(false);
                                }}
                                disabled={approvingId === req.id}
                                className="flex-1 h-8 rounded-lg bg-green-500/10 text-green-500 text-xs font-semibold hover:bg-green-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                              >
                                {approvingId === req.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <><CheckCircle2 className="h-3 w-3" /> Accept</>
                                )}
                              </button>
                              <button
                                onClick={() => handleReject(req.id)}
                                disabled={approvingId === req.id}
                                className="flex-1 h-8 rounded-lg bg-red-500/10 text-red-500 text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div ref={accountRef} className="relative">
                <button
                  onClick={() => {
                    setIsAccountOpen(!isAccountOpen);
                    setIsNotificationsOpen(false);
                  }}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[var(--surface-secondary)] transition-colors"
                >
                  {user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={user.fullName || "User avatar"}
                      className="h-8 w-8 rounded-lg object-cover border border-[var(--border)]"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] font-semibold text-sm">
                      {user?.firstName?.[0] || <User className="h-4 w-4" />}
                    </div>
                  )}
                  <div className="hidden md:flex flex-col items-start text-left max-w-[120px]">
                    <span className="text-sm font-semibold truncate w-full text-[var(--foreground)]">
                      {user?.fullName || 'Admin User'}
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-[var(--muted)] transition-transform duration-200 ${isAccountOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isAccountOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-xl z-50"
                    >
                      <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                        <p className="text-xs font-medium text-[var(--muted)]">Signed in as</p>
                        <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                          {user?.primaryEmailAddress?.emailAddress}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setIsAccountOpen(false);
                          router.push('/admin/settings');
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[var(--foreground)]/80 hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-secondary)] transition-colors"
                      >
                        <Settings className="h-4 w-4 text-[var(--muted)]" />
                        Settings
                      </button>

                      <button
                        onClick={() => {
                          setIsAccountOpen(false);
                          setShowLogoutModal(true);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[var(--danger)] rounded-lg hover:bg-[var(--danger)]/10 transition-colors font-medium"
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

        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen flex-1 p-6"
        >
          {children}
        </motion.div>
        <Footer />
      </motion.div>

      {/* Approve Payment Modal */}
      <AnimatePresence>
        {showApproveModal && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !approvingId && setShowApproveModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
              className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl z-10 mx-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--foreground)]">Approve Request</h3>
                  <p className="text-sm text-[var(--muted)]">{selectedRequest.planName}</p>
                </div>
              </div>

              {actionError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-sm text-red-500">
                  {actionError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-1.5 block">Amount (₹)</label>
                  <input
                    type="number"
                    step="1"
                    value={approveForm.amount}
                    onChange={(e) => setApproveForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-1.5 block">Payment Method</label>
                  <select
                    value={approveForm.paymentMethod}
                    onChange={(e) => setApproveForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-green-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase mb-1.5 block">Notes (optional)</label>
                  <input
                    type="text"
                    value={approveForm.notes}
                    onChange={(e) => setApproveForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any remarks..."
                    className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-green-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowApproveModal(false); setActionError(''); }}
                  disabled={!!approvingId}
                  className="flex-1 h-12 rounded-xl border-2 border-[var(--border)] font-semibold text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={!!approvingId || !approveForm.amount}
                  className="flex-1 h-12 rounded-xl bg-green-500 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {approvingId ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {approvingId ? 'Processing...' : 'Approve & Record'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
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
                <h3 className="text-lg font-bold text-[var(--foreground)]">Log out</h3>
              </div>
              
              <p className="text-sm text-[var(--muted)] mb-6">
                Are you sure you want to log out of your Admin Dashboard session? You will need to sign back in to access this area.
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
                  className="flex items-center gap-2 bg-[var(--danger)] text-[var(--danger-foreground)] px-4 py-2 text-sm font-semibold rounded-xl shadow-lg shadow-[var(--danger)]/10 transition-all disabled:opacity-50 min-w-[88px] justify-center"
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
