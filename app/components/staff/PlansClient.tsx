'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Loader2, 
  X, 
  AlertCircle, 
  PlusCircle, 
  Trash2,
  Save,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { Plan } from '@/app/interfaces/planInterface';
import PlanCard from '@/app/components/admin/PlanCard';

interface PlansClientProps {
  initialPlans: Plan[];
  initialError: string;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  createPlan: (data: any) => Promise<{ success: boolean; error?: string; data?: any }>;
  updatePlan: (id: string, data: any) => Promise<{ success: boolean; error?: string; data?: any }>;
  deletePlan: (id: string) => Promise<{ success: boolean; error?: string; data?: any }>;
}

const PlansClient = ({
  initialPlans,
  initialError,
  canCreate,
  canUpdate,
  canDelete,
  createPlan,
  updatePlan,
  deletePlan,
}: PlansClientProps) => {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [error, setError] = useState(initialError);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Plan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    offerPrice: '',
    billingValue: '',
    billingPeriod: 'days' as 'days' | 'months' | 'years',
    features: [''],
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      offerPrice: '',
      billingValue: '',
      billingPeriod: 'days',
      features: [''],
    });
    setEditingPlan(null);
    setError('');
  };

  // Open edit modal
  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    const days = plan.billingDays;
    let billingValue: string;
    let billingPeriod: 'days' | 'months' | 'years';
    if (days > 0 && days % 365 === 0) {
      billingValue = (days / 365).toString();
      billingPeriod = 'years';
    } else if (days > 0 && days % 30 === 0) {
      billingValue = (days / 30).toString();
      billingPeriod = 'months';
    } else {
      billingValue = days.toString();
      billingPeriod = 'days';
    }
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      offerPrice: plan.offerPrice?.toString() || '',
      billingValue,
      billingPeriod,
      features: plan.features.length > 0 ? plan.features : [''],
    });
    setShowCreateModal(true);
  };

  // Add feature field
  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ''],
    }));
  };

  // Remove feature field
  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  // Update feature value
  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => (i === index ? value : f)),
    }));
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.description || !formData.price || !formData.billingValue) {
      setError('Please fill in all required fields');
      return;
    }

    const validFeatures = formData.features.filter(f => f.trim() !== '');
    if (validFeatures.length === 0) {
      setError('Please add at least one feature');
      return;
    }

    const billingValue = parseInt(formData.billingValue, 10);
    if (isNaN(billingValue) || billingValue < 1) {
      setError('Please enter a valid billing duration');
      return;
    }

    const periodMultiplier: Record<string, number> = { days: 1, months: 30, years: 365 };
    const billingDays = billingValue * (periodMultiplier[formData.billingPeriod] || 1);

    try {
      setIsSaving(true);

      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        offerPrice: formData.offerPrice ? parseFloat(formData.offerPrice) : null,
        billingDays,
        features: validFeatures,
      };

      let result;
      if (editingPlan) {
        result = await updatePlan(editingPlan.id, payload);
      } else {
        result = await createPlan(payload);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to save plan');
      }

      // Update local state with the new/updated plan
      if (editingPlan && result.data) {
        setPlans(prev => prev.map(p => p.id === editingPlan.id ? result.data! : p));
      } else if (result.data) {
        setPlans(prev => [...prev, result.data!]);
      }

      setShowCreateModal(false);
      resetForm();
      toast.success(editingPlan ? 'Plan updated' : 'Plan created');
    } catch (err: any) {
      setError(err.message || 'Failed to save plan');
      toast.error(err.message || 'Failed to save plan');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!showDeleteConfirm) return;

    try {
      setIsDeleting(true);
      const result = await deletePlan(showDeleteConfirm.id);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete plan');
      }

      setPlans(prev => prev.filter(p => p.id !== showDeleteConfirm.id));
      setShowDeleteConfirm(null);
      toast.success('Plan deleted');
    } catch (err: any) {
      setError(err.message || 'Failed to delete plan');
      toast.error(err.message || 'Failed to delete plan');
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
              <Star className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[var(--foreground)]">Membership Plans</h1>
              <p className="text-sm text-[var(--muted)]">View and manage gym membership plans</p>
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
              Create Plan
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="flex items-center gap-3 rounded-2xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 p-4"
          >
            <AlertCircle className="h-5 w-5 text-[var(--danger)] shrink-0" />
            <p className="text-sm text-[var(--danger)] font-medium">{error}</p>
            <button onClick={() => setError('')} className="ml-auto">
              <motion.div whileHover={{ rotate: 90 }}>
                <X className="h-4 w-4 text-[var(--danger)]" />
              </motion.div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plans Grid */}
      {plans.length === 0 ? (
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
            <Star className="h-8 w-8 text-[var(--muted)]" />
          </motion.div>
          <p className="text-sm font-semibold text-[var(--foreground)]">No plans created yet</p>
          {canCreate && (
            <p className="text-xs text-[var(--muted)] mt-1">Click "Create Plan" to add your first membership plan</p>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } }
              }}
            >
              <PlanCard
                plan={plan}
                index={idx}
                onEdit={canUpdate ? handleEdit : undefined}
                onDelete={canDelete ? (p) => setShowDeleteConfirm(p) : undefined}
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
              className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60 backdrop-blur-md"
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
                  {editingPlan ? 'Edit Plan' : 'Create New Plan'}
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
                {/* Plan Name */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Basic, Pro, Elite"
                    className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                    required
                  />
                </motion.div>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this plan offers..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all resize-none"
                    required
                  />
                </motion.div>

                {/* Price Fields */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="grid grid-cols-2 gap-3"
                >
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="999"
                      className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                      Offer Price (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.offerPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, offerPrice: e.target.value }))}
                      placeholder="Optional"
                      className="w-full h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                    />
                  </div>
                </motion.div>

                {/* Billing Period */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                    Billing Duration *
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={formData.billingValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, billingValue: e.target.value }))}
                      placeholder="1"
                      min="1"
                      className="w-24 h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                      required
                    />
                    <select
                      value={formData.billingPeriod}
                      onChange={(e) => setFormData(prev => ({ ...prev, billingPeriod: e.target.value as 'days' | 'months' | 'years' }))}
                      className="flex-1 h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                    >
                      <option value="days">Day(s)</option>
                      <option value="months">Month(s)</option>
                      <option value="years">Year(s)</option>
                    </select>
                  </div>
                </motion.div>

                {/* Features */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                    Features *
                  </label>
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          placeholder={`Feature ${index + 1}`}
                          className="flex-1 h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                        />
                        {formData.features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFeature(index)}
                            className="h-12 w-12 flex items-center justify-center rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20 transition-colors shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addFeature}
                    className="mt-2 flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add Feature
                  </button>
                </motion.div>

                {/* Submit Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex gap-3 pt-2"
                >
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
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]/90 text-white font-semibold shadow-lg shadow-[var(--accent)]/20 hover:shadow-xl hover:shadow-[var(--accent)]/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {editingPlan ? 'Update Plan' : 'Create Plan'}
                      </>
                    )}
                  </button>
                </motion.div>
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
              className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/95 backdrop-blur-xl p-6 shadow-2xl z-10 overflow-hidden"
            >
              {/* Decorative blur circle */}
              <div className="absolute -top-20 -right-20 h-40 w-40 bg-[var(--danger)]/10 rounded-full blur-3xl" />

              <div className="flex items-center gap-3 text-[var(--danger)] mb-3 relative z-10">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--danger)]/10 shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Delete Plan</h3>
              </div>
              <p className="text-sm text-[var(--muted)] mb-6 relative z-10">
                Are you sure you want to delete "{showDeleteConfirm.name}"? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3 relative z-10">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-semibold text-[var(--foreground)]/70 hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] rounded-xl transition-all disabled:opacity-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="flex items-center gap-2 bg-gradient-to-r from-[var(--danger)] to-[var(--danger)]/90 text-[var(--danger-foreground)] px-4 py-2 text-sm font-semibold rounded-xl shadow-lg shadow-[var(--danger)]/20 transition-all disabled:opacity-50"
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

export default PlansClient;
