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
  Power,
  Edit,
  LayoutGrid,
  List
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
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

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
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[var(--accent)]/10 via-[var(--accent)]/5 to-transparent rounded-2xl border border-[var(--border)] p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 text-[var(--accent)] shadow-lg shadow-[var(--accent)]/10">
              <Dumbbell className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[var(--foreground)]">Gym Equipment</h1>
              <p className="text-sm text-[var(--muted)] mt-0.5">
                Manage your gym equipment inventory
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]/90 text-[var(--accent-foreground)] font-semibold text-sm shadow-lg shadow-[var(--accent)]/20 hover:shadow-xl hover:shadow-[var(--accent)]/30 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Equipment
          </motion.button>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex items-center gap-3 mt-5 pt-5 border-t border-[var(--border)]/50">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--surface)]/50 border border-[var(--border)]/30">
            <span className="text-sm font-bold text-[var(--foreground)]">{equipments.length}</span>
            <span className="text-xs text-[var(--muted)]">Total</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--surface)]/50 border border-[var(--border)]/30">
            <span className="text-sm font-bold text-green-500">{equipments.filter(e => e.status === 'available').length}</span>
            <span className="text-xs text-[var(--muted)]">Available</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--surface)]/50 border border-[var(--border)]/30">
            <span className="text-sm font-bold text-yellow-500">{equipments.filter(e => e.status === 'maintenance').length}</span>
            <span className="text-xs text-[var(--muted)]">Maintenance</span>
          </div>
        </div>
      </motion.div>

      {/* View Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-secondary)]">
          <button onClick={() => setViewMode('card')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'card' 
                ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm' 
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}>
            <LayoutGrid className="h-3.5 w-3.5 inline mr-1" /> Cards
          </button>
          <button onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'table' 
                ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm' 
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}>
            <List className="h-3.5 w-3.5 inline mr-1" /> Table
          </button>
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
            <motion.button
              whileHover={{ rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setError('')}
              className="ml-auto"
            >
              <X className="h-4 w-4 text-red-500" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="backdrop-blur-xl bg-[var(--surface)]/80 rounded-2xl border border-[var(--border)]/50 p-1"
      >
        <div className="flex flex-col sm:flex-row gap-2">
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
          <div className="flex gap-1 p-1 rounded-xl bg-[var(--surface-secondary)]">
            <button onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === 'all' 
                  ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm' 
                  : 'text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}>
              All
            </button>
            {EQUIPMENT_STATUS.map(status => (
              <button key={status.value} onClick={() => setFilterStatus(status.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterStatus === status.value 
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm' 
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}>
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Content: Card Grid or Table View */}
      {filteredEquipments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="flex flex-col items-center justify-center py-24"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
            className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--surface-secondary)] mb-6"
          >
            <Dumbbell className="h-10 w-10 text-[var(--muted)]" />
          </motion.div>
          <p className="text-[var(--muted)] text-lg font-semibold">
            {searchTerm || filterStatus !== 'all' 
              ? 'No equipment found matching your filters' 
              : 'No equipment added yet'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <>
              <p className="text-[var(--muted)] text-sm mt-1">
                Click &quot;Add Equipment&quot; to add your first gym equipment
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold text-sm shadow-lg shadow-[var(--accent)]/20 hover:shadow-xl hover:shadow-[var(--accent)]/30 transition-all"
              >
                <Plus className="h-4 w-4" />
                Add First Equipment
              </motion.button>
            </>
          )}
        </motion.div>
      ) : viewMode === 'card' ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipments.map((equipment, idx) => (
            <EquipmentCard
              key={equipment.id}
              equipment={equipment}
              index={idx}
              onEdit={handleEdit}
              onDelete={setShowDeleteConfirm}
              onToggleStatus={handleToggleStatus}
              showActions={true}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/80 backdrop-blur-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]/50">
                  <th className="text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider px-5 py-4">Name</th>
                  <th className="text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider px-5 py-4">Category</th>
                  <th className="text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider px-5 py-4">Quantity</th>
                  <th className="text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider px-5 py-4">Location</th>
                  <th className="text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider px-5 py-4">Status</th>
                  <th className="text-right text-xs font-semibold text-[var(--muted)] uppercase tracking-wider px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredEquipments.map((equipment, idx) => {
                    const cat = equipment.category ?? 'other';
                    const catLabel = CATEGORIES.find(c => c.value === cat)?.label || 'Other';
                    const eqStatus = equipment.status || 'available';
                    const statusLabel = EQUIPMENT_STATUS.find(s => s.value === eqStatus)?.label || eqStatus;
                    return (
                      <motion.tr
                        key={equipment.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03, type: 'spring', stiffness: 200, damping: 25 }}
                        whileHover={{ backgroundColor: 'var(--accent)/2' }}
                        className="border-b border-[var(--border)]/20 transition-colors group"
                      >
                        <td className="px-5 py-4">
                          <span className="text-sm font-semibold text-[var(--foreground)]">{equipment.name}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-[var(--foreground)]/70">{catLabel}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-[var(--foreground)]/70">{equipment.quantity}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-[var(--foreground)]/70">{equipment.location || '—'}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            eqStatus === 'available' ? 'bg-green-500/10 text-green-500' :
                            eqStatus === 'in_use' || eqStatus === 'in-use' ? 'bg-blue-500/10 text-blue-500' :
                            eqStatus === 'maintenance' ? 'bg-yellow-500/10 text-yellow-500' :
                            eqStatus === 'out_of_order' || eqStatus === 'damaged' ? 'bg-red-500/10 text-red-500' :
                            eqStatus === 'retired' ? 'bg-gray-500/10 text-gray-500' :
                            'bg-gray-500/10 text-gray-500'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              eqStatus === 'available' ? 'bg-green-500 animate-pulse' :
                              eqStatus === 'in_use' || eqStatus === 'in-use' ? 'bg-blue-500 animate-pulse' :
                              eqStatus === 'maintenance' ? 'bg-yellow-500 animate-pulse' :
                              eqStatus === 'out_of_order' || eqStatus === 'damaged' ? 'bg-red-500 animate-pulse' :
                              'bg-gray-500'
                            }`} />
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEdit(equipment)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--accent)]/10 text-[var(--muted)] hover:text-[var(--accent)] transition-all"
                              title="Edit equipment"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleToggleStatus(equipment)}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                                eqStatus === 'available'
                                  ? 'text-[var(--muted)] hover:bg-yellow-500/10 hover:text-yellow-500'
                                  : 'text-[var(--muted)] hover:bg-green-500/10 hover:text-green-500'
                              }`}
                              title={eqStatus === 'available' ? 'Mark as maintenance' : 'Mark as available'}
                            >
                              <Power className="h-3.5 w-3.5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setShowDeleteConfirm(equipment)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--danger)]/10 text-[var(--muted)] hover:text-[var(--danger)] transition-all"
                              title="Delete equipment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
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
              className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/95 backdrop-blur-xl shadow-2xl z-10"
            >
              {/* Decorative accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent)] via-[var(--accent)]/50 to-transparent rounded-t-2xl" />

              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                      {editingEquipment ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    </div>
                    <h2 className="text-xl font-bold text-[var(--foreground)]">
                      {editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
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

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Equipment Name */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
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

                  {/* Description with char counter */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                  >
                    <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                      Description
                    </label>
                    <div className="relative">
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the equipment..."
                        rows={3}
                        maxLength={200}
                        className="w-full px-4 py-3 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all resize-none"
                      />
                      <span className="absolute bottom-2 right-3 text-[10px] text-[var(--muted)]">{formData.description.length}/200</span>
                    </div>
                  </motion.div>

                  {/* Category - Pill Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.11 }}
                  >
                    <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                      Category *
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-1.5 rounded-xl bg-[var(--surface-secondary)]">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            formData.category === cat.value 
                              ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm' 
                              : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Quantity */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.14 }}
                  >
                    <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                      Quantity *
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                        className="h-12 w-12 flex items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--foreground)] font-bold hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-all"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                        min="1"
                        className="flex-1 h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] text-center font-bold outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                        className="h-12 w-12 flex items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--foreground)] font-bold hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-all"
                      >
                        +
                      </button>
                    </div>
                  </motion.div>

                  {/* Status - Pill Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.17 }}
                  >
                    <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                      Status *
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-1.5 rounded-xl bg-[var(--surface-secondary)]">
                      {EQUIPMENT_STATUS.map(status => (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, status: status.value }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            formData.status === status.value 
                              ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm' 
                              : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                          }`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Location */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
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
                  </motion.div>

                  {/* Image URL */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 }}
                  >
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
                  </motion.div>

                  {/* Purchase Date & Last Maintenance */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.24 }}
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
                        Last Maintenance
                      </label>
                      <input
                        type="date"
                        value={formData.lastMaintenance}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastMaintenance: e.target.value }))}
                        className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                      />
                    </div>
                  </motion.div>

                  {/* Next Maintenance */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.26 }}
                  >
                    <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                      Next Maintenance
                    </label>
                    <input
                      type="date"
                      value={formData.nextMaintenance}
                      onChange={(e) => setFormData(prev => ({ ...prev, nextMaintenance: e.target.value }))}
                      className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                    />
                  </motion.div>

                  {/* Submit Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28 }}
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
                      whileHover={{ scale: 1.01, boxShadow: '0 0 30px rgba(var(--accent), 0.3)' }}
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
                          {editingEquipment ? 'Update Equipment' : 'Add Equipment'}
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setShowDeleteConfirm(null)}
              className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60 backdrop-blur-md"
            />
            {/* Decorative red blur */}
            <div className="absolute top-1/3 right-1/3 w-56 h-56 bg-[var(--danger)]/10 rounded-full blur-3xl pointer-events-none" />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative w-full max-w-sm rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/95 backdrop-blur-xl p-6 shadow-2xl z-10"
            >
              {/* Decorative accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--danger)] via-[var(--danger)]/50 to-transparent rounded-t-2xl" />
              
              <div className="flex items-center gap-3 mb-3 pt-2">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] shrink-0"
                >
                  <AlertCircle className="h-6 w-6" />
                </motion.div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Delete Equipment</h3>
              </div>
              <p className="text-sm text-[var(--muted)] mb-6 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-[var(--foreground)]">"{showDeleteConfirm.name}"</span>? This action cannot be undone.
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

      {/* Toggle Status Confirmation Modal */}
      <AnimatePresence>
        {togglingEquipment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isToggling && setTogglingEquipment(null)}
              className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60 backdrop-blur-md"
            />
            {/* Decorative colored blur */}
            <div className={`absolute top-1/3 right-1/3 w-56 h-56 rounded-full blur-3xl pointer-events-none ${
              togglingEquipment.status === 'available' ? 'bg-yellow-500/10' : 'bg-green-500/10'
            }`} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative w-full max-w-sm rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/95 backdrop-blur-xl p-6 shadow-2xl z-10"
            >
              {/* Decorative accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r rounded-t-2xl ${
                togglingEquipment.status === 'available' 
                  ? 'from-yellow-500 via-yellow-500/50 to-transparent' 
                  : 'from-green-500 via-green-500/50 to-transparent'
              }`} />
              
              <div className="flex items-center gap-3 mb-3 pt-2">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${
                    togglingEquipment.status === 'available' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'
                  }`}
                >
                  <Power className="h-6 w-6" />
                </motion.div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">
                  {togglingEquipment.status === 'available' ? 'Mark as Maintenance' : 'Mark as Available'}
                </h3>
              </div>
              <p className="text-sm text-[var(--muted)] mb-6 leading-relaxed">
                {togglingEquipment.status === 'available' ? (
                  <>Are you sure you want to mark <span className="font-semibold text-[var(--foreground)]">"{togglingEquipment.name}"</span> as under maintenance?</>
                ) : (
                  <>Are you sure you want to mark <span className="font-semibold text-[var(--foreground)]">"{togglingEquipment.name}"</span> as available?</>
                )}
              </p>
              <div className="flex items-center justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isToggling}
                  onClick={() => setTogglingEquipment(null)}
                  className="px-5 py-2.5 text-sm font-semibold text-[var(--foreground)]/70 hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] rounded-xl transition-all disabled:opacity-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isToggling}
                  onClick={handleToggleConfirm}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 ${
                    togglingEquipment.status === 'available'
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-500/90 text-white shadow-yellow-500/20 hover:shadow-yellow-500/30'
                      : 'bg-gradient-to-r from-green-500 to-green-500/90 text-white shadow-green-500/20 hover:shadow-green-500/30'
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
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EquipmentsPageClient;