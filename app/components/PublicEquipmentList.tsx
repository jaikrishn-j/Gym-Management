'use client';

import React, { useState, useMemo } from 'react';
import EquipmentCard from './admin/EquipmentCard';
import { Equipment, CATEGORIES } from '@/app/interfaces/EquipmentInterface';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PublicEquipmentListProps {
  equipments: Equipment[];
}

const ACTIVE_STATUSES = ['available', 'in_use'];

export default function PublicEquipmentList({ equipments }: PublicEquipmentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return equipments.filter((eq) => {
      const matchesSearch =
        !searchTerm ||
        eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (eq.description || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !selectedCategory || eq.category === selectedCategory;
      const matchesStatus = !selectedStatus || eq.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [equipments, searchTerm, selectedCategory, selectedStatus]);

  const hasActiveFilters = searchTerm || selectedCategory || selectedStatus;

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setSelectedStatus(null);
  };

  return (
    <div>
      {/* Search & Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-10 pr-10 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-[var(--muted)] hover:text-[var(--foreground)]" />
            </button>
          )}
        </div>

        {/* Category + Status Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mr-1">
            <SlidersHorizontal className="h-3.5 w-3.5 inline mr-1" />
            Filter:
          </span>

          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() =>
                setSelectedCategory(selectedCategory === cat.value ? null : cat.value)
              }
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                selectedCategory === cat.value
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                  : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--accent)]/30 hover:text-[var(--foreground)]'
              }`}
            >
              {cat.label}
            </button>
          ))}

          <span className="w-px h-5 bg-[var(--border)] mx-1" />

          <button
            onClick={() =>
              setSelectedStatus(selectedStatus === 'available' ? null : 'available')
            }
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              selectedStatus === 'available'
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:border-green-500/30 hover:text-green-500'
            }`}
          >
            Available
          </button>
          <button
            onClick={() =>
              setSelectedStatus(selectedStatus === 'in_use' ? null : 'in_use')
            }
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              selectedStatus === 'in_use'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:border-blue-500/30 hover:text-blue-500'
            }`}
          >
            In Use
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border border-red-500/30 text-red-500 bg-red-500/5 hover:bg-red-500/10 transition-all"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-16"
          >
            <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-[var(--surface-secondary)] mx-auto mb-4">
              <Search className="h-6 w-6 text-[var(--muted)]" />
            </div>
            <p className="text-lg font-semibold text-[var(--foreground)]">No equipment found</p>
            <p className="text-sm text-[var(--muted)] mt-1">
              Try adjusting your search or filters.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map((equipment, i) => (
              <motion.div
                key={equipment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <EquipmentCard equipment={equipment} showActions={false} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
