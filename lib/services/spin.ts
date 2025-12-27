import Spin from '../models/Spin';
import { WalletService } from './wallet';
import mongoose from 'mongoose';

const SPIN_COST = 0.50; // $0.50 USDT per spin

// Prize configuration (probabilities and amounts)
const PRIZE_TABLE = [
    { result: 'LOSE', prize: 0, weight: 50 },           // 50% chance
    { result: 'SMALL_WIN', prize: 0.25, weight: 30 },   // 30% chance
    { result: 'MEDIUM_WIN', prize: 1.00, weight: 15 },  // 15% chance
    { result: 'BIG_WIN', prize: 5.00, weight: 4 },      // 4% chance
    { result: 'JACKPOT', prize: 25.00, weight: 1 },     // 1% chance
];

/**
 * Spin-to-Earn Game Service
 */
export class SpinService {
    /**
     * Execute a spin
     */
    static async executeSpin(userId: string): Promise<{
        success: boolean;
        result?: string;
        prize?: number;
        error?: string;
    }> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Deduct spin cost
            try {
                await WalletService.deductBalance(
                    userId,
                    SPIN_COST,
                    'SPIN',
                    {},
                    session
                );
            } catch (balanceError: any) {
                await session.abortTransaction();
                return { success: false, error: balanceError.message };
            }

            // Determine prize
            const outcome = this.calculatePrize();

            // Create spin record
            await Spin.create([{
                userId,
                cost: SPIN_COST,
                prize: outcome.prize,
                result: outcome.result,
            }], { session });

            // Credit prize if won
            if (outcome.prize > 0) {
                await WalletService.creditBalance(
                    userId,
                    outcome.prize,
                    'SPIN_WIN',
                    { result: outcome.result },
                    session
                );
            }

            await session.commitTransaction();

            return {
                success: true,
                result: outcome.result,
                prize: outcome.prize,
            };
        } catch (error: any) {
            await session.abortTransaction();
            return { success: false, error: error.message || 'Spin failed' };
        } finally {
            session.endSession();
        }
    }

    /**
     * Calculate random prize based on weighted probabilities
     */
    private static calculatePrize(): { result: string; prize: number } {
        // Calculate total weight
        const totalWeight = PRIZE_TABLE.reduce((sum, item) => sum + item.weight, 0);

        // Generate random number
        const random = Math.random() * totalWeight;

        // Select prize based on weight
        let cumulativeWeight = 0;
        for (const item of PRIZE_TABLE) {
            cumulativeWeight += item.weight;
            if (random < cumulativeWeight) {
                return { result: item.result, prize: item.prize };
            }
        }

        // Fallback (should never reach here)
        return PRIZE_TABLE[0];
    }

    /**
     * Get user's spin history
     */
    static async getSpinHistory(
        userId: string,
        limit: number = 20
    ): Promise<any[]> {
        return await Spin.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit);
    }

    /**
     * Get user's spin statistics
     */
    static async getSpinStats(userId: string): Promise<{
        totalSpins: number;
        totalSpent: number;
        totalWon: number;
        netProfit: number;
        winRate: number;
    }> {
        const spins = await Spin.find({ userId });

        const totalSpins = spins.length;
        const totalSpent = totalSpins * SPIN_COST;
        const totalWon = spins.reduce((sum, spin) => sum + spin.prize, 0);
        const wins = spins.filter(spin => spin.prize > 0).length;

        return {
            totalSpins,
            totalSpent,
            totalWon,
            netProfit: totalWon - totalSpent,
            winRate: totalSpins > 0 ? (wins / totalSpins) * 100 : 0,
        };
    }

    /**
     * Update spin cost (admin function)
     */
    static updateSpinCost(newCost: number): void {
        // In production, this would update a config in the database
        console.log(`Spin cost updated to: $${newCost}`);
    }
}
