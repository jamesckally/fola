import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Wallet from '@/lib/models/Wallet';
import { decryptMnemonic } from '@/lib/crypto';
import { deriveCantonPartyId, getCantonBalance } from '@/lib/canton';

export async function GET() {
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

        // Get user's wallet
        const wallet = await Wallet.findOne({ userId: user._id });

        if (!wallet) {
            return NextResponse.json(
                { error: 'Wallet not found' },
                { status: 404 }
            );
        }

        try {
            // Decrypt mnemonic
            const mnemonic = decryptMnemonic(wallet.encryptedSeed);

            // Derive Canton Party ID
            const partyId = deriveCantonPartyId(mnemonic);

            // Query real CC balance from Canton Network
            const ccBalance = await getCantonBalance(partyId);

            // For now, return mock reward points (will be updated later)
            const rewardPoints = 0;

            return NextResponse.json([
                {
                    token_type: 'CC',
                    balance: ccBalance
                },
                {
                    token_type: 'REWARD_POINT',
                    balance: rewardPoints
                }
            ]);
        } catch (decryptError: any) {
            // If decryption fails, it means the wallet was encrypted with a different key
            console.error('Decryption error - wallet encrypted with different key:', decryptError.message);

            return NextResponse.json(
                {
                    error: 'Wallet encryption key mismatch. Please delete your wallet and create a new one.',
                    needsNewWallet: true
                },
                { status: 400 }
            );
        }
    } catch (error: any) {
        console.error('Error fetching Canton balance:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch balance' },
            { status: 500 }
        );
    }
}
