import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

/**
 * Generate a unique referral code
 */
function generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * POST /api/user/generate-referral-code
 * Generate a referral code for the current user if they don't have one
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

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // If user already has a referral code, return it
        if (user.referralCode) {
            return NextResponse.json({
                success: true,
                referralCode: user.referralCode,
                message: 'Referral code already exists'
            });
        }

        // Generate unique referral code
        let referralCode = generateReferralCode();
        let attempts = 0;
        const maxAttempts = 10;

        // Ensure uniqueness
        while (attempts < maxAttempts) {
            const existing = await User.findOne({ referralCode });
            if (!existing) break;
            referralCode = generateReferralCode();
            attempts++;
        }

        if (attempts >= maxAttempts) {
            return NextResponse.json(
                { error: 'Failed to generate unique referral code' },
                { status: 500 }
            );
        }

        // Update user with referral code
        user.referralCode = referralCode;
        await user.save();

        return NextResponse.json({
            success: true,
            referralCode,
            message: 'Referral code generated successfully'
        });
    } catch (error: any) {
        console.error('Error generating referral code:', error);
        return NextResponse.json(
            { error: 'Failed to generate referral code', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * GET /api/user/generate-referral-code
 * Get current user's referral code (generate if doesn't exist)
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // If no referral code, generate one
        if (!user.referralCode) {
            let referralCode = generateReferralCode();
            let attempts = 0;
            const maxAttempts = 10;

            while (attempts < maxAttempts) {
                const existing = await User.findOne({ referralCode });
                if (!existing) break;
                referralCode = generateReferralCode();
                attempts++;
            }

            if (attempts >= maxAttempts) {
                return NextResponse.json(
                    { error: 'Failed to generate unique referral code' },
                    { status: 500 }
                );
            }

            user.referralCode = referralCode;
            await user.save();
        }

        return NextResponse.json({
            success: true,
            referralCode: user.referralCode
        });
    } catch (error: any) {
        console.error('Error fetching referral code:', error);
        return NextResponse.json(
            { error: 'Failed to fetch referral code', details: error.message },
            { status: 500 }
        );
    }
}
