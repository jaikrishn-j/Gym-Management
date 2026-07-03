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
  Power
} from 'lucide-react';
import { JSX } from 'react/jsx-runtime';

interface EquipmentCardProps {
  equipment: Equipment;
  onEdit?: (equipment: Equipment) => void;
  onDelete?: (equipment: Equipment) => void;
  onToggleStatus?: (equipment: Equipment) => void;
  showActions?: boolean;
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

const EquipmentCard = ({ equipment, onEdit, onDelete, onToggleStatus, showActions = true }: EquipmentCardProps) => {
  // Fix: Use nullish coalescing to handle null values
  const category = equipment.category ?? 'other';
  const categoryInfo = categoryIcons[category] || categoryIcons.other;
  const status = equipment.status || 'available';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:shadow-xl"
    >
      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${
            status === 'available' ? 'bg-green-500' : 
            status === 'in-use' || status === 'in_use' ? 'bg-blue-500' : 
            status === 'maintenance' ? 'bg-yellow-500' : 
            status === 'damaged' || status === 'out_of_order' ? 'bg-red-500' : 
            'bg-gray-500'
          }`} />
          {statusLabels[status] || status}
        </span>
      </div>

      {/* Category Icon with Label */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${categoryInfo.bgColor} transition-colors`}>
          {categoryInfo.icon}
        </div>
        <div>
          <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
            {categoryLabels[category] || 'Other'}
          </span>
        </div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">{equipment.name}</h3>
      <p className="text-sm text-[var(--muted)] mb-3 line-clamp-2">{equipment.description || 'No description'}</p>

      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-[var(--muted)]">
          <Package className="h-3.5 w-3.5" />
          <span>Quantity: <span className="text-[var(--foreground)] font-medium">{equipment.quantity}</span></span>
        </div>
        {equipment.location && (
          <div className="flex items-center gap-2 text-[var(--muted)]">
            <MapPin className="h-3.5 w-3.5" />
            <span>{equipment.location}</span>
          </div>
        )}
        {equipment.lastMaintenance && (
          <div className="flex items-center gap-2 text-[var(--muted)]">
            <Wrench className="h-3.5 w-3.5" />
            <span>Last: {new Date(equipment.lastMaintenance).toLocaleDateString()}</span>
          </div>
        )}
        {equipment.nextMaintenance && (
          <div className="flex items-center gap-2 text-[var(--muted)]">
            <Calendar className="h-3.5 w-3.5" />
            <span>Next: {new Date(equipment.nextMaintenance).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (onEdit || onDelete || onToggleStatus) && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border)]">
          {onToggleStatus && (
            <button
              onClick={() => onToggleStatus(equipment)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                status === 'available' 
                  ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' 
                  : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
              }`}
            >
              <Power className="h-3.5 w-3.5" />
              {status === 'available' ? 'Maintenance' : 'Available'}
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(equipment)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors text-sm font-medium"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(equipment)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-medium"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default EquipmentCard;