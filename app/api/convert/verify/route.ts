import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { verifyRewardConversion } from '@/lib/treasury';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { txHash } = body;

        if (!txHash) {
            return NextResponse.json(
                { error: 'Transaction hash required' },
                { status: 400 }
            );
        }

        // Verify transaction on Canton Network
        const verification = await verifyRewardConversion(txHash);

        if (!verification.verified) {
            return NextResponse.json(
                { error: verification.error || 'Verification failed' },
                { status: 400 }
            );
        }

        // In a real production app, we would update the user's reward cycle in the database here.
        // For now, we return success and let the client reset the local timer.

        return NextResponse.json({
            success: true,
            message: 'Rewards converted successfully',
            amount: verification.amount
        });

    } catch (error: any) {
        console.error('Error verifying conversion:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to verify conversion' },
            { status: 500 }
        );
    }
}
