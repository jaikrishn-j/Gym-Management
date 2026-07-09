// app/components/admin/EquipmentCard.tsx
import { Equipment } from '@/app/interfaces/EquipmentInterface';
import { motion } from 'framer-motion';
import { 
  Dumbbell, 
  Edit, 
  Trash2, 
  Calendar, 
  MapPin, 
  Package, 
  Wrench,
  Bike,
  Weight,
  Activity,
  Wrench as WrenchIcon,
  CircleDot,
  Power,
  Timer,
  AlertTriangle
} from 'lucide-react';
import { JSX } from 'react/jsx-runtime';

interface EquipmentCardProps {
  equipment: Equipment;
  onEdit?: (equipment: Equipment) => void;
  onDelete?: (equipment: Equipment) => void;
  onToggleStatus?: (equipment: Equipment) => void;
  showActions?: boolean;
  index?: number;
}

const statusColors: Record<string, string> = {
  available: 'bg-green-500/10 text-green-500 border-green-500/20',
  'in-use': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  in_use: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  maintenance: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  damaged: 'bg-red-500/10 text-red-500 border-red-500/20',
  out_of_order: 'bg-red-500/10 text-red-500 border-red-500/20',
  retired: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const statusLabels: Record<string, string> = {
  available: 'Available',
  'in-use': 'In Use',
  in_use: 'In Use',
  maintenance: 'Maintenance',
  damaged: 'Damaged',
  out_of_order: 'Out of Order',
  retired: 'Retired',
};

const statusDotColors: Record<string, string> = {
  available: 'bg-green-500',
  'in-use': 'bg-blue-500',
  in_use: 'bg-blue-500',
  maintenance: 'bg-yellow-500',
  damaged: 'bg-red-500',
  out_of_order: 'bg-red-500',
  retired: 'bg-gray-500',
};

// Category icons mapping
const categoryIcons: Record<string, { icon: JSX.Element; bgColor: string }> = {
  cardio: {
    icon: <Bike className="h-6 w-6" />,
    bgColor: 'bg-blue-500/10 text-blue-500'
  },
  strength: {
    icon: <Weight className="h-6 w-6" />,
    bgColor: 'bg-purple-500/10 text-purple-500'
  },
  functional: {
    icon: <Activity className="h-6 w-6" />,
    bgColor: 'bg-green-500/10 text-green-500'
  },
  free_weights: {
    icon: <Dumbbell className="h-6 w-6" />,
    bgColor: 'bg-orange-500/10 text-orange-500'
  },
  accessories: {
    icon: <WrenchIcon className="h-6 w-6" />,
    bgColor: 'bg-yellow-500/10 text-yellow-500'
  },
  other: {
    icon: <CircleDot className="h-6 w-6" />,
    bgColor: 'bg-gray-500/10 text-gray-500'
  },
};

// Category labels for display
const categoryLabels: Record<string, string> = {
  cardio: 'Cardio',
  strength: 'Strength',
  functional: 'Functional',
  free_weights: 'Free Weights',
  accessories: 'Accessories',
  other: 'Other'
};

const EquipmentCard = ({ equipment, onEdit, onDelete, onToggleStatus, showActions = true, index = 0 }: EquipmentCardProps) => {
  // Fix: Use nullish coalescing to handle null values
  const category = equipment.category ?? 'other';
  const categoryInfo = categoryIcons[category] || categoryIcons.other;
  const status = equipment.status || 'available';

  // Check if nextMaintenance is overdue
  const isOverdue = equipment.nextMaintenance 
    ? new Date(equipment.nextMaintenance) < new Date() 
    : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
      className="relative group h-full"
    >
      <div className="relative rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/80 backdrop-blur-xl overflow-hidden h-full flex flex-col">
        {/* Status Badge */}
        <div className="absolute top-4 right-4 z-10">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusDotColors[status] || 'bg-gray-500'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${statusDotColors[status] || 'bg-gray-500'}`} />
            </span>
            {statusLabels[status] || status}
          </span>
        </div>

        {/* Category Icon with Gradient Container */}
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 text-[var(--accent)] shadow-lg shadow-[var(--accent)]/10 mb-4">
            {categoryInfo.icon}
          </div>

          {/* Category Label */}
          <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2">
            {categoryLabels[category] || 'Other'}
          </span>

          {/* Content */}
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">{equipment.name}</h3>
          <p className="text-sm text-[var(--muted)] mb-4 line-clamp-2">{equipment.description || 'No description'}</p>

          {/* Details */}
          <div className="space-y-2 text-sm flex-1">
            <div className="flex items-center gap-2 text-[var(--muted)]">
              <Package className="h-3.5 w-3.5 shrink-0" />
              <span>Quantity: <span className="text-[var(--foreground)] font-medium">{equipment.quantity}</span></span>
            </div>
            {equipment.location && (
              <div className="flex items-center gap-2 text-[var(--muted)]">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{equipment.location}</span>
              </div>
            )}
            {equipment.lastMaintenance && (
              <div className="flex items-center gap-2 text-[var(--muted)]">
                <Wrench className="h-3.5 w-3.5 shrink-0" />
                <span>Last: {new Date(equipment.lastMaintenance).toLocaleDateString()}</span>
              </div>
            )}
            {equipment.nextMaintenance && (
              <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-500' : 'text-[var(--muted)]'}`}>
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span className={isOverdue ? 'font-semibold' : ''}>
                  Next: {new Date(equipment.nextMaintenance).toLocaleDateString()}
                </span>
                {isOverdue && (
                  <span className="flex items-center gap-1 text-[10px] font-bold bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="h-3 w-3" />
                    Overdue
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Compact Icon Row */}
        {showActions && (onEdit || onDelete || onToggleStatus) && (
          <div className="px-6 py-3 border-t border-[var(--border)]/50 bg-[var(--surface-secondary)]/30 mt-auto">
            <div className="flex items-center justify-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onEdit?.(equipment)}
                className="group relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[var(--accent)]/10 text-[var(--muted)] hover:text-[var(--accent)] transition-all"
                title="Edit equipment"
              >
                <Edit className="h-4 w-4" />
              </motion.button>
              <div className="w-px h-6 bg-[var(--border)]/30" />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onToggleStatus?.(equipment)}
                className={`group relative flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
                  status === 'available'
                    ? 'text-[var(--muted)] hover:bg-yellow-500/10 hover:text-yellow-500'
                    : 'text-[var(--muted)] hover:bg-green-500/10 hover:text-green-500'
                }`}
                title={status === 'available' ? 'Mark as maintenance' : 'Mark as available'}
              >
                <Power className="h-4 w-4" />
              </motion.button>
              <div className="w-px h-6 bg-[var(--border)]/30" />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete?.(equipment)}
                className="group relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[var(--danger)]/10 text-[var(--muted)] hover:text-[var(--danger)] transition-all"
                title="Delete equipment"
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

export default EquipmentCard;