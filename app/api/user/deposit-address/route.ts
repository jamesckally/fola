import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { generateDepositAddress } from '@/lib/services/hdWallet';

/**
 * GET /api/user/deposit-address
 * Get or generate user's deposit address
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

        // If user doesn't have deposit address, generate one
        if (!user.depositAddress) {
            try {
                const depositInfo = generateDepositAddress(user._id.toString());
                user.depositAddress = depositInfo.address;
                user.depositAddressIndex = depositInfo.index;
                await user.save();
                console.log(`🔑 Generated deposit address for ${user.email}: ${depositInfo.address}`);
            } catch (error: any) {
                console.error('Failed to generate deposit address:', error);
                return NextResponse.json(
                    { error: 'Failed to generate deposit address' },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            address: user.depositAddress,
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
