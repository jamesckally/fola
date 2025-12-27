import SwapaTag from '../models/SwapaTag';
import USDTTransaction from '../models/USDTTransaction';
import User from '../models/User';
import { WalletService } from './wallet';
import { ReferralService } from './referral';
import { bscTreasury } from './usdt-treasury';
import mongoose from 'mongoose';

const TAG_PRICE = 2.50; // $2.50 USDT

/**
 * Swapa Tag Purchase Service
 */
export class SwapaService {
    /**
     * Purchase a Swapa Tag
     */
    static async purchaseTag(
        userId: string,
        tagName: string
    ): Promise<{ success: boolean; tag?: any; error?: string }> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Validate tag name
            if (!tagName || tagName.length < 3 || tagName.length > 20) {
                await session.abortTransaction();
                return { success: false, error: 'Tag name must be between 3 and 20 characters' };
            }

            // Check if tag name is already taken
            const existingTag = await SwapaTag.findOne({ name: tagName }).session(session);
            if (existingTag) {
                await session.abortTransaction();
                return { success: false, error: 'Tag name already taken' };
            }

            // Check USDT balance
            const balanceResult = await USDTTransaction.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId) } },
                {
                    $group: {
                        _id: null,
                        balance: {
                            $sum: {
                                $cond: [
                                    { $in: ['$type', ['DEPOSIT', 'REFERRAL_BONUS', 'SPIN_WIN']] },
                                    '$amount',
                                    { $multiply: ['$amount', -1] }
                                ]
                            }
                        }
                    }
                }
            ]).session(session);

            const currentBalance = balanceResult[0]?.balance || 0;

            if (currentBalance < TAG_PRICE) {
                await session.abortTransaction();
                return { success: false, error: `Insufficient USDT balance. Need $${TAG_PRICE}, have $${currentBalance.toFixed(2)}` };
            }

            // Deduct USDT
            await USDTTransaction.create([{
                userId: new mongoose.Types.ObjectId(userId),
                type: 'TAG_PURCHASE',
                amount: TAG_PRICE,
                balanceBefore: currentBalance,
                balanceAfter: currentBalance - TAG_PRICE,
                status: 'COMPLETED',
                metadata: {
                    type: 'TAG_PURCHASE',
                    tagName
                }
            }], { session });

            // Create tag
            const [tag] = await SwapaTag.create([{
                name: tagName,
                owner: userId,
                price: TAG_PRICE,
            }], { session });

            // Trigger referral bonus if applicable
            try {
                await ReferralService.triggerReferralBonus(userId);
            } catch (referralError) {
                // Log but don't fail the purchase
                console.error('Referral bonus error:', referralError);
            }

            await session.commitTransaction();

            // Get user's deposit address index for treasury sweep
            const user = await User.findById(userId);
            if (user?.depositAddressIndex !== undefined) {
                // Send to treasury (async, outside transaction)
                this.sendToTreasury(TAG_PRICE, userId, user.depositAddressIndex).catch(error => {
                    console.error('Treasury transfer error:', error);
                    // Log for manual reconciliation
                });
            } else {
                console.warn('User has no deposit address index, skipping treasury transfer');
            }

            return { success: true, tag };
        } catch (error: any) {
            await session.abortTransaction();
            return { success: false, error: error.message || 'Purchase failed' };
        } finally {
            session.endSession();
        }
    }

    /**
     * Send funds to treasury wallet
     * Sweeps USDT from user's HD wallet address to treasury
     */
    private static async sendToTreasury(amount: number, userId: string, depositAddressIndex: number): Promise<void> {
        try {
            const { sweepUSDTToTreasury } = await import('./hdWalletSweep');

            // Sweep USDT from user's HD wallet to treasury
            // Default to Polygon network (can be made configurable)
            const txHash = await sweepUSDTToTreasury(depositAddressIndex, amount, 'polygon');

            console.log(`✅ Treasury transfer successful: ${amount} USDT`);
            console.log(`TX Hash: ${txHash}`);
        } catch (error) {
            console.error('Treasury transfer failed:', error);
            // Don't throw - log for manual reconciliation
            // The purchase already succeeded, this is just treasury accounting
        }
    }

    /**
     * Get user's tags
     */
    static async getUserTags(userId: string): Promise<any[]> {
        return await SwapaTag.find({ owner: userId }).sort({ purchasedAt: -1 });
    }

    /**
     * Check if tag name is available
     */
    static async isTagAvailable(tagName: string): Promise<boolean> {
        const existing = await SwapaTag.findOne({ name: tagName });
        return !existing;
    }
}
