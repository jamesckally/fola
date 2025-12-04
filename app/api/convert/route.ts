import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Wallet from '@/lib/models/Wallet';
import User from '@/lib/models/User';
import { decryptMnemonic } from '@/lib/crypto';
import { deriveCantonPartyId, getPrivateKeyFromMnemonic } from '@/lib/canton';
import { convertRewards } from '@/lib/treasury';

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

        // Only handle 'convert' action for now
        if (body.action !== 'convert') {
            return NextResponse.json(
                { error: 'Invalid action' },
                { status: 400 }
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

        const wallet = await Wallet.findOne({ userId: user._id });

        if (!wallet) {
            return NextResponse.json(
                { error: 'Wallet not found' },
                { status: 404 }
            );
        }

        // Decrypt mnemonic and derive keys
        const mnemonic = decryptMnemonic(wallet.encryptedSeed);
        const fromPartyId = deriveCantonPartyId(mnemonic);
        const privateKey = getPrivateKeyFromMnemonic(mnemonic);

        // Send 10 CC to treasury
        const result = await convertRewards(fromPartyId, privateKey);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Conversion payment failed' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            txHash: result.txHash,
            message: 'Payment sent. Please verify transaction.'
        });

    } catch (error: any) {
        console.error('Error converting rewards:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to convert rewards' },
            { status: 500 }
        );
    }
}
