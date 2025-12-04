import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { processTransfer } from '@/lib/services/ledger';
import User from '@/lib/models/User';
import UserTag from '@/lib/models/UserTag';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { recipient, amount } = await request.json();

        if (!recipient || !amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid recipient or amount' }, { status: 400 });
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Prevent sending to self
        if (user.walletAddress === recipient) {
            return NextResponse.json({ error: 'Cannot send to yourself' }, { status: 400 });
        }

        // Check if user has purchased a tag
        const userTag = await UserTag.findOne({ userId: user._id });
        if (!userTag) {
            return NextResponse.json({
                error: 'You must purchase a tag before sending CC'
            }, { status: 403 });
        }

        const result = await processTransfer(user._id, recipient, Number(amount));

        return NextResponse.json({
            success: true,
            message: 'Transfer successful',
            newBalance: result.newBalance,
            rewardPoints: result.rewardPoints
        });

    } catch (error: any) {
        console.error('Transfer error:', error);
        return NextResponse.json(
            { error: error.message || 'Transfer failed' },
            { status: 500 }
        );
    }
}
