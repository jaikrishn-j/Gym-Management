// app/admin/components/PlanCard.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  Edit, 
  Trash2, 
  Star,
  Zap,
  Crown,
  Power
} from 'lucide-react';
import { Plan, PlanCardProps } from '@/app/interfaces/planInterface';




const PlanCard = ({ plan, onEdit, onDelete, onToggleStatus, showActions = false }: PlanCardProps) => {
  const discount = plan.offerPrice 
    ? Math.round(((plan.price - plan.offerPrice) / plan.price) * 100)
    : 0;

  // Indian number formatting function
  const formatIndianNumber = (num: number): string => {
    const numStr = num.toString();
    const lastThree = numStr.substring(numStr.length - 3);
    const otherNumbers = numStr.substring(0, numStr.length - 3);
    
    if (otherNumbers !== '') {
      return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
    }
    return lastThree;
  };

  const formatBillingDuration = (days: number) => {
    if (days > 0 && days % 365 === 0) {
      const y = days / 365;
      return `/ ${y} year${y > 1 ? 's' : ''}`;
    }
    if (days > 0 && days % 30 === 0) {
      const m = days / 30;
      return `/ ${m} month${m > 1 ? 's' : ''}`;
    }
    return `/ ${days} day${days > 1 ? 's' : ''}`;
  };

  const billingText = formatBillingDuration(plan.billingDays);

  const getPlanIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('pro') || lower.includes('premium')) return Crown;
    if (lower.includes('elite') || lower.includes('ultimate')) return Zap;
    return Star;
  };

  const PlanIcon = getPlanIcon(plan.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="relative group h-full"
    >
      <div className={`
        relative rounded-2xl border overflow-hidden h-full flex flex-col
        ${plan.offerPrice 
          ? 'border-[var(--accent)] bg-[var(--surface)] shadow-lg shadow-[var(--accent)]/10' 
          : 'border-[var(--border)] bg-[var(--surface)]'
        }
      `}>
        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-4 right-4 z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] text-xs font-bold"
            >
              <Zap className="h-3 w-3" />
              {discount}% OFF
            </motion.div>
          </div>
        )}

        {/* Plan Content */}
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <div className={`
              flex h-12 w-12 items-center justify-center rounded-xl shrink-0
              ${plan.offerPrice 
                ? 'bg-[var(--accent)] shadow-lg shadow-[var(--accent)]/20' 
                : 'bg-[var(--surface-secondary)]'
              }
            `}>
              <PlanIcon className={`h-6 w-6 ${plan.offerPrice ? 'text-[var(--accent-foreground)]' : 'text-[var(--foreground)]'}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--foreground)]">
                {plan.name}
              </h3>
              {!plan.isActive && (
                <span className="text-xs text-red-500 font-medium">Inactive</span>
              )}
            </div>
          </div>

          <p className="text-sm text-[var(--muted)] mb-4 line-clamp-2">
            {plan.description}
          </p>

          {/* Price with Indian formatting */}
          <div className="mb-4">
            {plan.offerPrice ? (
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-3xl font-black text-[var(--accent)]">
                  ₹{formatIndianNumber(plan.offerPrice)}
                </span>
                <span className="text-lg text-[var(--muted)] line-through">
                  ₹{formatIndianNumber(plan.price)}
                </span>
                <span className="text-sm text-[var(--foreground)]/60">{billingText}</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-3xl font-black text-[var(--foreground)]">
                  ₹{formatIndianNumber(plan.price)}
                </span>
                <span className="text-sm text-[var(--muted)]">{billingText}</span>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="space-y-2.5 flex-1">
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]/10 shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-[var(--accent)]" />
                </div>
                <span className="text-sm text-[var(--foreground)]/70">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-secondary)]/50 mt-auto">
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onEdit?.(plan)}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent)]/5 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onToggleStatus?.(plan)}
                className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border text-sm font-medium transition-all ${
                  plan.isActive
                    ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'
                    : 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20'
                }`}
              >
                <Power className="h-4 w-4" />
                {plan.isActive ? 'Deactivate' : 'Activate'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onDelete?.(plan)}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger)]/20 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PlanCard;