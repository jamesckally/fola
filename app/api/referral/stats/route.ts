import { NextRequest, NextResponse } from 'next/server';
import { ReferralService } from '@/lib/services/referral';
import dbConnect from '@/lib/db';

/**
 * GET /api/referral/stats?userId=xxx
 * Get referral statistics for a user
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

        const stats = await ReferralService.getReferralStats(userId);

        return NextResponse.json({
            success: true,
            ...stats,
        });
    } catch (error: any) {
        console.error('Get referral stats error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get referral stats' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/referral/apply
 * Apply a referral code during registration
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const { userId, referralCode } = await req.json();

        if (!userId || !referralCode) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        await ReferralService.applyReferralCode(userId, referralCode);

        return NextResponse.json({
            success: true,
            message: 'Referral code applied successfully',
        });
    } catch (error: any) {
        console.error('Apply referral code error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to apply referral code' },
            { status: 400 }
        );
    }
}
