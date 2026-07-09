'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Loader2,
  X,
  AlertCircle,
  Trash2,
  Edit,
  Save,
  Search,
  Users,
  Shield,
  Check,
  Globe,
  Lock,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  ChevronDown,
  SlidersHorizontal
} from 'lucide-react';

import { 
  Staff, 
  StaffPermissions, 
  PERMISSION_SECTIONS, 
  PERMISSION_LABELS, 
  ALL_PERMISSIONS, 
  Permission,
  PERMISSION_COLORS,
  PERMISSION_SHORTHAND,
  PERMISSION_TOOLTIPS,
  PUBLIC_SECTIONS
} from '@/app/interfaces/StaffInterface';

import { toast } from 'sonner';
import Tooltip from '@/app/components/Tooltip';

interface TrainersPageClientProps {
  initialStaffs: Staff[];
  initialError: string;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  createStaff: (data: any) => Promise<{ success: boolean; data?: Staff; error?: string }>;
  updateStaff: (id: string, data: any) => Promise<{ success: boolean; data?: Staff; error?: string }>;
  deleteStaff: (id: string) => Promise<{ success: boolean; data?: { id: string }; error?: string }>;
  toggleStaffStatus: (id: string) => Promise<{ success: boolean; data?: Staff; error?: string }>;
  generateResetLink: (staffId: string, email: string) => Promise<{ success: boolean; token?: string; error?: string }>;
}

const DEFAULT_PERMISSIONS = {
  plans: ['read'] as Permission[],
  equipments: ['read', 'create', 'update', 'delete'] as Permission[],
  payments: ['read'] as Permission[],
  analytics: ['read'] as Permission[],
  calendar: ['read'] as Permission[],
  members: ['read'] as Permission[],
  staffs: ['read'] as Permission[],
  permissions: [] as Permission[],
};

const TrainersPageClient = ({
  initialStaffs,
  initialError,
  canCreate,
  canUpdate,
  canDelete,
  createStaff,
  updateStaff,
  deleteStaff,
  toggleStaffStatus,
  generateResetLink
}: TrainersPageClientProps) => {
  const [staffs, setStaffs] = useState<Staff[]>(initialStaffs);
  const [filteredStaffs, setFilteredStaffs] = useState<Staff[]>(initialStaffs);
  const [error, setError] = useState(initialError);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Staff | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShareModal, setShowShareModal] = useState<Staff | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'staff' as 'admin' | 'staff',
    permissions: { ...DEFAULT_PERMISSIONS }
  });

  // Filter staffs
  useEffect(() => {
    let filtered = staffs;
    if (searchTerm) {
      filtered = filtered.filter(staff =>
        staff.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredStaffs(filtered);
  }, [searchTerm, staffs]);

  // Reset form
  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'staff',
      permissions: { ...DEFAULT_PERMISSIONS }
    });
    setEditingStaff(null);
    setError('');
    setExpandedSections([]);
  };

  // Open edit modal
  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setFormData({
      email: staff.email,
      firstName: staff.firstName,
      lastName: staff.lastName,
      role: staff.role,
      permissions: { ...staff.permissions },
    });
    setShowCreateModal(true);
  };

  // Toggle permission
  const togglePermission = (section: keyof StaffPermissions, permission: Permission) => {
    if (PUBLIC_SECTIONS.includes(section) && permission === 'read') {
      return;
    }

    setFormData(prev => {
      const currentPerms = prev.permissions[section];
      const newPerms = currentPerms.includes(permission)
        ? currentPerms.filter(p => p !== permission)
        : [...currentPerms, permission];
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [section]: newPerms,
        }
      };
    });
  };

  // Check if a permission is active
  const hasPermission = (section: keyof StaffPermissions, permission: Permission): boolean => {
    return formData.permissions[section]?.includes(permission) || false;
  };

  const isPermissionDisabled = (section: keyof StaffPermissions, permission: Permission): boolean => {
    return PUBLIC_SECTIONS.includes(section) && permission === 'read';
  };

  const setSectionPermissions = (sectionKey: keyof StaffPermissions, targetPerms: Permission[]) => {
    ALL_PERMISSIONS.forEach(perm => {
      const shouldBeActive = targetPerms.includes(perm);
      const isCurrentlyActive = hasPermission(sectionKey, perm);
      if (shouldBeActive !== isCurrentlyActive) {
        togglePermission(sectionKey, perm);
      }
    });
  };

  const toggleSectionExpand = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId) 
        : [...prev, sectionId]
    );
  };

  const getSectionStatus = (sectionKey: keyof StaffPermissions): { label: string; color: string; variant: string } => {
    const perms = formData.permissions[sectionKey];
    if (!perms || perms.length === 0) return { label: 'None', color: 'gray', variant: 'bg-gray-500/10 text-gray-500 border-gray-500/20' };
    const hasRead = perms.includes('read');
    const hasCreate = perms.includes('create');
    const hasUpdate = perms.includes('update');
    const hasDelete = perms.includes('delete');
    
    if (hasRead && hasCreate && hasUpdate && hasDelete) return { label: 'Full Access', color: 'green', variant: 'bg-green-500/10 text-green-500 border-green-500/20' };
    if (hasRead && hasCreate && hasUpdate) return { label: 'Read & Write', color: 'amber', variant: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    if (hasRead && hasUpdate) return { label: 'Read & Write', color: 'amber', variant: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    if (hasRead && !hasCreate && !hasUpdate && !hasDelete) return { label: 'Read Only', color: 'blue', variant: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
    return { label: 'Custom', color: 'gray', variant: 'bg-[var(--surface-secondary)] text-[var(--muted)] border-[var(--border)]' };
  };

  const getSelectedCount = (sectionKey: keyof StaffPermissions): number => {
    return formData.permissions[sectionKey]?.length || 0;
  };

  const generateShareLink = async (staff: Staff) => {
    try {
      setIsGeneratingLink(true);
      setError('');
      
      const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(staff.email)) {
        setError('Invalid email format for this staff member');
        return;
      }
      
      const result = await generateResetLink(staff.id, staff.email.trim().toLowerCase());

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate link');
      }

      const baseUrl = window.location.origin;
      const fullLink = `${baseUrl}/auth/reset-password?token=${result.token}`;
      
      setShareLink(fullLink);
      setShowShareModal(staff);
    } catch (err: any) {
      console.error('Error generating share link:', err);
      setError(err.message || 'Failed to generate share link');
      toast.error(err.message || 'Failed to generate share link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Copy share link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Validate form data
  const validateForm = (): string | null => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      return 'Please fill in all required fields';
    }

    const nameRegex = /^[a-zA-Z\s\-'\.]{1,50}$/;
    if (!nameRegex.test(formData.firstName)) {
      return 'First name contains invalid characters. Only letters, spaces, hyphens, apostrophes, and periods are allowed.';
    }
    if (!nameRegex.test(formData.lastName)) {
      return 'Last name contains invalid characters. Only letters, spaces, hyphens, apostrophes, and periods are allowed.';
    }

    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address (e.g., john@example.com)';
    }

    return null;
  };

  // Sanitize input values
  const sanitizeName = (value: string): string => {
    return value.replace(/[^a-zA-Z\s\-'\.]/g, '');
  };

  const sanitizeEmail = (value: string): string => {
    return value.replace(/[^a-zA-Z0-9@._%+\-]/g, '');
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSaving(true);

      const permissions = { ...formData.permissions };
      PUBLIC_SECTIONS.forEach(section => {
        const sectionKey = section as keyof StaffPermissions;
        if (!permissions[sectionKey].includes('read')) {
          permissions[sectionKey] = ['read', ...permissions[sectionKey]];
        }
      });

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        permissions,
        id: editingStaff?.id,
      };

      let result;
      if (editingStaff) {
        result = await updateStaff(editingStaff.id, payload);
      } else {
        result = await createStaff(payload);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to save staff');
      }

      if (editingStaff && result.data) {
        setStaffs(prev => prev.map(s => s.id === editingStaff.id ? result.data! : s));
      } else if (result.data) {
        setStaffs(prev => [...prev, result.data!]);
      }

      setShowCreateModal(false);
      resetForm();
      toast.success(editingStaff ? 'Staff updated' : 'Staff added');
    } catch (err: any) {
      setError(err.message || 'Failed to save staff');
      toast.error(err.message || 'Failed to save staff');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!showDeleteConfirm) return;

    try {
      setIsDeleting(true);
      const result = await deleteStaff(showDeleteConfirm.id);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete staff');
      }

      setStaffs(prev => prev.filter(s => s.id !== showDeleteConfirm.id));
      setShowDeleteConfirm(null);
      toast.success('Staff removed');
    } catch (err: any) {
      setError(err.message || 'Failed to delete staff');
      toast.error(err.message || 'Failed to delete staff');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-gradient-to-r from-[var(--accent)]/10 via-[var(--accent)]/5 to-transparent rounded-2xl border border-[var(--border)] p-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[var(--foreground)]">Staff Management</h1>
              <p className="text-sm text-[var(--muted)] mt-0.5">
                Manage your gym staff and their permissions
              </p>
            </div>
          </div>
          {canCreate && (
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px var(--accent)/30' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold text-sm shadow-lg shadow-[var(--accent)]/20 hover:shadow-xl hover:shadow-[var(--accent)]/30 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Staff
            </motion.button>
          )}
        </div>
        {/* Quick Stats */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-[var(--border)]/50">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)]/60 backdrop-blur-sm border border-[var(--border)]/50">
            <Users className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span className="text-xs font-medium text-[var(--muted)]">Total</span>
            <span className="text-sm font-bold text-[var(--foreground)]">{staffs.length}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/5 backdrop-blur-sm border border-green-500/20">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-[var(--muted)]">Active</span>
            <span className="text-sm font-bold text-green-500">{staffs.filter(s => s.status === 'active').length}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/5 backdrop-blur-sm border border-purple-500/20">
            <Shield className="h-3.5 w-3.5 text-purple-500" />
            <span className="text-xs font-medium text-[var(--muted)]">Admins</span>
            <span className="text-sm font-bold text-purple-500">{staffs.filter(s => s.role === 'admin').length}</span>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="backdrop-blur-xl bg-[var(--surface)]/80 rounded-2xl border border-[var(--border)]/50 p-1"
      >
        <div className="relative flex items-center">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search staff by name or email..."
            className="flex-1 h-12 pl-11 pr-12 rounded-xl border border-transparent bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20 transition-all"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute right-2 p-2 rounded-lg hover:bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            title="Filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4"
          >
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-500 font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff Table */}
      <AnimatePresence mode="wait">
        {filteredStaffs.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="text-center py-20 backdrop-blur-xl bg-[var(--surface)]/80 rounded-2xl border border-[var(--border)]/50"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)]/10 mx-auto mb-4"
            >
              <Users className="h-8 w-8 text-[var(--accent)]" />
            </motion.div>
            <p className="text-[var(--foreground)] text-lg font-semibold">
              {searchTerm ? 'No staff found matching your search' : 'No staff members added yet'}
            </p>
            {canCreate && !searchTerm && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-[var(--muted)] text-sm mt-1"
              >
                Click "Add Staff" to create your first staff member
              </motion.p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-x-auto rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/80 backdrop-blur-sm shadow-lg shadow-black/5"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)]/80">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider w-2/5">Staff</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/50">
                {filteredStaffs.map((staff, idx) => (
                  <motion.tr
                    key={staff.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: idx * 0.03, duration: 0.25 }}
                    whileHover={{ backgroundColor: 'var(--surface-secondary)', scale: 1.003 }}
                    className="transition-colors cursor-default"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 text-[var(--accent)] ring-2 ring-[var(--accent)]/20 font-bold text-sm">
                          {staff.firstName?.[0]}{staff.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--foreground)]">
                            {staff.firstName} {staff.lastName}
                          </p>
                          <p className="text-sm text-[var(--muted)]">{staff.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${
                        staff.role === 'admin' 
                          ? 'bg-purple-500/10 text-purple-500 border-purple-500/20 shadow-purple-500/5' 
                          : 'bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-blue-500/5'
                      }`}>
                        <Shield className="h-3 w-3" />
                        {staff.role === 'admin' ? 'Admin' : 'Staff'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                        staff.status === 'active'
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }`}>
                        <span className="relative flex h-2 w-2">
                          <span className={`absolute inline-flex h-full w-full rounded-full ${
                            staff.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                          } ${staff.status === 'active' ? 'animate-ping opacity-75' : ''}`} />
                          <span className={`relative inline-flex h-2 w-2 rounded-full ${
                            staff.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                          }`} />
                        </span>
                        {staff.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Share Link Button */}
                        <Tooltip content="Generate password reset link for this staff member">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => generateShareLink(staff)}
                            disabled={isGeneratingLink}
                            className="p-2 rounded-lg hover:bg-[var(--accent)]/10 text-[var(--muted)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
                            title="Share Reset Link"
                          >
                            {isGeneratingLink && showShareModal?.id === staff.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <LinkIcon className="h-4 w-4" />
                            )}
                          </motion.button>
                        </Tooltip>
                        
                        {canUpdate && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEdit(staff)}
                            className="p-2 rounded-lg hover:bg-[var(--accent)]/10 text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </motion.button>
                        )}
                        {canDelete && staff.role !== 'admin' && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowDeleteConfirm(staff)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--muted)] hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/95 backdrop-blur-xl shadow-2xl z-10"
            >
              {/* Decorative accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent)] via-[var(--accent)]/50 to-transparent rounded-t-2xl" />

              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                      {editingStaff ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    </div>
                    <h2 className="text-xl font-bold text-[var(--foreground)]">
                      {editingStaff ? 'Edit Staff' : 'Add New Staff'}
                    </h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-secondary)] transition-colors"
                  >
                    <X className="h-5 w-5 text-[var(--muted)]" />
                  </motion.button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: sanitizeName(e.target.value) }))}
                        placeholder="John"
                        maxLength={50}
                        className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: sanitizeName(e.target.value) }))}
                        placeholder="Doe"
                        maxLength={50}
                        className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: sanitizeEmail(e.target.value) }))}
                        placeholder="john@example.com"
                        maxLength={100}
                        className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20 transition-all"
                        required
                        disabled={!!editingStaff}
                      />
                    </div>
                  </motion.div>

                  {/* Role */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-3">
                      Role
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: 'staff' }))}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.role === 'staff'
                            ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-md shadow-[var(--accent)]/10'
                            : 'border-[var(--border)] bg-[var(--field-background)] hover:border-[var(--accent)]/50'
                        }`}
                      >
                        <Users className={`h-5 w-5 mb-1 ${formData.role === 'staff' ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`} />
                        <p className={`font-semibold text-sm ${formData.role === 'staff' ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'}`}>Staff</p>
                        <p className="text-xs text-[var(--muted)]">Limited permissions</p>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.role === 'admin'
                            ? 'border-purple-500 bg-purple-500/10 shadow-md shadow-purple-500/10'
                            : 'border-[var(--border)] bg-[var(--field-background)] hover:border-purple-500/50'
                        }`}
                      >
                        <Shield className={`h-5 w-5 mb-1 ${formData.role === 'admin' ? 'text-purple-500' : 'text-[var(--muted)]'}`} />
                        <p className={`font-semibold text-sm ${formData.role === 'admin' ? 'text-purple-500' : 'text-[var(--foreground)]'}`}>Admin</p>
                        <p className="text-xs text-[var(--muted)]">Full system access</p>
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Permissions */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-[var(--foreground)]/80">
                        Permissions
                      </label>
                      <div className="flex items-center gap-2">
                        <Tooltip content="Public sections (Plans & Equipment) always have read permission enabled for everyone">
                          <Globe className="h-4 w-4 text-blue-400" />
                        </Tooltip>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => {
                            const allPerms = [...ALL_PERMISSIONS];
                            const hasAll = Object.values(formData.permissions).every(
                              perms => perms.length === allPerms.length
                            );
                            const newPermissions = {} as StaffPermissions;
                            (Object.keys(formData.permissions) as Array<keyof StaffPermissions>).forEach(key => {
                              if (PUBLIC_SECTIONS.includes(key)) {
                                newPermissions[key] = hasAll ? ['read'] : ['read', ...allPerms.filter(p => p !== 'read')];
                              } else {
                                newPermissions[key] = hasAll ? [] : [...allPerms];
                              }
                            });
                            setFormData(prev => ({
                              ...prev,
                              permissions: newPermissions,
                            }));
                          }}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[var(--accent)]/5 text-[var(--accent)] hover:bg-[var(--accent)]/10 border border-[var(--accent)]/20 transition-all"
                        >
                          {Object.values(formData.permissions).every(
                            perms => perms.length === ALL_PERMISSIONS.length
                          ) ? 'Deselect All' : 'Select All'}
                        </motion.button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {PERMISSION_SECTIONS.map((section, sectionIdx) => {
                        const sectionKey = section.id as keyof StaffPermissions;
                        const isPublic = PUBLIC_SECTIONS.includes(section.id);
                        const sectionPerms = formData.permissions[sectionKey] || [];
                        const selectedCount = sectionPerms.length;
                        
                        // Preset active check helpers
                        const isViewOnlyActive = selectedCount === 1 && hasPermission(sectionKey, 'read') && 
                          !hasPermission(sectionKey, 'create') && !hasPermission(sectionKey, 'update') && !hasPermission(sectionKey, 'delete');
                        const isEditActive = selectedCount === 3 && hasPermission(sectionKey, 'read') && 
                          hasPermission(sectionKey, 'create') && hasPermission(sectionKey, 'update') && !hasPermission(sectionKey, 'delete');
                        const isFullActive = selectedCount === 4;
                        
                        const status = getSectionStatus(sectionKey);
                        const isExpanded = expandedSections.includes(section.id);
                        
                        return (
                          <motion.div
                            key={section.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.18 + sectionIdx * 0.04 }}
                            className="p-4 rounded-xl border border-[var(--border)]/50 backdrop-blur-sm bg-[var(--surface)]/60"
                          >
                            {/* Collapsed Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{section.icon}</span>
                                <div>
                                  <span className="font-semibold text-sm text-[var(--foreground)]">{section.label}</span>
                                  {isPublic && <span className="text-[10px] text-blue-400 ml-2">🌐 Public</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${status.variant}`}>
                                  {status.label}
                                </span>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => toggleSectionExpand(section.id)}
                                  className="p-1.5 rounded-lg hover:bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                                  type="button"
                                >
                                  <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                </motion.button>
                              </div>
                            </div>
                            
                            {/* Public note when collapsed */}
                            {isPublic && !isExpanded && (
                              <p className="mt-2 text-[10px] text-[var(--muted)] flex items-center gap-1">
                                <Globe className="h-3 w-3" /> Read permission is auto-enabled
                              </p>
                            )}
                            
                            {/* Expanded Content */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pt-4 mt-3 border-t border-[var(--border)]/30">
                                    {/* Quick Preset Pills */}
                                    <div className="flex gap-2 mb-3">
                                      {/* View Only */}
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={() => {
                                          const targetPerms: Permission[] = ['read'];
                                          setSectionPermissions(sectionKey, targetPerms);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                          isViewOnlyActive
                                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                                            : 'bg-transparent text-[var(--muted)] border-[var(--border)] hover:border-blue-500/30 hover:text-blue-500'
                                        }`}
                                      >
                                        👁️ View Only
                                      </motion.button>
                                      
                                      {/* Edit */}
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={() => {
                                          const targetPerms: Permission[] = ['read', 'create', 'update'];
                                          setSectionPermissions(sectionKey, targetPerms);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                          isEditActive
                                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                            : 'bg-transparent text-[var(--muted)] border-[var(--border)] hover:border-amber-500/30 hover:text-amber-500'
                                        }`}
                                      >
                                        ✏️ Edit
                                      </motion.button>
                                      
                                      {/* Full */}
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={() => {
                                          const targetPerms: Permission[] = [...ALL_PERMISSIONS];
                                          setSectionPermissions(sectionKey, targetPerms);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                          isFullActive
                                            ? 'bg-green-500/10 text-green-500 border-green-500/30'
                                            : 'bg-transparent text-[var(--muted)] border-[var(--border)] hover:border-green-500/30 hover:text-green-500'
                                        }`}
                                      >
                                        🔧 Full
                                      </motion.button>
                                    </div>
                                    
                                    {/* Individual permission toggles */}
                                    <div className="flex flex-wrap gap-1.5">
                                      {ALL_PERMISSIONS.map((permission) => {
                                        const isActive = hasPermission(sectionKey, permission);
                                        const isDisabled = isPermissionDisabled(sectionKey, permission);
                                        const tooltipText = isDisabled 
                                          ? PERMISSION_TOOLTIPS.read
                                          : PERMISSION_TOOLTIPS[permission];

                                        return (
                                          <Tooltip key={permission} content={tooltipText}>
                                            <motion.button
                                              whileHover={!isDisabled ? { scale: 1.05 } : {}}
                                              whileTap={!isDisabled ? { scale: 0.95 } : {}}
                                              type="button"
                                              onClick={() => togglePermission(sectionKey, permission)}
                                              disabled={isDisabled}
                                              className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                                                isActive
                                                  ? `${PERMISSION_COLORS[permission]} border border-current shadow-sm`
                                                  : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                                              } ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                            >
                                              {isActive && <Check className="h-2.5 w-2.5 inline mr-0.5" />}
                                              {PERMISSION_LABELS[permission]}
                                              {isDisabled && <Lock className="h-2.5 w-2.5 inline ml-0.5" />}
                                            </motion.button>
                                          </Tooltip>
                                        );
                                      })}
                                    </div>
                                    
                                    {isPublic && (
                                      <p className="mt-2 text-xs text-[var(--muted)] flex items-center gap-1">
                                        <Globe className="h-3 w-3" /> Read permission is automatically enabled for public access
                                      </p>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Submit */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex gap-3 pt-2"
                  >
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                      className="flex-1 h-12 rounded-xl border-2 border-[var(--border)]/50 bg-[var(--field-background)] text-[var(--foreground)] font-semibold hover:bg-[var(--surface-secondary)] hover:border-[var(--border)] transition-all"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.01, boxShadow: '0 0 30px var(--accent)/30' }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]/90 text-[var(--accent-foreground)] font-semibold shadow-lg shadow-[var(--accent)]/20 hover:shadow-xl hover:shadow-[var(--accent)]/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          {editingStaff ? 'Update Staff' : 'Create Staff'}
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Link Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowShareModal(null);
                setShareLink('');
              }}
              className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60 backdrop-blur-md"
            />
            {/* Decorative background blurs */}
            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-[var(--accent)]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative w-full max-w-md rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/95 backdrop-blur-xl p-6 shadow-2xl z-10"
            >
              {/* Decorative accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent)] via-[var(--accent)]/50 to-transparent rounded-t-2xl" />

              <div className="flex items-center justify-between mb-4 pt-2">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] shadow-lg shadow-[var(--accent)]/10"
                  >
                    <LinkIcon className="h-6 w-6" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--foreground)]">Password Reset Link</h3>
                    <p className="text-sm text-[var(--muted)]">
                      For {showShareModal.firstName} {showShareModal.lastName}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setShowShareModal(null);
                    setShareLink('');
                  }}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-secondary)] transition-colors"
                >
                  <X className="h-5 w-5 text-[var(--muted)]" />
                </motion.button>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-4 p-4 rounded-xl bg-[var(--field-background)] border border-[var(--border)]/50"
              >
                <p className="text-sm font-mono font-medium text-[var(--foreground)] break-all">
                  {shareLink}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]/90 text-[var(--accent-foreground)] font-semibold shadow-lg shadow-[var(--accent)]/20 hover:shadow-xl hover:shadow-[var(--accent)]/30 transition-all"
                >
                  {copiedLink ? (
                    <motion.span
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Copied!
                    </motion.span>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Link
                    </>
                  )}
                </motion.button>
                <motion.a
                  whileHover={{ scale: 1.05, backgroundColor: 'var(--accent)/10', borderColor: 'var(--accent)/30' }}
                  whileTap={{ scale: 0.95 }}
                  href={shareLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-12 w-12 flex items-center justify-center rounded-xl border-2 border-[var(--border)]/50 bg-[var(--field-background)] text-[var(--foreground)] font-semibold hover:bg-[var(--accent)]/5 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </motion.a>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-xs text-[var(--muted)] leading-relaxed"
              >
                This is a one-time use link that expires in 24 hours. Share it with the staff member so they can sign in and set up their account.
              </motion.p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(null)}
              className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60 backdrop-blur-md"
            />
            {/* Red decorative blur */}
            <div className="absolute top-1/3 right-1/3 w-56 h-56 bg-[var(--danger)]/10 rounded-full blur-3xl pointer-events-none" />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative w-full max-w-sm rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/95 backdrop-blur-xl p-6 shadow-2xl z-10"
            >
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] shrink-0"
                >
                  <AlertCircle className="h-6 w-6" />
                </motion.div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Delete Staff</h3>
              </div>
              <p className="text-sm text-[var(--muted)] mb-6 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-[var(--foreground)]">"{showDeleteConfirm.firstName} {showDeleteConfirm.lastName}"</span>? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-5 py-2.5 text-sm font-semibold text-[var(--foreground)]/70 hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] rounded-xl transition-all disabled:opacity-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="flex items-center gap-2 bg-gradient-to-r from-[var(--danger)] to-[var(--danger)]/90 text-[var(--danger-foreground)] px-5 py-2.5 text-sm font-semibold rounded-xl shadow-lg shadow-[var(--danger)]/20 hover:shadow-xl hover:shadow-[var(--danger)]/30 transition-all disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrainersPageClient;
