import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

/**
 * GET /api/user/deposit-address
 * Get user's deposit address (treasury for new users, HD wallet for legacy users)
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

        // New system: Use treasury address for all new users
        // Legacy: Existing users with HD wallet addresses keep using them
        const treasuryAddress = process.env.TREASURY_ADDRESS;
        const depositAddress = user.depositAddress || treasuryAddress;
        const addressType = user.depositAddress ? 'hd_wallet' : 'treasury';

        console.log('🔍 Deposit address request:', {
            email: user.email,
            hasDepositAddress: !!user.depositAddress,
            treasuryAddress: treasuryAddress ? 'SET' : 'NOT SET',
            finalAddress: depositAddress ? depositAddress.substring(0, 10) + '...' : 'NONE',
            type: addressType
        });

        if (!depositAddress) {
            console.error('❌ No deposit address available!', {
                userDepositAddress: user.depositAddress,
                treasuryAddress: treasuryAddress
            });
            return NextResponse.json(
                { error: 'Deposit address not configured - please contact support' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            address: depositAddress,
            type: addressType,
            message: 'Works on both Polygon and BSC networks'
        });
    } catch (error: any) {
        console.error('Get deposit address error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get deposit address' },
            { status: 500 }
        );
    }
}
