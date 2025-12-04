'use client';
import CardCenter from '../../components/layout/CardCenter';
import { motion } from 'framer-motion';

export default function Vault() {
    return (
        <CardCenter>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-2xl font-bold text-center mb-6">Swapa Vault</h1>
                <div className="glass p-6 rounded-xl mb-6 text-center">
                    <p className="text-4xl font-bold text-primary">5% APY</p>
                    <p className="text-secondary">Stake CC + RP boosts</p>
                </div>
                <button className="btn-primary w-full mb-4">Stake</button>
                <button className="btn-secondary w-full">Unstake</button>
                <p className="text-secondary text-sm text-center mt-4">Coin drop animation here</p>
            </motion.div>
        </CardCenter>
    );
}