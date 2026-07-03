// app/components/admin/EquipmentsPageClient.tsx
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
  Search,
  Wrench,
  Power
} from 'lucide-react';
import { toast } from 'sonner';
import { Equipment, CATEGORIES, EQUIPMENT_STATUS, EquipmentsPageClientProps } from '@/app/interfaces/EquipmentInterface';
import EquipmentCard from './EquipmentCard';

const EquipmentsPageClient = ({ 
  initialEquipments, 
  initialError,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  updateEquipmentStatus
}: EquipmentsPageClientProps) => {
  const [equipments, setEquipments] = useState<Equipment[]>(initialEquipments);
  const [error, setError] = useState(initialError);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Equipment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [togglingEquipment, setTogglingEquipment] = useState<Equipment | null>(null);
  const [isToggling, setIsToggling] = useState(false);

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

  // Handle toggle status
  const handleToggleStatus = (equipment: Equipment) => {
    setTogglingEquipment(equipment);
  };

  // Confirm toggle status
  const handleToggleConfirm = async () => {
    if (!togglingEquipment) return;

    try {
      setIsToggling(true);
      const newStatus = togglingEquipment.status === 'available' ? 'maintenance' : 'available';
      const result = await updateEquipmentStatus(togglingEquipment.id, newStatus);
      
      if (result.success && result.data) {
        setEquipments(prev => prev.map(eq => eq.id === togglingEquipment.id ? result.data! : eq));
        setTogglingEquipment(null);
        toast.success(`Equipment marked as ${result.data.status === 'available' ? 'available' : 'in maintenance'}`);
      } else {
        setError(result.error || 'Failed to update equipment status');
        toast.error(result.error || 'Failed to update equipment status');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update equipment status');
      toast.error(err.message || 'Failed to update equipment status');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)]">Gym Equipment</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Manage your gym equipment inventory
          </p>
        </div>
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
          Add Equipment
        </motion.button>
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
            <button 
              onClick={() => setError('')}
              className="ml-auto"
            >
              <X className="h-4 w-4 text-red-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search equipment..."
            className="w-full h-12 pl-10 pr-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all min-w-[140px]"
        >
          <option value="all">All Status</option>
          {EQUIPMENT_STATUS.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </div>

      {/* Equipment Grid */}
      {filteredEquipments.length === 0 ? (
        <div className="text-center py-20">
          <Dumbbell className="h-12 w-12 text-[var(--muted)] mx-auto mb-3" />
          <p className="text-[var(--muted)] text-lg">
            {searchTerm || filterStatus !== 'all' 
              ? 'No equipment found matching your filters' 
              : 'No equipment added yet'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <p className="text-[var(--muted)] text-sm mt-1">
              Click "Add Equipment" to add your first gym equipment
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipments.map((equipment) => (
            <EquipmentCard
              key={equipment.id}
              equipment={equipment}
              onEdit={handleEdit}
              onDelete={setShowDeleteConfirm}
              showActions={true}
            />
          ))}
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
              className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[var(--foreground)]">
                  {editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
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

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Equipment Name */}
                <div>
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
                </div>

                {/* Description */}
                <div>
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
                </div>

                {/* Category & Quantity */}
                <div className="grid grid-cols-2 gap-3">
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
                </div>

                {/* Status & Location */}
                <div className="grid grid-cols-2 gap-3">
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
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
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
                </div>

                {/* Maintenance Dates */}
                <div className="grid grid-cols-2 gap-3">
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
                </div>

                {/* Submit Buttons */}
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
                        {editingEquipment ? 'Update Equipment' : 'Add Equipment'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setShowDeleteConfirm(null)}
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
                <h3 className="text-lg font-bold text-[var(--foreground)]">Delete Equipment</h3>
              </div>
              <p className="text-sm text-[var(--muted)] mb-6">
                Are you sure you want to delete "{showDeleteConfirm.name}"? This action cannot be undone.
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

      {/* Toggle Status Confirmation Modal */}
      <AnimatePresence>
        {togglingEquipment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isToggling && setTogglingEquipment(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl z-10"
            >
              <div className={`flex items-center gap-3 mb-3 ${togglingEquipment.status === 'available' ? 'text-yellow-500' : 'text-green-500'}`}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${togglingEquipment.status === 'available' ? 'bg-yellow-500/10' : 'bg-green-500/10'}`}>
                  <Wrench className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">
                  {togglingEquipment.status === 'available' ? 'Mark as Maintenance' : 'Mark as Available'}
                </h3>
              </div>
              <p className="text-sm text-[var(--muted)] mb-6">
                {togglingEquipment.status === 'available'
                  ? `Are you sure you want to mark "${togglingEquipment.name}" as under maintenance?`
                  : `Are you sure you want to mark "${togglingEquipment.name}" as available?`
                }
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  disabled={isToggling}
                  onClick={() => setTogglingEquipment(null)}
                  className="px-4 py-2 text-sm font-semibold text-[var(--foreground)]/70 hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] rounded-xl transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isToggling}
                  onClick={handleToggleConfirm}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 ${
                    togglingEquipment.status === 'available'
                      ? 'bg-yellow-500 text-white shadow-yellow-500/10'
                      : 'bg-green-500 text-white shadow-green-500/10'
                  }`}
                >
                  {isToggling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Power className="h-4 w-4" />
                      {togglingEquipment.status === 'available' ? 'Maintenance' : 'Available'}
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

export default EquipmentsPageClient;