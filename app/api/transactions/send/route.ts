import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Wallet from '@/lib/models/Wallet';
import { decryptMnemonic } from '@/lib/crypto';
import { deriveCantonPartyId, getPrivateKeyFromMnemonic, sendCantonCC, isValidCantonAddress } from '@/lib/canton';

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
        const { recipient, amount } = body;

        // Validate inputs
        if (!recipient || !amount) {
            return NextResponse.json(
                { error: 'Recipient and amount are required' },
                { status: 400 }
            );
        }

        // Validate Canton address format
        if (!isValidCantonAddress(recipient)) {
            return NextResponse.json(
                { error: 'Invalid Canton Party ID format' },
                { status: 400 }
            );
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Get user's wallet
        const wallet = await Wallet.findOne({ userId: (session.user as any).id });

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

        // Send Canton CC transaction
        const txHash = await sendCantonCC(
            fromPartyId,
            recipient,
            amountNum,
            privateKey
        );

        return NextResponse.json({
            success: true,
            txHash,
            message: 'Transaction sent successfully'
        });
    } catch (error: any) {
        console.error('Error sending Canton CC:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send transaction' },
            { status: 500 }
        );
    }
}
