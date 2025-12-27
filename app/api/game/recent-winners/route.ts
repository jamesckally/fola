import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SpinTransaction from '@/lib/models/SpinTransaction';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        // Get recent winners (prizes > 0, last 10)
        const recentWins = await SpinTransaction.find({
            prizeAmount: { $gt: 0 }
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('userId', 'email name')
            .lean();

        // Format winners with masked usernames
        const winners = recentWins.map((win: any) => {
            const email = win.userId?.email || 'Anonymous';
            const maskedEmail = email.substring(0, 3) + '***' + email.substring(email.indexOf('@'));

            return {
                username: maskedEmail,
                prize: win.prizeAmount,
                isJackpot: win.prizeType === 'jackpot',
                ticketType: win.ticketType,
                timestamp: win.createdAt,
            };
        });

        return NextResponse.json({
            success: true,
            winners,
        });
    } catch (error: any) {
        console.error('Error fetching recent winners:', error);
        return NextResponse.json(
            { error: 'Failed to fetch recent winners' },
            { status: 500 }
        );
    }
}
