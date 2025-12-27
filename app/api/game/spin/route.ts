import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Ticket from '@/lib/models/Ticket';
import PrizePool from '@/lib/models/PrizePool';
import SpinTransaction from '@/lib/models/SpinTransaction';
import USDTTransaction from '@/lib/models/USDTTransaction';
import User from '@/lib/models/User';
import {
    selectWeightedPrize,
    calculateJackpotChance,
    calculateJackpotAmount,
    autoDowngradePrize,
    getPrizeResult,
    getPrizeMessage,
    PAID_PRIZE_WEIGHTS,
    FREE_PRIZE_WEIGHTS,
} from '@/lib/services/spinLogic';

/**
 * POST /api/game/spin
 * Execute a ticket-based spin
 */
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

        // Get user's ticket balance
        const userTickets = await Ticket.findOne({ userId });

        if (!userTickets || userTickets.getTotalTickets() === 0) {
            return NextResponse.json(
                { error: 'No tickets available. Purchase tickets or claim your free daily ticket!' },
                { status: 400 }
            );
        }

        // Determine which ticket type to use (prioritize paid tickets)
        const ticketType = userTickets.paidTickets > 0 ? 'paid' : 'free';

        // Start database transaction
        const session_db = await dbConnect().then(conn => conn.startSession());
        session_db.startTransaction();

        try {
            // Deduct ticket
            if (ticketType === 'paid') {
                userTickets.paidTickets -= 1;
            } else {
                userTickets.freeTickets -= 1;
            }
            await userTickets.save({ session: session_db });

            // Get prize pool
            const pool = await PrizePool.getInstance();
            const poolBalanceBefore = pool.balance;

            // Step 1: Determine base prize from weighted table
            const weights = ticketType === 'paid' ? PAID_PRIZE_WEIGHTS : FREE_PRIZE_WEIGHTS;
            let basePrize = selectWeightedPrize(weights);

            // Check for Free Spin (represented as -1)
            let isFreeSpin = basePrize === -1;
            let finalPrize = isFreeSpin ? 0 : basePrize; // Free spin = no cash

            // Step 2: Check for jackpot (paid tickets only, not if free spin)
            let isJackpot = false;

            if (ticketType === 'paid' && !isFreeSpin) {
                const jackpotChance = calculateJackpotChance(poolBalanceBefore);
                const jackpotTriggered = Math.random() < jackpotChance;

                if (jackpotTriggered) {
                    const jackpotAmount = calculateJackpotAmount(poolBalanceBefore);
                    // Double check threshold (though chance would be 0 if < 500)
                    if (poolBalanceBefore >= 500 && jackpotAmount > 0) {
                        finalPrize = jackpotAmount;
                        isJackpot = true;
                        isFreeSpin = false; // Override free spin if jackpot
                    }
                }
            }

            // Step 3: Validate prize against pool balance
            let wasDowngraded = false;
            let originalPrize = finalPrize;

            console.log('=== PRIZE POOL DEBUG ===');
            console.log('Pool Balance:', poolBalanceBefore);
            console.log('Prize Won:', finalPrize);
            console.log('Is Free Spin:', isFreeSpin);

            // MINIMUM POOL THRESHOLD: $1
            // If pool < $1, always return "Try Again" to prevent depletion
            if (poolBalanceBefore < 1 && !isFreeSpin) {
                console.log('⚠️ Pool below $1 threshold! Forcing Try Again.');
                finalPrize = 0;
                wasDowngraded = true;
            } else if (poolBalanceBefore < finalPrize) {
                console.log('⚠️ Pool too low! Downgrading from', finalPrize, 'to affordable tier');
                finalPrize = autoDowngradePrize(finalPrize, poolBalanceBefore);
                wasDowngraded = true;
                console.log('Downgraded to:', finalPrize);
            }

            // Step 4: Final safety check
            if (poolBalanceBefore < finalPrize) {
                finalPrize = 0;
            }

            // Step 5: Update pool balance (only for cash prizes)
            if (finalPrize > 0 && !isFreeSpin) {
                pool.balance -= finalPrize;
                pool.totalPaidOut += finalPrize;
                pool.lastUpdated = new Date();
                await pool.save({ session: session_db });
            }

            // Step 6: Handle Free Spin - grant bonus ticket
            if (isFreeSpin) {
                userTickets.freeTickets += 1;
                await userTickets.save({ session: session_db });
            }

            // Step 6: Credit user's wallet
            if (finalPrize > 0) {
                const user = await User.findById(userId);

                // Get current balance
                const balanceResult = await USDTTransaction.aggregate([
                    { $match: { userId: user._id } },
                    {
                        $group: {
                            _id: null,
                            balance: {
                                $sum: {
                                    $cond: [
                                        { $in: ['$type', ['DEPOSIT', 'SPIN_WIN', 'REFERRAL_BONUS']] },
                                        '$amount',
                                        { $multiply: ['$amount', -1] }
                                    ]
                                }
                            }
                        }
                    }
                ]);

                const balanceBefore = balanceResult[0]?.balance || 0;
                const balanceAfter = balanceBefore + finalPrize;

                await USDTTransaction.create([{
                    userId: user._id,
                    type: 'SPIN_WIN',
                    amount: finalPrize,
                    balanceBefore: balanceBefore,
                    balanceAfter: balanceAfter,
                    status: 'COMPLETED',
                    metadata: {
                        isJackpot,
                        prizeType: isJackpot ? 'jackpot' : 'normal',
                        ticketType
                    }
                }], { session: session_db });
            }

            // Step 7: Log transaction
            const result = getPrizeResult(finalPrize, isJackpot, isFreeSpin);
            await SpinTransaction.create([{
                userId,
                ticketType,
                prizeAmount: finalPrize,
                prizeType: isJackpot ? 'jackpot' : 'normal',
                poolBalanceBefore,
                poolBalanceAfter: pool.balance,
                wasDowngraded,
                originalPrize: wasDowngraded ? originalPrize : null,
                result,
            }], { session: session_db });

            await session_db.commitTransaction();

            // Get updated balances
            const usdtBalance = await USDTTransaction.aggregate([
                { $match: { userId: (await User.findById(userId))._id } },
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

            return NextResponse.json({
                success: true,
                result,
                prize: finalPrize,
                isJackpot,
                isFreeSpin,
                wasDowngraded,
                message: getPrizeMessage(finalPrize, isJackpot, isFreeSpin, wasDowngraded),
                ticketsRemaining: {
                    free: userTickets.freeTickets,
                    paid: userTickets.paidTickets,
                    total: userTickets.getTotalTickets()
                },
                newUSDTBalance: usdtBalance[0]?.balance || 0,
                poolBalance: pool.balance,
            });
        } catch (error) {
            await session_db.abortTransaction();
            throw error;
        } finally {
            session_db.endSession();
        }
    } catch (error: any) {
        console.error('Spin error:', error);
        return NextResponse.json(
            { error: error.message || 'Spin failed' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/game/spin?userId=xxx
 * Get spin history and stats
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        // Get spin history
        const history = await SpinTransaction.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        // Calculate stats
        const stats = await SpinTransaction.aggregate([
            { $match: { userId: userId } },
            {
                $group: {
                    _id: null,
                    totalSpins: { $sum: 1 },
                    totalWon: { $sum: '$prizeAmount' },
                    wins: {
                        $sum: {
                            $cond: [{ $gt: ['$prizeAmount', 0] }, 1, 0]
                        }
                    },
                    jackpots: {
                        $sum: {
                            $cond: [{ $eq: ['$prizeType', 'jackpot'] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        const statsData = stats[0] || { totalSpins: 0, totalWon: 0, wins: 0, jackpots: 0 };
        const winRate = statsData.totalSpins > 0
            ? (statsData.wins / statsData.totalSpins) * 100
            : 0;

        // Get ticket info
        const userTickets = await Ticket.findOne({ userId });
        const netProfit = statsData.totalWon - (userTickets?.totalSpent || 0);

        return NextResponse.json({
            success: true,
            history,
            stats: {
                totalSpins: statsData.totalSpins,
                totalWon: statsData.totalWon,
                winRate,
                jackpots: statsData.jackpots,
                netProfit,
            },
        });
    } catch (error: any) {
        console.error('Get spin data error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get spin data' },
            { status: 500 }
        );
    }
}
