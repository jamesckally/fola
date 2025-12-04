'use client';
import { motion } from 'framer-motion';
import { usePerfTier } from '../lib/usePerfTier';

export default function CardCenter({ children }: { children: React.ReactNode }) {
    const tier = usePerfTier();
    const variants = {
        initial: { opacity: 0, y: 50 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: tier === 'low' ? 0.3 : 0.8 },
    };

    return (
        <motion.main {...variants} className="min-h-screen bg-background p-4 flex items-center justify-center">
            <div className="w-full max-w-md space-y-6">{children}</div>
        </motion.main>
    );
}