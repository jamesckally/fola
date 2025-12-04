'use client';

import { motion, MotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import { usePerfTier } from '../lib/usePerfTier';

type PerfTier = 'low' | 'mid' | 'high' | 'ultra';

const presets = {
    cardEnter: (tier: PerfTier) => ({
        initial: { opacity: 0, y: tier === 'low' ? 20 : 60, scale: tier === 'low' ? 0.98 : 0.94 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: {
            duration: tier === 'low' ? 0.3 : tier === 'mid' ? 0.5 : 0.8,
            ease: tier === 'low' ? 'easeOut' : [0.22, 1, 0.36, 1],
        },
    }),
    balanceJump: (tier: PerfTier) => ({
        animate: { y: [0, tier === 'low' ? -15 : -40, 0], scale: [1, tier === 'low' ? 1.05 : 1.15, 1] },
        transition: { duration: tier === 'low' ? 0.4 : 0.9, ease: 'easeOut' },
    }),
    confetti: (tier: PerfTier) => tier === 'low' ? 0 : tier === 'mid' ? 30 : tier === 'high' ? 80 : 150,
};

type ResponsiveMotionProps = Omit<MotionProps, 'children'> & {
    variant?: keyof typeof presets;
    children?: ReactNode;
};

export default function ResponsiveMotion({
    children,
    variant = 'cardEnter',
    ...props
}: ResponsiveMotionProps) {
    const tier = usePerfTier();

    // Confetti handling
    if (variant === 'confetti') {
        const count = presets.confetti(tier);
        if (count === 0) return <>{children}</>;
        return (
            <div className="fixed inset-0 pointer-events-none">
                {Array.from({ length: count }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-primary rounded-full"
                        initial={{ y: -100, x: Math.random() * window.innerWidth }}
                        animate={{ y: window.innerHeight + 100 }}
                        transition={{ duration: 2 + Math.random() * 2, ease: 'linear' }}
                    />
                ))}
                {children}
            </div>
        );
    }

    const config = presets[variant](tier);
    return <motion.div {...config} {...props}>{children}</motion.div>;
}