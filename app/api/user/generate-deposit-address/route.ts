import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { generateDepositAddress } from '@/lib/services/hdWallet';

/**
 * POST /api/user/generate-deposit-address
 * Generate deposit address for current user (migration for existing users)
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

        // Generate deposit address if doesn't exist
        if (!user.depositAddress) {
            const depositInfo = generateDepositAddress(user._id.toString());
            user.depositAddress = depositInfo.address;
            user.depositAddressIndex = depositInfo.index;
            await user.save();

            console.log(`🔑 Generated deposit address for ${user.email}: ${depositInfo.address}`);

            return NextResponse.json({
                success: true,
                address: depositInfo.address,
                message: 'Deposit address generated successfully'
            });
        }

        return NextResponse.json({
            success: true,
            address: user.depositAddress,
            message: 'Deposit address already exists'
        });
    } catch (error: any) {
        console.error('Generate deposit address error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate deposit address' },
            { status: 500 }
        );
    }
}
