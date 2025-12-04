'use client';
import { motion } from 'framer-motion';

export default function Confetti({ trigger }: { trigger: boolean }) {
    if (!trigger) return null;

    return (
        <div className="fixed inset-0 pointer-events-none">
            {Array.from({ length: 50 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="w-2 h-2 bg-primary absolute"
                    initial={{ y: -100, x: Math.random() * window.innerWidth }}
                    animate={{ y: window.innerHeight, x: Math.random() * window.innerWidth }}
                    transition={{ duration: 2 + Math.random(), ease: 'easeOut' }}
                />
            ))}
        </div>
    );
}