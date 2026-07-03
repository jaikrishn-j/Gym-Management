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
  ExternalLink
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

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'staff' as 'admin' | 'staff',
    permissions: {
      plans: [] as Permission[],
      equipments: [] as Permission[],
      payments: [] as Permission[],
      analytics: [] as Permission[],
      calendar: [] as Permission[],
      members: [] as Permission[],
      staffs: [] as Permission[],
      permissions: [] as Permission[],
    }
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
      permissions: {
        plans: [],
        equipments: [],
        payments: [],
        analytics: [],
        calendar: [],
        members: [],
        staffs: [],
        permissions: [],
      }
    });
    setEditingStaff(null);
    setError('');
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)]">Staff Management</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Manage your gym staff and their permissions
          </p>
        </div>
        {canCreate && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold text-sm shadow-lg shadow-[var(--accent)]/20 hover:shadow-xl hover:shadow-[var(--accent)]/30 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Staff
          </motion.button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search staff by name or email..."
          className="w-full h-12 pl-10 pr-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
        />
      </div>

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
      {filteredStaffs.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-12 w-12 text-[var(--muted)] mx-auto mb-3" />
          <p className="text-[var(--muted)] text-lg">
            {searchTerm ? 'No staff found matching your search' : 'No staff members added yet'}
          </p>
          {canCreate && !searchTerm && (
            <p className="text-[var(--muted)] text-sm mt-1">
              Click "Add Staff" to create your first staff member
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)]">
                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Staff</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Permissions</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredStaffs.map((staff) => (
                <motion.tr
                  key={staff.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-[var(--surface-secondary)]/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
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
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                      staff.role === 'admin' 
                        ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' 
                        : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    }`}>
                      <Shield className="h-3 w-3" />
                      {staff.role === 'admin' ? 'Admin' : 'Staff'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(Object.entries(staff.permissions) as [keyof StaffPermissions, Permission[]][]).map(([section, perms]) => {
                        if (perms.length === 0) return null;
                        const sectionInfo = PERMISSION_SECTIONS.find(s => s.id === section);
                        const isPublic = PUBLIC_SECTIONS.includes(section);
                        return (
                          <span
                            key={section}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-[var(--accent)]/5 border border-[var(--border)]"
                          >
                            <span>{sectionInfo?.icon}</span>
                            <span className="font-medium">{sectionInfo?.label}</span>
                            <span className="text-[var(--muted)]">:</span>
                            <span>
                              {perms.map((p: Permission) => {
                                const shorthand = PERMISSION_SHORTHAND[p];
                                const isPublicRead = isPublic && p === 'read';
                                return (
                                  <span 
                                    key={p} 
                                    className={`mr-0.5 ${isPublicRead ? 'text-blue-400' : ''}`}
                                  >
                                    {shorthand}
                                  </span>
                                );
                              })}
                            </span>
                            {isPublic && (
                              <Globe className="h-3 w-3 text-blue-400 ml-0.5" />
                            )}
                          </span>
                        );
                      })}
                      {Object.values(staff.permissions).every(p => p.length === 0) && (
                        <span className="text-xs text-[var(--muted)]">No permissions</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                      staff.status === 'active'
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        staff.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                      {staff.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Share Link Button */}
                      <Tooltip content="Generate password reset link for this staff member">
                        <button
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
                        </button>
                      </Tooltip>
                      
                      {canUpdate && (
                        <button
                          onClick={() => handleEdit(staff)}
                          className="p-2 rounded-lg hover:bg-[var(--accent)]/10 text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete && staff.role !== 'admin' && (
                        <button
                          onClick={() => setShowDeleteConfirm(staff)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--muted)] hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[var(--foreground)]">
                  {editingStaff ? 'Edit Staff' : 'Add New Staff'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-secondary)] transition-colors"
                >
                  <X className="h-5 w-5 text-[var(--muted)]" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
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
                      className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
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
                      className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                      required
                      disabled={!!editingStaff}
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'staff' }))}
                    className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Permissions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-[var(--foreground)]/80">
                      Permissions
                    </label>
                    <div className="flex items-center gap-2">
                      <Tooltip content="Public sections (Plans & Equipment) always have read permission enabled for everyone">
                        <Globe className="h-4 w-4 text-blue-400" />
                      </Tooltip>
                      <button
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
                        className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors"
                      >
                        {Object.values(formData.permissions).every(
                          perms => perms.length === ALL_PERMISSIONS.length
                        ) ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {PERMISSION_SECTIONS.map((section) => {
                      const sectionKey = section.id as keyof StaffPermissions;
                      const isPublic = PUBLIC_SECTIONS.includes(section.id);
                      
                      return (
                        <div
                          key={section.id}
                          className="p-4 rounded-xl border border-[var(--border)] bg-[var(--field-background)]"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{section.icon}</span>
                              <span className="font-semibold text-sm text-[var(--foreground)]">
                                {section.label}
                              </span>
                            </div>
                            {isPublic && (
                              <Tooltip content="This section is public - anyone can view it without logging in">
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
                                  <Globe className="h-3 w-3" />
                                  Public
                                </div>
                              </Tooltip>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {ALL_PERMISSIONS.map((permission) => {
                              const isActive = hasPermission(sectionKey, permission);
                              const isDisabled = isPermissionDisabled(sectionKey, permission);
                              const tooltipText = isDisabled 
                                ? PERMISSION_TOOLTIPS.read
                                : PERMISSION_TOOLTIPS[permission];

                              return (
                                <Tooltip key={permission} content={tooltipText}>
                                  <button
                                    type="button"
                                    onClick={() => togglePermission(sectionKey, permission)}
                                    disabled={isDisabled}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                      isActive
                                        ? `${PERMISSION_COLORS[permission]} border border-current`
                                        : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] hover:border-[var(--accent)]'
                                    } ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                  >
                                    {isActive && <Check className="h-3 w-3 inline mr-1" />}
                                    {PERMISSION_LABELS[permission]}
                                    {isDisabled && <Lock className="h-3 w-3 inline ml-1" />}
                                  </button>
                                </Tooltip>
                              );
                            })}
                          </div>
                          {isPublic && (
                            <p className="mt-2 text-xs text-[var(--muted)] flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              Read permission is automatically enabled for public access
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="flex-1 h-12 rounded-xl border-2 border-[var(--border)] bg-[var(--field-background)] text-[var(--foreground)] font-semibold hover:bg-[var(--accent)]/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 h-12 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold shadow-lg shadow-[var(--accent)]/20 hover:shadow-xl hover:shadow-[var(--accent)]/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {editingStaff ? 'Update Staff' : 'Create Staff'}
                      </>
                    )}
                  </button>
                </div>
              </form>
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
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/10">
                    <LinkIcon className="h-5 w-5 text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--foreground)]">Password Reset Link</h3>
                    <p className="text-sm text-[var(--muted)]">
                      For {showShareModal.firstName} {showShareModal.lastName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowShareModal(null);
                    setShareLink('');
                  }}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-secondary)] transition-colors"
                >
                  <X className="h-5 w-5 text-[var(--muted)]" />
                </button>
              </div>

              <div className="mb-4 p-3 rounded-xl bg-[var(--field-background)] border border-[var(--border)]">
                <p className="text-sm font-medium text-[var(--foreground)] break-all">
                  {shareLink}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold shadow-lg shadow-[var(--accent)]/20 hover:shadow-xl hover:shadow-[var(--accent)]/30 transition-all"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Link
                    </>
                  )}
                </button>
                <a
                  href={shareLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-12 w-12 flex items-center justify-center rounded-xl border-2 border-[var(--border)] bg-[var(--field-background)] text-[var(--foreground)] font-semibold hover:bg-[var(--accent)]/5 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <p className="mt-3 text-xs text-[var(--muted)]">
                This link will expire in 24 hours for security purposes. Share this link with the staff member so they can set their password.
              </p>
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
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl z-10"
            >
              <div className="flex items-center gap-3 text-[var(--danger)] mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--danger)]/10 shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Delete Staff</h3>
              </div>
              <p className="text-sm text-[var(--muted)] mb-6">
                Are you sure you want to delete "{showDeleteConfirm.firstName} {showDeleteConfirm.lastName}"? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-semibold text-[var(--foreground)]/70 hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] rounded-xl transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="flex items-center gap-2 bg-[var(--danger)] text-[var(--danger-foreground)] px-4 py-2 text-sm font-semibold rounded-xl shadow-lg shadow-[var(--danger)]/10 transition-all disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrainersPageClient;
