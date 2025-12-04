import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Wallet from '@/lib/models/Wallet';

export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        // Get user by email
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Delete user's wallet
        await Wallet.deleteOne({ userId: user._id });

        // Clear wallet address from user record
        await User.findByIdAndUpdate(user._id, {
            $unset: { walletAddress: 1 }
        });

        return NextResponse.json({
            success: true,
            message: 'Wallet deleted successfully. Please sign out and sign in again to create a new wallet.'
        });
    } catch (error: any) {
        console.error('Error deleting wallet:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete wallet' },
            { status: 500 }
        );
    }
}
