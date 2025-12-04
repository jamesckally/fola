'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CardCenter from '../../../components/layout/CardCenter';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function TagCreate() {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleCreate = async () => {
        if (!name) {
            toast.error('Please enter a tag name');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/tags/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tagName: name }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create tag');
            }

            toast.success('Tag purchased successfully! +150 RP');
            router.push('/dashboard'); // Or wherever appropriate
        } catch (error: any) {
            toast.error(error.message || 'Failed to create tag');
        } finally {
            setLoading(false);
        }
    };

    return (
        <CardCenter>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-2xl font-bold text-center mb-6">Create Tag</h1>
                <input
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 bg-card rounded-xl mb-4 border border-border"
                    disabled={loading}
                />
                <p className="text-secondary mb-4 text-sm text-center">Tag will be @{name}</p>
                <div className="glass p-4 rounded-xl mb-4 text-center">
                    <p className="text-4xl font-bold text-primary">30 CC</p>
                    <p className="text-xs text-muted-foreground mt-1">Cost to purchase</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        'Pay & Claim'
                    )}
                </button>
            </motion.div>
        </CardCenter>
    );
}