'use client';
import CardCenter from '../../../components/layout/CardCenter';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';

export default function CC() {
    const [balance] = useState('188.68572');
    const history = [
        { type: 'Sent', amount: '5 CC', date: 'Nov 27' },
        { type: 'Received', amount: '10 CC', date: 'Nov 26' },
    ];

    return (
        <CardCenter>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-2xl font-bold text-center mb-6">Canton Coin</h1>
                <div className="text-center mb-6">
                    <p className="text-4xl font-bold">{balance} CC</p>
                    <p className="text-secondary">$15.09</p>
                    <p className="text-primary animate-pulse">Live: $0.08</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <Link href="/send" className="btn-primary">Send</Link>
                    <Link href="/receive" className="btn-secondary">Receive</Link>
                </div>
                <h2 className="text-xl font-bold mb-4">History</h2>
                {history.map((tx, i) => (
                    <motion.div key={i} initial={{ x: -20 }} animate={{ x: 0 }} className="glass p-3 rounded-xl mb-2">
                        <p>{tx.type}: {tx.amount} – {tx.date}</p>
                    </motion.div>
                ))}
            </motion.div>
        </CardCenter>
    );
}