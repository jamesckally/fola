import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { processDeposit } from '@/lib/services/ledger';
import { isValidCantonTxHash } from '@/lib/validators/canton-tx';
import User from '@/lib/models/User';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { txHash } = await request.json();
        if (!txHash) {
            return NextResponse.json({ error: 'Transaction hash required' }, { status: 400 });
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Validate transaction hash format
        if (!isValidCantonTxHash(txHash)) {
            return NextResponse.json({
                error: 'Invalid transaction hash format. Please provide a valid 64-character hexadecimal hash.'
            }, { status: 400 });
        }

        console.log('Deposit verification - txHash:', txHash);

        const result = await processDeposit(user._id, txHash);

        return NextResponse.json({
            success: true,
            message: 'Deposit verified and credited',
            newBalance: result.newBalance
        });

    } catch (error: any) {
        console.error('Deposit verification error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to verify deposit' },
            { status: 500 }
        );
    }
}
