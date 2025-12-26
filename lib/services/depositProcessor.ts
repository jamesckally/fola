import mongoose from 'mongoose';
import User from '@/lib/models/User';
import Deposit from '@/lib/models/Deposit';
import USDTTransaction from '@/lib/models/USDTTransaction';
import type { DepositEvent } from './depositScanner';
import type { NetworkType } from './blockchain';

/**
 * Process a detected deposit and credit user's balance
 */
export async function processDeposit(
    deposit: DepositEvent,
    network: NetworkType
): Promise<boolean> {
    try {
        // Find user by deposit address
        const user = await User.findOne({
            depositAddress: deposit.to.toLowerCase()
        });

        if (!user) {
            console.error(`❌ User not found for deposit address: ${deposit.to}`);
            return false;
        }

        // Check if already processed
        const existing = await Deposit.findOne({
            txHash: deposit.txHash.toLowerCase()
        });

        if (existing) {
            console.log(`⏭️  Deposit already processed: ${deposit.txHash}`);
            return false;
        }

        console.log(`💳 Processing deposit for user ${user.email}: ${deposit.amount} USDT`);

        // Get current USDT balance
        const balanceResult = await USDTTransaction.aggregate([
            { $match: { userId: user._id } },
            {
                $group: {
                    _id: null,
                    balance: {
                        $sum: {
                            $cond: [
                                { $eq: ['$type', 'credit'] },
                                '$amount',
                                { $multiply: ['$amount', -1] }
                            ]
                        }
                    }
                }
            }
        ]);

        const balanceBefore = balanceResult[0]?.balance || 0;
        const balanceAfter = balanceBefore + deposit.amount;

        // Start database transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Create deposit record
            await Deposit.create([{
                userId: user._id,
                txHash: deposit.txHash.toLowerCase(),
                network,
                fromAddress: deposit.from,
                amount: deposit.amount,
                blockNumber: deposit.blockNumber,
                status: 'verified',
                verifiedAt: new Date()
            }], { session });

            // Credit USDT to user
            await USDTTransaction.create([{
                userId: user._id,
                type: 'credit',
                amount: deposit.amount,
                balanceBefore,
                balanceAfter,
                txHash: deposit.txHash.toLowerCase(),
                fromAddress: deposit.from,
                status: 'COMPLETED',
                metadata: {
                    network,
                    blockNumber: deposit.blockNumber,
                    autoDetected: true,
                    depositAddress: deposit.to
                }
            }], { session });

            await session.commitTransaction();

            console.log(`✅ Auto-credited ${deposit.amount} USDT to ${user.email} (Balance: ${balanceAfter})`);

            // TODO: Send notification to user
            // await sendDepositNotification(user, deposit.amount, network);

            return true;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    } catch (error: any) {
        console.error(`Error processing deposit ${deposit.txHash}:`, error.message);
        return false;
    }
}

/**
 * Process multiple deposits in batch
 */
export async function processDeposits(
    deposits: DepositEvent[],
    network: NetworkType
): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    for (const deposit of deposits) {
        const success = await processDeposit(deposit, network);
        if (success) {
            processed++;
        } else {
            failed++;
        }
    }

    return { processed, failed };
}
