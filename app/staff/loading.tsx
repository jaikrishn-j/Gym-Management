'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function StaffLoading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[var(--background)] flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)]/10"
          >
            <Loader2 className="h-7 w-7 text-[var(--accent)]" />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute h-24 w-24 rounded-full border-2 border-[var(--accent)]/20"
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-1"
        >
          <p className="text-sm font-semibold text-[var(--foreground)]">Loading Staff Portal</p>
          <div className="flex gap-1 mt-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [-2, 2, -2] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}