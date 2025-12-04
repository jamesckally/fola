'use client';
import CardCenter from '../../../components/layout/CardCenter';
import { motion } from 'framer-motion';

export default function Rewards() {
    return (
        <CardCenter>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-2xl font-bold text-center mb-6">Reward Points</h1>
                <div className="text-center mb-6">
                    <p className="text-4xl font-bold">125 RP</p>
                    <p className="text-secondary">$10.00</p>
                </div>
                <button className="btn-primary w-full mb-4">Claim Daily</button>
                <button className="btn-secondary w-full">Send RP</button>
                <h2 className="text-xl font-bold mb-4 mt-6">RP History</h2>
                <div className="glass p-3 rounded-xl mb-2">+5 RP – Sent CC – Nov 27</div>
            </motion.div>
        </CardCenter>
    );
}