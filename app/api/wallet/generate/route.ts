export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateMnemonicPhrase, encryptMnemonic } from '@/lib/crypto';
import { deriveCantonPartyId } from '@/lib/canton';
import Wallet from '@/lib/models/Wallet';
import User from '@/lib/models/User';
import dbConnect from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Check if user already has a wallet
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const existingWallet = await Wallet.findOne({ userId: user._id });
        if (existingWallet) {
            return NextResponse.json({ error: 'Wallet already exists' }, { status: 400 });
        }

        // Generate 12-word mnemonic
        const mnemonic = generateMnemonicPhrase();

        // Derive Canton Party ID from mnemonic
        const cantonPartyId = deriveCantonPartyId(mnemonic);

        // Encrypt mnemonic
        const encryptedSeed = encryptMnemonic(mnemonic);

        // Create wallet record with Canton Party ID
        const wallet = await Wallet.create({
            userId: user._id,
            encryptedSeed,
            publicAddress: cantonPartyId, // Store Canton Party ID instead of ETH address
            phraseLength: 12,
            verified: false,
        });

        // Update user with Canton Party ID
        await User.findByIdAndUpdate(user._id, {
            walletAddress: cantonPartyId,
        });

        // Return mnemonic to user (only time it's shown in plain text)
        return NextResponse.json({
            success: true,
            mnemonic,
            address: cantonPartyId,
            walletId: wallet._id,
        });
    } catch (error: any) {
        console.error('Error generating wallet:', error);

        // Handle duplicate key error (race condition)
        if (error.code === 11000 || error.message?.includes('E11000')) {
            return NextResponse.json({ error: 'Wallet already exists' }, { status: 400 });
        }

        return NextResponse.json(
            { error: error.message || 'Failed to generate wallet' },
            { status: 500 }
        );
    }
}
