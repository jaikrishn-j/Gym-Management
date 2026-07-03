// /app/components/admin/PlanClient.tsx
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
  Power
} from 'lucide-react';
import { toast } from 'sonner';
import { Plan, PlansPageClientProps } from '@/app/interfaces/planInterface';
import PlanCard from './PlanCard';


const PlansPageClient = ({ 
  initialPlans, 
  initialError, 
  createPlan,
  updatePlan,
  deletePlan,
  togglePlanStatus
}: PlansPageClientProps) => {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [error, setError] = useState(initialError);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Plan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingPlan, setTogglingPlan] = useState<Plan | null>(null);
  const [isToggling, setIsToggling] = useState(false);

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

  // Handle toggle active status — open confirmation
  const handleToggleStatus = (plan: Plan) => {
    setTogglingPlan(plan);
  };

  // Confirm toggle
  const handleToggleConfirm = async () => {
    if (!togglingPlan) return;

    try {
      setIsToggling(true);
      const result = await togglePlanStatus(togglingPlan.id);
      if (result.success && result.data) {
        setPlans(prev => prev.map(p => p.id === togglingPlan.id ? result.data! : p));
        setTogglingPlan(null);
        toast.success(result.data.isActive ? 'Plan activated' : 'Plan deactivated');
      } else {
        setError(result.error || 'Failed to toggle plan status');
        toast.error(result.error || 'Failed to toggle plan status');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to toggle plan status');
      toast.error(err.message || 'Failed to toggle plan status');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)]">Membership Plans</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Manage your gym membership plans
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
          Create Plan
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

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[var(--muted)] text-lg">No plans created yet</p>
          <p className="text-[var(--muted)] text-sm mt-1">
            Click "Create Plan" to add your first membership plan
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={handleEdit}
              onDelete={setShowDeleteConfirm}
              onToggleStatus={handleToggleStatus}
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
                  {editingPlan ? 'Edit Plan' : 'Create New Plan'}
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
                {/* Plan Name */}
                <div>
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
                </div>

                {/* Description */}
                <div>
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
                </div>

                {/* Price Fields */}
                <div className="grid grid-cols-2 gap-3">
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
                </div>

                {/* Billing Period */}
                <div>
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
                </div>

                {/* Features */}
                <div>
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
                            className="h-12 w-12 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors shrink-0"
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
                        {editingPlan ? 'Update Plan' : 'Create Plan'}
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
                <h3 className="text-lg font-bold text-[var(--foreground)]">Delete Plan</h3>
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
        {togglingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isToggling && setTogglingPlan(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl z-10"
            >
              <div className={`flex items-center gap-3 mb-3 ${togglingPlan.isActive ? 'text-red-500' : 'text-green-500'}`}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${togglingPlan.isActive ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                  <Power className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">
                  {togglingPlan.isActive ? 'Deactivate Plan' : 'Activate Plan'}
                </h3>
              </div>
              <p className="text-sm text-[var(--muted)] mb-6">
                {togglingPlan.isActive
                  ? `Are you sure you want to deactivate "${togglingPlan.name}"? Members will not be able to select this plan.`
                  : `Are you sure you want to activate "${togglingPlan.name}"? Members will be able to select this plan.`
                }
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  disabled={isToggling}
                  onClick={() => setTogglingPlan(null)}
                  className="px-4 py-2 text-sm font-semibold text-[var(--foreground)]/70 hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] rounded-xl transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isToggling}
                  onClick={handleToggleConfirm}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 ${
                    togglingPlan.isActive
                      ? 'bg-red-500 text-white shadow-red-500/10'
                      : 'bg-green-500 text-white shadow-green-500/10'
                  }`}
                >
                  {isToggling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Power className="h-4 w-4" />
                      {togglingPlan.isActive ? 'Deactivate' : 'Activate'}
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

export default PlansPageClient;