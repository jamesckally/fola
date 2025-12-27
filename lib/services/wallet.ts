import Wallet from '../models/Wallet';
import USDTTransaction from '../models/USDTTransaction';
import { bscTreasury } from './usdt-treasury';
import mongoose from 'mongoose';

/**
 * Internal Wallet Service for USDT Balance Management
 */
export class WalletService {
    /**
     * Credit USDT deposit to user's internal wallet
     */
    static async creditDeposit(
        userId: string,
        amount: number,
        txHash: string,
        fromAddress: string
    ): Promise<void> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Check if transaction already processed
            const existingTx = await USDTTransaction.findOne({ txHash }).session(session);
            if (existingTx) {
                await session.abortTransaction();
                throw new Error('Transaction already processed');
            }

            // Get current balance
            const wallet = await Wallet.findOne({ userId }).session(session);
            if (!wallet) {
                await session.abortTransaction();
                throw new Error('Wallet not found');
            }

            const balanceBefore = wallet.usdtBalance || 0;
            const balanceAfter = balanceBefore + amount;

            // Update wallet balance
            await Wallet.updateOne(
                { userId },
                { $inc: { usdtBalance: amount } }
            ).session(session);

            // Log transaction
            await USDTTransaction.create([{
                userId,
                type: 'DEPOSIT',
                amount,
                balanceBefore,
                balanceAfter,
                txHash,
                fromAddress,
                status: 'COMPLETED',
            }], { session });

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Request withdrawal of USDT to external wallet
     */
    static async requestWithdrawal(
        userId: string,
        amount: number,
        toAddress: string
    ): Promise<string> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Get current balance
            const wallet = await Wallet.findOne({ userId }).session(session);
            if (!wallet) {
                await session.abortTransaction();
                throw new Error('Wallet not found');
            }

            const balanceBefore = wallet.usdtBalance || 0;

            // Check sufficient balance
            if (balanceBefore < amount) {
                await session.abortTransaction();
                throw new Error('Insufficient balance');
            }

            const balanceAfter = balanceBefore - amount;

            // Deduct balance atomically
            const updateResult = await Wallet.updateOne(
                { userId, usdtBalance: { $gte: amount } },
                { $inc: { usdtBalance: -amount } }
            ).session(session);

            if (updateResult.modifiedCount === 0) {
                await session.abortTransaction();
                throw new Error('Failed to deduct balance (concurrent modification)');
            }

            // Create pending transaction record
            const [txRecord] = await USDTTransaction.create([{
                userId,
                type: 'WITHDRAWAL',
                amount,
                balanceBefore,
                balanceAfter,
                toAddress,
                status: 'PENDING',
            }], { session });

            await session.commitTransaction();

            // Execute on-chain transfer (outside transaction)
            try {
                const txHash = await bscTreasury.sendUSDT(toAddress, amount);

                // Update transaction with hash
                await USDTTransaction.updateOne(
                    { _id: txRecord._id },
                    { txHash, status: 'COMPLETED' }
                );

                return txHash;
            } catch (onChainError: any) {
                // Rollback balance if on-chain fails
                await Wallet.updateOne(
                    { userId },
                    { $inc: { usdtBalance: amount } }
                );

                await USDTTransaction.updateOne(
                    { _id: txRecord._id },
                    { status: 'FAILED', metadata: { error: onChainError.message } }
                );

                throw new Error(`On-chain transfer failed: ${onChainError.message}`);
            }
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Deduct USDT from user balance (internal operation)
     */
    static async deductBalance(
        userId: string,
        amount: number,
        type: 'TAG_PURCHASE' | 'SPIN',
        metadata?: any,
        session?: mongoose.ClientSession
    ): Promise<void> {
        const useSession = session || await mongoose.startSession();
        const shouldCommit = !session;

        if (shouldCommit) {
            useSession.startTransaction();
        }

        try {
            // Get current balance
            const wallet = await Wallet.findOne({ userId }).session(useSession);
            if (!wallet) {
                throw new Error('Wallet not found');
            }

            const balanceBefore = wallet.usdtBalance || 0;

            if (balanceBefore < amount) {
                throw new Error('Insufficient balance');
            }

            const balanceAfter = balanceBefore - amount;

            // Deduct balance
            const updateResult = await Wallet.updateOne(
                { userId, usdtBalance: { $gte: amount } },
                { $inc: { usdtBalance: -amount } }
            ).session(useSession);

            if (updateResult.modifiedCount === 0) {
                throw new Error('Failed to deduct balance');
            }

            // Log transaction
            await USDTTransaction.create([{
                userId,
                type,
                amount,
                balanceBefore,
                balanceAfter,
                status: 'COMPLETED',
                metadata,
            }], { session: useSession });

            if (shouldCommit) {
                await useSession.commitTransaction();
            }
        } catch (error) {
            if (shouldCommit) {
                await useSession.abortTransaction();
            }
            throw error;
        } finally {
            if (shouldCommit) {
                useSession.endSession();
            }
        }
    }

    /**
     * Credit USDT to user balance (internal operation)
     */
    static async creditBalance(
        userId: string,
        amount: number,
        type: 'REFERRAL_BONUS' | 'SPIN_WIN',
        metadata?: any,
        session?: mongoose.ClientSession
    ): Promise<void> {
        const useSession = session || await mongoose.startSession();
        const shouldCommit = !session;

        if (shouldCommit) {
            useSession.startTransaction();
        }

        try {
            // Get current balance
            const wallet = await Wallet.findOne({ userId }).session(useSession);
            if (!wallet) {
                throw new Error('Wallet not found');
            }

            const balanceBefore = wallet.usdtBalance || 0;
            const balanceAfter = balanceBefore + amount;

            // Credit balance
            await Wallet.updateOne(
                { userId },
                { $inc: { usdtBalance: amount } }
            ).session(useSession);

            // Log transaction
            await USDTTransaction.create([{
                userId,
                type,
                amount,
                balanceBefore,
                balanceAfter,
                status: 'COMPLETED',
                metadata,
            }], { session: useSession });

            if (shouldCommit) {
                await useSession.commitTransaction();
            }
        } catch (error) {
            if (shouldCommit) {
                await useSession.abortTransaction();
            }
            throw error;
        } finally {
            if (shouldCommit) {
                useSession.endSession();
            }
        }
    }

    /**
     * Get user's USDT balance
     */
    static async getBalance(userId: string): Promise<number> {
        const wallet = await Wallet.findOne({ userId });
        return wallet?.usdtBalance || 0;
    }
}
