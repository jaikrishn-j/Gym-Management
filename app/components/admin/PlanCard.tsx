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

const PlanCard = ({ plan, onEdit, onDelete, onToggleStatus, showActions = false, index = 0 }: PlanCardProps) => {
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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
      className="relative group h-full"
    >
      <div className={`
        relative rounded-2xl border overflow-hidden h-full flex flex-col backdrop-blur-xl bg-[var(--surface)]/80
        ${plan.offerPrice 
          ? 'border-[var(--accent)]/50 ring-2 ring-[var(--accent)] shadow-lg shadow-[var(--accent)]/10' 
          : 'border-[var(--border)]/50'
        }
      `}>
        {/* Recommended Badge */}
        {plan.offerPrice && (
          <div className="absolute top-4 right-4 z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]/80 text-[var(--accent-foreground)] text-xs font-bold shadow-lg shadow-[var(--accent)]/20"
            >
              ⭐ Recommended
            </motion.div>
          </div>
        )}

        {/* Plan Content */}
        <div className="p-6 flex-1 flex flex-col">
          {/* Icon Container with Gradient */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 text-[var(--accent)] shadow-lg shadow-[var(--accent)]/10 mb-4">
            <PlanIcon className="h-7 w-7" />
          </div>

          {/* Name + Inline Status Pill */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-bold text-[var(--foreground)]">
              {plan.name}
            </h3>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
              plan.isActive 
                ? 'bg-green-500/10 text-green-500' 
                : 'bg-gray-500/10 text-gray-500'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${plan.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              {plan.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <p className="text-sm text-[var(--muted)] mb-4 line-clamp-2">
            {plan.description}
          </p>

          {/* Price Section */}
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
            {discount > 0 && (
              <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full mt-1 inline-block">
                Save {discount}%
              </span>
            )}
          </div>

          {/* Features */}
          <div className="space-y-2.5 flex-1">
            {plan.features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-green-400/20 to-green-500/10 shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-green-500" />
                </div>
                <span className="text-sm text-[var(--foreground)]/70">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons - Compact Icon Row */}
        {showActions && (
          <div className="px-6 py-3 border-t border-[var(--border)]/50 bg-[var(--surface-secondary)]/30 mt-auto">
            <div className="flex items-center justify-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onEdit?.(plan)}
                className="group relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[var(--accent)]/10 text-[var(--muted)] hover:text-[var(--accent)] transition-all"
                title="Edit plan"
              >
                <Edit className="h-4 w-4" />
              </motion.button>
              <div className="w-px h-6 bg-[var(--border)]/30" />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onToggleStatus?.(plan)}
                className={`group relative flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
                  plan.isActive
                    ? 'text-[var(--muted)] hover:bg-red-500/10 hover:text-red-500'
                    : 'text-[var(--muted)] hover:bg-green-500/10 hover:text-green-500'
                }`}
                title={plan.isActive ? 'Deactivate plan' : 'Activate plan'}
              >
                <Power className="h-4 w-4" />
              </motion.button>
              <div className="w-px h-6 bg-[var(--border)]/30" />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete?.(plan)}
                className="group relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[var(--danger)]/10 text-[var(--muted)] hover:text-[var(--danger)] transition-all"
                title="Delete plan"
              >
                <Trash2 className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PlanCard;
