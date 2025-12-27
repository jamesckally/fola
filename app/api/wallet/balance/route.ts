import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Wallet from '@/lib/models/Wallet';
import User from '@/lib/models/User';
import USDTTransaction from '@/lib/models/USDTTransaction';
import dbConnect from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const wallet = await Wallet.findOne({ userId: user._id });
        if (!wallet) {
            return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
        }

        // Calculate USDT balance from transactions
        const usdtBalanceResult = await USDTTransaction.aggregate([
            { $match: { userId: user._id } },
            {
                $group: {
                    _id: null,
                    balance: {
                        $sum: {
                            $cond: [
                                { $in: ['$type', ['DEPOSIT', 'SPIN_WIN', 'REFERRAL_BONUS']] },
                                '$amount',
                                { $multiply: ['$amount', -1] }
                            ]
                        }
                    }
                }
            }
        ]);

        const usdtBalance = usdtBalanceResult[0]?.balance || 0;

        return NextResponse.json({
            internalBalance: wallet.internalBalance || 0,
            rewardPoints: wallet.rewardPoints || 0,
            usdtBalance: usdtBalance,
            fakeAddress: wallet.fakeAddress
        });

    } catch (error: any) {
        console.error('Balance fetch error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch balance' },
            { status: 500 }
        );
    }
}
