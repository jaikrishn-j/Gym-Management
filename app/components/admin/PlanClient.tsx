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
  Power,
  LayoutGrid,
  List,
  ClipboardList,
  Edit,
  Check
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
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

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

  // --- Derived stats for hero header ---
  const totalPlans = plans.length;
  const activePlans = plans.filter(p => p.isActive).length;
  const plansWithOffer = plans.filter(p => p.offerPrice);
  const mostPopular = plansWithOffer.length > 0 
    ? plansWithOffer.reduce((best, curr) => 
        (curr.offerPrice! < best.offerPrice!) ? curr : best
      ).name 
    : activePlans > 0 
      ? plans.filter(p => p.isActive).sort((a, b) => a.price - b.price)[0]?.name 
      : null;

  // --- Table formatting helpers ---
  const formatPrice = (n: number) => '₹' + n.toLocaleString('en-IN');
  const formatDuration = (days: number) => {
    if (days > 0 && days % 365 === 0) return `${days / 365} year${days / 365 > 1 ? 's' : ''}`;
    if (days > 0 && days % 30 === 0) return `${days / 30} month${days / 30 > 1 ? 's' : ''}`;
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Hero Pricing Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[var(--accent)]/10 via-[var(--accent)]/5 to-transparent rounded-2xl border border-[var(--border)] p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 text-[var(--accent)] shadow-lg shadow-[var(--accent)]/10">
              <ClipboardList className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[var(--foreground)]">Membership Plans</h1>
              <p className="text-sm text-[var(--muted)] mt-0.5">
                Manage your gym membership plans
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
            Create Plan
          </motion.button>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex items-center gap-3 mt-5 pt-5 border-t border-[var(--border)]/50">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--surface)]/50 border border-[var(--border)]/30">
            <span className="text-sm font-bold text-[var(--foreground)]">{totalPlans}</span>
            <span className="text-xs text-[var(--muted)]">Total Plans</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--surface)]/50 border border-[var(--border)]/30">
            <span className="text-sm font-bold text-green-500">{activePlans}</span>
            <span className="text-xs text-[var(--muted)]">Active</span>
          </div>
          {mostPopular && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--surface)]/50 border border-[var(--border)]/30">
              <span className="text-xs text-[var(--accent)] font-semibold">🔥 {mostPopular}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* View Toggle + Actions Bar */}
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

      {/* Error Banner */}
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

      {/* Content: Card Grid or Table View */}
      {plans.length === 0 ? (
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
            <ClipboardList className="h-10 w-10 text-[var(--muted)]" />
          </motion.div>
          <p className="text-[var(--muted)] text-lg font-semibold">No plans created yet</p>
          <p className="text-[var(--muted)] text-sm mt-1">
            Click &quot;Create Plan&quot; to add your first membership plan
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
            Create First Plan
          </motion.button>
        </motion.div>
      ) : viewMode === 'card' ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, idx) => (
            <PlanCard
              key={plan.id}
              plan={plan}
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
                  <th className="text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider px-5 py-4">Price</th>
                  <th className="text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider px-5 py-4">Offer Price</th>
                  <th className="text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider px-5 py-4">Duration</th>
                  <th className="text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider px-5 py-4">Status</th>
                  <th className="text-right text-xs font-semibold text-[var(--muted)] uppercase tracking-wider px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {plans.map((plan, idx) => (
                    <motion.tr
                      key={plan.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03, type: 'spring', stiffness: 200, damping: 25 }}
                      whileHover={{ backgroundColor: 'var(--accent)/2' }}
                      className="border-b border-[var(--border)]/20 transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-[var(--foreground)]">{plan.name}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-[var(--foreground)]">{formatPrice(plan.price)}</span>
                      </td>
                      <td className="px-5 py-4">
                        {plan.offerPrice ? (
                          <span className="text-sm font-bold text-[var(--accent)]">{formatPrice(plan.offerPrice)}</span>
                        ) : (
                          <span className="text-sm text-[var(--muted)]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-[var(--foreground)]/70">{formatDuration(plan.billingDays)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          plan.isActive 
                            ? 'bg-green-500/10 text-green-500' 
                            : 'bg-gray-500/10 text-gray-500'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${plan.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEdit(plan)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--accent)]/10 text-[var(--muted)] hover:text-[var(--accent)] transition-all"
                            title="Edit plan"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleToggleStatus(plan)}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                              plan.isActive
                                ? 'text-[var(--muted)] hover:bg-red-500/10 hover:text-red-500'
                                : 'text-[var(--muted)] hover:bg-green-500/10 hover:text-green-500'
                            }`}
                            title={plan.isActive ? 'Deactivate plan' : 'Activate plan'}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowDeleteConfirm(plan)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--danger)]/10 text-[var(--muted)] hover:text-[var(--danger)] transition-all"
                            title="Delete plan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
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
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/95 backdrop-blur-xl shadow-2xl z-10"
            >
              {/* Decorative accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent)] via-[var(--accent)]/50 to-transparent rounded-t-2xl" />

              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                      {editingPlan ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    </div>
                    <h2 className="text-xl font-bold text-[var(--foreground)]">
                      {editingPlan ? 'Edit Plan' : 'Create New Plan'}
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

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column - Form Fields */}
                    <div className="space-y-4">
                      {/* Plan Name */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
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
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 }}
                      >
                        <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                          Description *
                        </label>
                        <div className="relative">
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe what this plan offers..."
                            rows={3}
                            maxLength={200}
                            className="w-full px-4 py-3 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all resize-none"
                            required
                          />
                          <span className="absolute bottom-2 right-3 text-[10px] text-[var(--muted)]">{formData.description.length}/200</span>
                        </div>
                      </motion.div>

                      {/* Price Fields */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.11 }}
                        className="grid grid-cols-2 gap-3"
                      >
                        <div>
                          <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                            <span className="text-[var(--muted)] mr-0.5">₹</span> Price *
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] font-medium text-sm">₹</span>
                            <input
                              type="number"
                              value={formData.price}
                              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                              placeholder="999"
                              className="w-full h-12 pl-8 pr-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                            <span className="text-[var(--muted)] mr-0.5">₹</span> Offer Price
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] font-medium text-sm">₹</span>
                            <input
                              type="number"
                              value={formData.offerPrice}
                              onChange={(e) => setFormData(prev => ({ ...prev, offerPrice: e.target.value }))}
                              placeholder="Optional"
                              className="w-full h-12 pl-8 pr-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                            />
                          </div>
                        </div>
                      </motion.div>

                      {/* Billing Period - Pill Buttons */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.14 }}
                      >
                        <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                          Billing Duration *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={formData.billingValue}
                            onChange={(e) => setFormData(prev => ({ ...prev, billingValue: e.target.value }))}
                            placeholder="1"
                            min="1"
                            className="w-24 h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                            required
                          />
                          <div className="flex gap-1.5 flex-1">
                            {['days', 'months', 'years'].map(p => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, billingPeriod: p as 'days' | 'months' | 'years' }))}
                                className={`flex-1 h-12 rounded-xl text-sm font-semibold transition-all ${
                                  formData.billingPeriod === p 
                                    ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20' 
                                    : 'bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--foreground)]'
                                }`}
                              >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>

                      {/* Features */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.17 }}
                      >
                        <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                          Features *
                        </label>
                        <div className="space-y-2">
                          <AnimatePresence>
                            {formData.features.map((feature, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20, height: 0 }}
                                animate={{ opacity: 1, x: 0, height: 'auto' }}
                                exit={{ opacity: 0, x: 20, height: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                className="flex gap-2 items-center"
                              >
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]/10 shrink-0">
                                  <Check className="h-3 w-3 text-[var(--accent)]" />
                                </div>
                                <input
                                  type="text"
                                  value={feature}
                                  onChange={(e) => updateFeature(index, e.target.value)}
                                  placeholder={`Feature ${index + 1}`}
                                  className="flex-1 h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
                                />
                                {formData.features.length > 1 && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="button"
                                    onClick={() => removeFeature(index)}
                                    className="h-12 w-12 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors shrink-0"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </motion.button>
                                )}
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={addFeature}
                          className="mt-2 flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Add Feature
                        </motion.button>
                      </motion.div>
                    </div>

                    {/* Right Column - Live Preview */}
                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-1.5">
                        Preview
                      </label>
                      <div className="sticky top-6">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                          className="rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/80 backdrop-blur-xl overflow-hidden"
                        >
                          {/* Mini Preview Card Header */}
                          <div className="p-5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 text-[var(--accent)] shadow-lg shadow-[var(--accent)]/10 mb-3">
                              <ClipboardList className="h-5 w-5" />
                            </div>
                            <h3 className="text-base font-bold text-[var(--foreground)] mb-1">
                              {formData.name || 'Plan Name'}
                            </h3>
                            <p className="text-xs text-[var(--muted)] line-clamp-2 min-h-[2rem]">
                              {formData.description || 'Plan description will appear here'}
                            </p>

                            {/* Preview Price */}
                            <div className="mt-3 mb-3">
                              {formData.offerPrice ? (
                                <div className="flex items-baseline gap-2">
                                  <span className="text-2xl font-black text-[var(--accent)]">
                                    ₹{(Number(formData.offerPrice) || 0).toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-sm text-[var(--muted)] line-through">
                                    ₹{(Number(formData.price) || 0).toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-[10px] text-[var(--foreground)]/60">
                                    {formData.billingValue ? `/ ${formData.billingValue} ${formData.billingPeriod}` : ''}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-baseline gap-2">
                                  <span className="text-2xl font-black text-[var(--foreground)]">
                                    ₹{(Number(formData.price) || 0).toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-[10px] text-[var(--muted)]">
                                    {formData.billingValue ? `/ ${formData.billingValue} ${formData.billingPeriod}` : ''}
                                  </span>
                                </div>
                              )}
                              {formData.price && formData.offerPrice && Number(formData.price) > 0 && Number(formData.offerPrice) > 0 && (
                                <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full mt-1 inline-block">
                                  Save {Math.round(((Number(formData.price) - Number(formData.offerPrice)) / Number(formData.price)) * 100)}%
                                </span>
                              )}
                            </div>

                            {/* Preview Features */}
                            <div className="space-y-1.5">
                              {formData.features.filter(f => f.trim()).length > 0 ? (
                                formData.features.filter(f => f.trim()).map((f, idx) => (
                                  <div key={idx} className="flex items-start gap-1.5">
                                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-400/20 shrink-0 mt-0.5">
                                      <Check className="h-2.5 w-2.5 text-green-500" />
                                    </div>
                                    <span className="text-xs text-[var(--foreground)]/70">{f}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-[var(--muted)] italic">Add features to see preview</p>
                              )}
                            </div>
                          </div>
                        </motion.div>

                        <p className="text-[10px] text-[var(--muted)] mt-3 text-center">
                          Live preview updates as you type
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex gap-3 pt-4 mt-6 border-t border-[var(--border)]/50"
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
                          {editingPlan ? 'Update Plan' : 'Create Plan'}
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
                <h3 className="text-lg font-bold text-[var(--foreground)]">Delete Plan</h3>
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
        {togglingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isToggling && setTogglingPlan(null)}
              className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60 backdrop-blur-md"
            />
            {/* Decorative colored blur */}
            <div className={`absolute top-1/3 right-1/3 w-56 h-56 rounded-full blur-3xl pointer-events-none ${
              togglingPlan.isActive ? 'bg-red-500/10' : 'bg-green-500/10'
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
                togglingPlan.isActive 
                  ? 'from-[var(--danger)] via-[var(--danger)]/50 to-transparent' 
                  : 'from-green-500 via-green-500/50 to-transparent'
              }`} />
              
              <div className="flex items-center gap-3 mb-3 pt-2">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${
                    togglingPlan.isActive ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                  }`}
                >
                  <Power className="h-6 w-6" />
                </motion.div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">
                  {togglingPlan.isActive ? 'Deactivate Plan' : 'Activate Plan'}
                </h3>
              </div>
              <p className="text-sm text-[var(--muted)] mb-6 leading-relaxed">
                {togglingPlan.isActive ? (
                  <>Are you sure you want to deactivate <span className="font-semibold text-[var(--foreground)]">"{togglingPlan.name}"</span>? Members will not be able to select this plan.</>
                ) : (
                  <>Are you sure you want to activate <span className="font-semibold text-[var(--foreground)]">"{togglingPlan.name}"</span>? Members will be able to select this plan.</>
                )}
              </p>
              <div className="flex items-center justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isToggling}
                  onClick={() => setTogglingPlan(null)}
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
                    togglingPlan.isActive
                      ? 'bg-gradient-to-r from-[var(--danger)] to-[var(--danger)]/90 text-[var(--danger-foreground)] shadow-[var(--danger)]/20 hover:shadow-[var(--danger)]/30'
                      : 'bg-gradient-to-r from-green-500 to-green-500/90 text-white shadow-green-500/20 hover:shadow-green-500/30'
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
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlansPageClient;
