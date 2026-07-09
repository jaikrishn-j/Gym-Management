'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Loader2, 
  X, 
  AlertCircle, 
  Trash2,
  Save,
  Dumbbell,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { Equipment, CATEGORIES, EQUIPMENT_STATUS } from '@/app/interfaces/EquipmentInterface';
import EquipmentCard from '@/app/components/admin/EquipmentCard';

interface StaffEquipmentClientProps {
  initialEquipments: Equipment[];
  initialError: string | null;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  createEquipment: (data: any) => Promise<{ success: boolean; error?: string; data?: any }>;
  updateEquipment: (id: string, data: any) => Promise<{ success: boolean; error?: string; data?: any }>;
  deleteEquipment: (id: string) => Promise<{ success: boolean; error?: string; data?: any }>;
}

const StaffEquipmentClient = ({
  initialEquipments,
  initialError,
  canCreate,
  canUpdate,
  canDelete,
  createEquipment,
  updateEquipment,
  deleteEquipment,
}: StaffEquipmentClientProps) => {
  const [equipments, setEquipments] = useState<Equipment[]>(initialEquipments);
  const [error, setError] = useState(initialError);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Equipment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'cardio',
    quantity: 1,
    status: 'available' as string,
    purchaseDate: '',
    lastMaintenance: '',
    nextMaintenance: '',
    imageUrl: '',
    location: '',
  });

  // Filter equipment based on search and status
  const filteredEquipments = useMemo(() => {
    let filtered = equipments;
    
    if (searchTerm) {
      filtered = filtered.filter(eq => 
        eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (eq.description && eq.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(eq => eq.status === filterStatus);
    }
    
    return filtered;
  }, [searchTerm, filterStatus, equipments]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'cardio',
      quantity: 1,
      status: 'available',
      purchaseDate: '',
      lastMaintenance: '',
      nextMaintenance: '',
      imageUrl: '',
      location: '',
    });
    setEditingEquipment(null);
    setError('');
  };

  // Open edit modal
  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setFormData({
      name: equipment.name,
      description: equipment.description || '',
      category: equipment.category || 'cardio',
      quantity: equipment.quantity,
      status: equipment.status || 'available',
      purchaseDate: equipment.purchaseDate ? new Date(equipment.purchaseDate).toISOString().split('T')[0] : '',
      lastMaintenance: equipment.lastMaintenance ? new Date(equipment.lastMaintenance).toISOString().split('T')[0] : '',
      nextMaintenance: equipment.nextMaintenance ? new Date(equipment.nextMaintenance).toISOString().split('T')[0] : '',
      imageUrl: equipment.imageUrl || '',
      location: equipment.location || '',
    });
    setShowCreateModal(true);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name) {
      setError('Please enter equipment name');
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity.toString()),
      };

      let result;
      if (editingEquipment) {
        result = await updateEquipment(editingEquipment.id, payload);
      } else {
        result = await createEquipment(payload);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to save equipment');
      }

      // Update local state with the new/updated equipment
      if (editingEquipment && result.data) {
        setEquipments(prev => prev.map(eq => eq.id === editingEquipment.id ? result.data! : eq));
      } else if (result.data) {
        setEquipments(prev => [...prev, result.data!]);
      }

      setShowCreateModal(false);
      resetForm();
      toast.success(editingEquipment ? 'Equipment updated' : 'Equipment added');
    } catch (err: any) {
      setError(err.message || 'Failed to save equipment');
      toast.error(err.message || 'Failed to save equipment');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!showDeleteConfirm) return;

    try {
      setIsDeleting(true);
      const result = await deleteEquipment(showDeleteConfirm.id);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete equipment');
      }

      setEquipments(prev => prev.filter(eq => eq.id !== showDeleteConfirm.id));
      setShowDeleteConfirm(null);
      toast.success('Equipment deleted');
    } catch (err: any) {
      setError(err.message || 'Failed to delete equipment');
      toast.error(err.message || 'Failed to delete equipment');
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
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="bg-gradient-to-r from-[var(--accent)]/10 via-[var(--accent)]/5 to-transparent rounded-2xl border border-[var(--border)] p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 text-[var(--accent)] shadow-lg shadow-[var(--accent)]/10">
              <Dumbbell className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[var(--foreground)]">Gym Equipment</h1>
              <p className="text-sm text-[var(--muted)]">View and manage gym equipment inventory</p>
            </div>
          </div>
          {canCreate && (
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(var(--accent), 0.3)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { resetForm(); setShowCreateModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]/90 text-white font-semibold text-sm shadow-lg shadow-[var(--accent)]/20"
            >
              <Plus className="h-4 w-4" />
              Add Equipment
            </motion.button>
          )}
        </div>

        {/* Stat Pills */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--border)]/50">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10">
              <Dumbbell className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-[10px] text-[var(--muted)] font-semibold uppercase">Total</p>
              <p className="text-sm font-bold text-[var(--foreground)]">{equipments.length}</p>
            </div>
          </div>
          <div className="w-px h-8 bg-[var(--border)]" />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--success)]/10">
              <span className="h-4 w-4 text-[var(--success)]">✓</span>
            </div>
            <div>
              <p className="text-[10px] text-[var(--muted)] font-semibold uppercase">Available</p>
              <p className="text-sm font-bold text-[var(--success)]">{equipments.filter(e => e.status === 'available').length}</p>
            </div>
          </div>
          <div className="w-px h-8 bg-[var(--border)]" />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--warning)]/10">
              <span className="h-4 w-4 text-[var(--warning)]">!</span>
            </div>
            <div>
              <p className="text-[10px] text-[var(--muted)] font-semibold uppercase">Maintenance</p>
              <p className="text-sm font-bold text-[var(--warning)]">{equipments.filter(e => e.status === 'maintenance').length}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="backdrop-blur-xl bg-[var(--surface)]/80 rounded-2xl border border-[var(--border)]/50 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search equipment..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-11 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all min-w-[140px]"
          >
            <option value="all">All Status</option>
            {EQUIPMENT_STATUS.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-2xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 p-4"
          >
            <AlertCircle className="h-5 w-5 text-[var(--danger)] shrink-0" />
            <p className="text-sm text-[var(--danger)] font-medium">{error}</p>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              onClick={() => setError('')}
              className="ml-auto"
            >
              <X className="h-4 w-4 text-[var(--danger)]" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Equipment Cards */}
      {filteredEquipments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="text-center py-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 15 }}
            className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--surface-secondary)] mx-auto mb-4"
          >
            <Dumbbell className="h-8 w-8 text-[var(--muted)]" />
          </motion.div>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {searchTerm || filterStatus !== 'all' ? 'No equipment found matching your filters' : 'No equipment added yet'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredEquipments.map((equipment, idx) => (
            <motion.div
              key={equipment.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } }
              }}
            >
              <EquipmentCard
                equipment={equipment}
                index={idx}
                onEdit={canUpdate ? handleEdit : undefined}
                onDelete={canDelete ? (eq) => setShowDeleteConfirm(eq) : undefined}
                showActions={canUpdate || canDelete}
              />
            </motion.div>
          ))}
        </motion.div>
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
              className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/95 backdrop-blur-xl p-6 shadow-2xl z-10"
            >
              {/* Decorative accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent)] via-[var(--accent)]/50 to-transparent rounded-t-2xl" />
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[var(--foreground)]">
                  {editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-secondary)] transition-colors"
                >
                  <X className="h-5 w-5 text-[var(--muted)]" />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Equipment Name */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 }}
                >
                  <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                    Equipment Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Treadmill, Bench Press"
                    className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                    required
                  />
                </motion.div>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the equipment..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all resize-none"
                  />
                </motion.div>

                {/* Category & Quantity */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="grid grid-cols-2 gap-3"
                >
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      min="1"
                      className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                      required
                    />
                  </div>
                </motion.div>

                {/* Status & Location */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="grid grid-cols-2 gap-3"
                >
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                    >
                      {EQUIPMENT_STATUS.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., Zone A, Floor 2"
                      className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                    />
                  </div>
                </motion.div>

                {/* Dates */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-2 gap-3"
                >
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                      className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                    />
                  </div>
                </motion.div>

                {/* Maintenance Dates */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="grid grid-cols-2 gap-3"
                >
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                      Last Maintenance
                    </label>
                    <input
                      type="date"
                      value={formData.lastMaintenance}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastMaintenance: e.target.value }))}
                      className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                      Next Maintenance
                    </label>
                    <input
                      type="date"
                      value={formData.nextMaintenance}
                      onChange={(e) => setFormData(prev => ({ ...prev, nextMaintenance: e.target.value }))}
                      className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                    />
                  </div>
                </motion.div>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="flex-1 h-12 rounded-xl border-2 border-[var(--border)] bg-[var(--field-background)] text-[var(--foreground)] font-semibold hover:bg-[var(--accent)]/5 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(var(--accent), 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSaving}
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]/90 text-white font-semibold shadow-lg shadow-[var(--accent)]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {editingEquipment ? 'Update Equipment' : 'Add Equipment'}
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
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
              className="relative w-full max-w-sm rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/95 backdrop-blur-xl p-6 shadow-2xl z-10"
            >
              {/* Decorative blur circle */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--danger)]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-3 text-[var(--danger)] mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--danger)]/10 shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Delete Equipment</h3>
              </div>
              <p className="text-sm text-[var(--muted)] mb-6">
                Are you sure you want to delete "{showDeleteConfirm.name}"? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-semibold text-[var(--foreground)]/70 hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] rounded-xl transition-all disabled:opacity-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(var(--danger), 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="flex items-center gap-2 bg-gradient-to-r from-[var(--danger)] to-[var(--danger)]/80 text-white px-4 py-2 text-sm font-semibold rounded-xl shadow-lg shadow-[var(--danger)]/20 transition-all disabled:opacity-50"
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

export default StaffEquipmentClient;
