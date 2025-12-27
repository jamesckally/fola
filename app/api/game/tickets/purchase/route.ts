
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';
import Ticket from '@/lib/models/Ticket';
import PrizePool from '@/lib/models/PrizePool';
import User from '@/lib/models/User';
import USDTTransaction from '@/lib/models/USDTTransaction';

const TICKET_PRICE = 1; // $1 per ticket
const TICKETS_PER_DOLLAR = 3; // 3 tickets per $1

export async function POST(request: NextRequest) {
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
        const { amount } = await request.json();

        // Validate amount
        if (!amount || amount < TICKET_PRICE) {
            return NextResponse.json(
                { error: `Minimum purchase is $${TICKET_PRICE} ` },
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

        // Check USDT balance
        const usdtBalance = await USDTTransaction.aggregate([
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

        const currentBalance = usdtBalance[0]?.balance || 0;
        console.log('💰 Current USDT balance:', currentBalance);
        console.log('💳 Purchase amount:', amount);

        if (currentBalance < amount) {
            return NextResponse.json(
                { error: 'Insufficient USDT balance' },
                { status: 400 }
            );
        }

        // Calculate tickets to grant
        const ticketsToGrant = Math.floor(amount * TICKETS_PER_DOLLAR);

        // Get user's existing tickets
        let userTickets = await Ticket.findOne({ userId });

        // Start database transaction
        const session_db = await mongoose.startSession();
        session_db.startTransaction();

        try {
            // Deduct USDT from user (use TAG_PURCHASE type for ticket purchases)
            await USDTTransaction.create([{
                userId: user._id,
                type: 'TAG_PURCHASE',
                amount: amount,
                balanceBefore: currentBalance,
                balanceAfter: currentBalance - amount,
                status: 'COMPLETED',
                metadata: {
                    ticketsPurchased: ticketsToGrant
                }
            }], { session: session_db });

            // Add to prize pool (80% to pool, 20% to treasury)
            const pool = await PrizePool.getInstance();
            const poolContribution = amount * 0.80; // 80% to pool, 20% treasury
            pool.balance += poolContribution;
            pool.totalDeposited += poolContribution;
            pool.lastUpdated = new Date();
            await pool.save({ session: session_db });

            // Grant tickets to user
            if (!userTickets) {
                userTickets = await Ticket.create([{
                    userId,
                    freeTickets: 0,
                    paidTickets: ticketsToGrant,
                    totalTicketsPurchased: ticketsToGrant,
                    totalSpent: amount,
                    lastFreeTicketClaim: null
                }], { session: session_db });
                userTickets = userTickets[0];
            } else {
                userTickets.paidTickets += ticketsToGrant;
                userTickets.totalTicketsPurchased += ticketsToGrant;
                userTickets.totalSpent += amount;
                await userTickets.save({ session: session_db });
            }

            await session_db.commitTransaction();



            return NextResponse.json({
                success: true,
                ticketsPurchased: ticketsToGrant,
                amountSpent: amount,
                freeTickets: userTickets.freeTickets,
                paidTickets: userTickets.paidTickets,
                totalTickets: userTickets.getTotalTickets(),
                newUSDTBalance: currentBalance - amount,
                message: `🎟️ Purchased ${ticketsToGrant} tickets for $${amount}`
            });
        } catch (error) {
            await session_db.abortTransaction();
            throw error;
        } finally {
            session_db.endSession();
        }
    } catch (error: any) {
        console.error('Error purchasing tickets:', error);
        return NextResponse.json(
            { error: 'Failed to purchase tickets' },
            { status: 500 }
        );
    }
}
