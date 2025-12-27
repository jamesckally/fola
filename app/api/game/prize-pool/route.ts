import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PrizePool from '@/lib/models/PrizePool';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        // Get or create prize pool instance
        const pool = await PrizePool.getInstance();

        // Calculate current jackpot
        const currentJackpot = pool.calculateJackpot();

        return NextResponse.json({
            balance: pool.balance,
            jackpot: currentJackpot,
            jackpotCap: pool.jackpotCap,
            totalDeposited: pool.totalDeposited,
            totalPaidOut: pool.totalPaidOut,
            lastUpdated: pool.lastUpdated,
        });
    } catch (error: any) {
        console.error('Error fetching prize pool:', error);
        return NextResponse.json(
            { error: 'Failed to fetch prize pool data' },
            { status: 500 }
        );
    }
}
