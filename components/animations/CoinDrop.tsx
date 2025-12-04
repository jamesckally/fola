'use client';
import { motion } from 'framer-motion';

export default function CoinDrop({ trigger }: { trigger: boolean }) {
    if (!trigger) return null;

    return (
        <div className="fixed inset-0 pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="w-4 h-4 bg-gold absolute rounded-full"
                    initial={{ y: -200, x: Math.random() * window.innerWidth }}
                    animate={{ y: window.innerHeight, rotate: 360 }}
                    transition={{ duration: 1.5 + i * 0.1, ease: 'easeIn' }}
                />
            ))}
        </div>
    );
}