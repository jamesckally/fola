'use client';
import { useEffect, useState } from 'react';

export type PerfTier = 'low' | 'mid' | 'high' | 'ultra';

export function usePerfTier(): PerfTier {
    const [tier, setTier] = useState<PerfTier>('high');

    useEffect(() => {
        const ram = (navigator as any).deviceMemory || 8;
        const isMobile = /Mobi|Android/i.test(navigator.userAgent);
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (reducedMotion || (isMobile && ram <= 3)) setTier('low');
        else if (isMobile && ram <= 6) setTier('mid');
        else if (ram >= 12) setTier('ultra');
        else setTier('high');
    }, []);

    return tier;
}