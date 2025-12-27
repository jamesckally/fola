import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';
import User from '@/lib/models/User';
import Deposit from '@/lib/models/Deposit';
import USDTTransaction from '@/lib/models/USDTTransaction';
import { verifyDeposit, type NetworkType } from '@/lib/services/blockchain';

const MIN_DEPOSIT = 1; // Minimum $1 USDT

/**
 * POST /api/wallet/deposit/verify
 * Verify and credit a USDT deposit from Polygon or BSC
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const { txHash, network } = await req.json();

        // Validate inputs
        if (!txHash || !network) {
            return NextResponse.json(
                { error: 'Transaction hash and network are required' },
                { status: 400 }
            );
        }

        if (!['polygon', 'bsc'].includes(network)) {
            return NextResponse.json(
                { error: 'Invalid network. Must be polygon or bsc' },
                { status: 400 }
            );
        }

        // Get user
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if transaction already processed
        const existingDeposit = await Deposit.findOne({ txHash: txHash.toLowerCase() });
        if (existingDeposit) {
            return NextResponse.json(
                { error: 'This transaction has already been processed' },
                { status: 400 }
            );
        }

        // Get treasury address for new deposit system
        const treasuryAddress = process.env.TREASURY_ADDRESS;
        if (!treasuryAddress) {
            return NextResponse.json(
                { error: 'Treasury address not configured' },
                { status: 500 }
            );
        }

        // Support both treasury deposits (new) and HD wallet deposits (legacy)
        // New users deposit to treasury, existing users can still use HD wallets
        const expectedAddress = user.depositAddress || treasuryAddress;
        const depositType = user.depositAddress ? 'HD Wallet' : 'Treasury';

        console.log(`🔍 Verifying deposit for user ${user.email}:`, txHash);
        console.log(`📍 Expected ${depositType} address: ${expectedAddress}`);

        // Verify transaction on blockchain
        let verificationResult;
        try {
            verificationResult = await verifyDeposit(
                txHash,
                network as NetworkType,
                expectedAddress,
                MIN_DEPOSIT
            );
        } catch (error: any) {
            console.error('Blockchain verification failed:', error.message);
            return NextResponse.json(
                { error: error.message || 'Failed to verify transaction on blockchain' },
                { status: 400 }
            );
        }

        console.log(`✅ Deposit verified: ${verificationResult.amount} USDT from ${verificationResult.from}`);

        // Start database transaction
        const session_db = await mongoose.startSession();
        session_db.startTransaction();

        try {
            // Create deposit record
            await Deposit.create([{
                userId: user._id,
                txHash: txHash.toLowerCase(),
                network,
                fromAddress: verificationResult.from,
                amount: verificationResult.amount,
                status: 'verified',
                blockNumber: verificationResult.blockNumber,
                verifiedAt: new Date()
            }], { session: session_db });

            // Get current USDT balance
            const balanceResult = await USDTTransaction.aggregate([
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

            const balanceBefore = balanceResult[0]?.balance || 0;
            const balanceAfter = balanceBefore + verificationResult.amount;

            // Credit USDT to user
            await USDTTransaction.create([{
                userId: user._id,
                type: 'DEPOSIT',
                amount: verificationResult.amount,
                balanceBefore,
                balanceAfter,
                txHash: txHash.toLowerCase(),
                fromAddress: verificationResult.from,
                status: 'COMPLETED',
                metadata: {
                    network,
                    blockNumber: verificationResult.blockNumber,
                    timestamp: verificationResult.timestamp
                }
            }], { session: session_db });

            await session_db.commitTransaction();

            console.log(`💰 Credited ${verificationResult.amount} USDT to user ${user.email}`);

            return NextResponse.json({
                success: true,
                deposit: {
                    amount: verificationResult.amount,
                    from: verificationResult.from,
                    network,
                    blockNumber: verificationResult.blockNumber
                },
                newBalance: balanceAfter,
                message: `Successfully deposited ${verificationResult.amount} USDT`
            });
        } catch (error) {
            await session_db.abortTransaction();
            throw error;
        } finally {
            session_db.endSession();
        }
    } catch (error: any) {
        console.error('Deposit verification error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process deposit' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/wallet/deposit/address?network=polygon|bsc
 * Get treasury deposit address for a network
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const network = searchParams.get('network');

        if (!network || !['polygon', 'bsc'].includes(network)) {
            return NextResponse.json(
                { error: 'Invalid network parameter' },
                { status: 400 }
            );
        }

        const treasuryAddress = process.env.TREASURY_ADDRESS;
        if (!treasuryAddress) {
            return NextResponse.json(
                { error: 'Treasury address not configured' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            address: treasuryAddress,
            network,
            minDeposit: MIN_DEPOSIT
        });
    } catch (error: any) {
        console.error('Get deposit address error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get deposit address' },
            { status: 500 }
        );
    }
}
