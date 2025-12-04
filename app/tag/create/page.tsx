'use client';
import { useState } from 'react';
import CardCenter from '../../../components/layout/CardCenter';
import { sendCC } from '../../../lib/canton';
import { TREASURY_ADDRESS } from '../../../lib/config';
import { motion } from 'framer-motion';

export default function TagCreate() {
    const [name, setName] = useState('');

    const handleCreate = async () => {
        const hash = await sendCC(TREASURY_ADDRESS, '25');
        alert('Tag purchased! +150 RP');
    };

    return (
        <CardCenter>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-2xl font-bold text-center mb-6">Create Tag</h1>
                <input
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 bg-card rounded-xl mb-4"
                />
                <p className="text-secondary mb-4">Tag will be Swapa_{name}</p>
                <div className="glass p-4 rounded-xl mb-4 text-center">
                    <p className="text-4xl font-bold text-primary">25 CC</p>
                </div>
                <button onClick={handleCreate} className="btn-primary w-full">Pay & Claim</button>
            </motion.div>
        </CardCenter>
    );
}