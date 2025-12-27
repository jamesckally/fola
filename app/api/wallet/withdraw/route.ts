import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';
import User from '@/lib/models/User';
import USDTTransaction from '@/lib/models/USDTTransaction';
import WithdrawalTransaction from '@/lib/models/WithdrawalTransaction';
import { estimateGasFee, validateWithdrawalAmount } from '@/lib/services/gasFees';
import { processWithdrawal, isValidAddress, type NetworkType } from '@/lib/services/blockchain';

const MIN_WITHDRAWAL = 5;
const RATE_LIMIT_MINUTES = 10;
const DAILY_LIMIT = 3;

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        // @ts-ignore
        const userId = session.user.id;
        const { amount, network, toAddress } = await req.json();

        // Validate inputs
        if (!amount || !network || !toAddress) {
            return NextResponse.json(
                { error: 'Amount, network, and address are required' },
                { status: 400 }
            );
        }

        if (!['polygon', 'bsc'].includes(network)) {
            return NextResponse.json(
                { error: 'Invalid network. Must be polygon or bsc' },
                { status: 400 }
            );
        }

        // Validate withdrawal address
        if (!isValidAddress(toAddress)) {
            return NextResponse.json(
                { error: 'Invalid withdrawal address' },
                { status: 400 }
            );
        }

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check for active spin (prevent concurrent operations)
        // This would require a lock mechanism in production

        // Check rate limiting - 1 per 10 minutes
        const tenMinutesAgo = new Date(Date.now() - RATE_LIMIT_MINUTES * 60 * 1000);
        const recentWithdrawals = await WithdrawalTransaction.countDocuments({
            userId: user._id,
            createdAt: { $gte: tenMinutesAgo }
        });

        if (recentWithdrawals > 0) {
            return NextResponse.json(
                { error: `Please wait ${RATE_LIMIT_MINUTES} minutes between withdrawals` },
                { status: 429 }
            );
        }

        // Check daily limit - max 3 per day
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const dailyWithdrawals = await WithdrawalTransaction.countDocuments({
            userId: user._id,
            createdAt: { $gte: oneDayAgo },
            status: { $in: ['completed', 'pending'] }
        });

        if (dailyWithdrawals >= DAILY_LIMIT) {
            return NextResponse.json(
                { error: `Daily withdrawal limit (${DAILY_LIMIT}) reached. Try again tomorrow.` },
                { status: 429 }
            );
        }

        // Check USDT balance
        const usdtBalance = await USDTTransaction.aggregate([
            { $match: { userId: user._id } },
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
        ]);

        const currentBalance = usdtBalance[0]?.balance || 0;

        if (currentBalance < amount) {
            return NextResponse.json(
                { error: 'Insufficient balance' },
                { status: 400 }
            );
        }

        // Estimate gas fee
        const gasFee = await estimateGasFee(network, amount);

        // Validate withdrawal amount after gas
        const validation = validateWithdrawalAmount(amount, gasFee, MIN_WITHDRAWAL);

        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }

        // Get client info for security
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';

        // Start transaction
        const session_db = await mongoose.startSession();
        session_db.startTransaction();

        try {
            // Deduct USDT from user balance
            await USDTTransaction.create([{
                userId: user._id,
                type: 'debit',
                amount: amount,
                description: `Withdrawal to ${network} (${toAddress.substring(0, 10)}...)`,
                status: 'completed'
            }], { session: session_db });

            // Create withdrawal transaction record
            const withdrawal = await WithdrawalTransaction.create([{
                userId: user._id,
                amount,
                gasFee,
                netAmount: validation.netAmount,
                network,
                toAddress,
                status: 'pending',
                ipAddress,
                userAgent,
            }], { session: session_db });

            // Process actual blockchain withdrawal
            console.log(`💸 Processing withdrawal: ${validation.netAmount} USDT to ${toAddress} on ${network}`);

            let blockchainResult;
            try {
                blockchainResult = await processWithdrawal(
                    network as NetworkType,
                    toAddress,
                    validation.netAmount
                );

                // Update withdrawal record with blockchain transaction details
                withdrawal[0].status = blockchainResult.status === 'success' ? 'completed' : 'failed';
                withdrawal[0].transactionHash = blockchainResult.transactionHash;
                withdrawal[0].metadata = {
                    blockNumber: blockchainResult.blockNumber,
                    gasUsed: blockchainResult.gasUsed
                };
                await withdrawal[0].save({ session: session_db });

                console.log(`✅ Withdrawal completed: ${blockchainResult.transactionHash}`);
            } catch (blockchainError: any) {
                console.error('Blockchain withdrawal failed:', blockchainError.message);

                // Mark withdrawal as failed
                withdrawal[0].status = 'failed';
                withdrawal[0].metadata = {
                    error: blockchainError.message
                };
                await withdrawal[0].save({ session: session_db });

                // Rollback the transaction
                await session_db.abortTransaction();
                session_db.endSession();

                return NextResponse.json(
                    { error: `Blockchain transaction failed: ${blockchainError.message}` },
                    { status: 500 }
                );
            }

            await session_db.commitTransaction();

            return NextResponse.json({
                success: true,
                withdrawal: {
                    id: withdrawal[0]._id,
                    amount,
                    gasFee,
                    netAmount: validation.netAmount,
                    network,
                    status: withdrawal[0].status,
                    transactionHash: withdrawal[0].transactionHash,
                },
                newBalance: currentBalance - amount,
                message: `Withdrawal of $${validation.netAmount} initiated successfully!`
            });
        } catch (error) {
            await session_db.abortTransaction();
            throw error;
        } finally {
            session_db.endSession();
        }
    } catch (error: any) {
        console.error('Withdrawal error:', error);
        return NextResponse.json(
            { error: error.message || 'Withdrawal failed' },
            { status: 500 }
        );
    }
}
