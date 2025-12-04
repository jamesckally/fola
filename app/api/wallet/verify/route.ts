import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { decryptMnemonic, verifyMnemonicWords } from '@/lib/crypto';
import Wallet from '@/lib/models/Wallet';
import User from '@/lib/models/User';
import dbConnect from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { wordIndices, providedWords } = await req.json();

        if (!wordIndices || !providedWords || wordIndices.length !== providedWords.length) {
            return NextResponse.json({ error: 'Invalid verification data' }, { status: 400 });
        }

        await dbConnect();

        // Get user and wallet
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const wallet = await Wallet.findOne({ userId: user._id });
        if (!wallet) {
            return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
        }

        if (wallet.verified) {
            return NextResponse.json({ error: 'Wallet already verified' }, { status: 400 });
        }

        // Decrypt mnemonic
        const mnemonic = decryptMnemonic(wallet.encryptedSeed);

        // Verify words
        const isValid = verifyMnemonicWords(mnemonic, wordIndices, providedWords);

        if (!isValid) {
            return NextResponse.json({
                success: false,
                error: 'Incorrect words. Please try again.'
            }, { status: 400 });
        }

        // Mark wallet as verified
        await Wallet.findByIdAndUpdate(wallet._id, { verified: true });

        return NextResponse.json({
            success: true,
            message: 'Wallet verified successfully',
        });
    } catch (error: any) {
        console.error('Error verifying wallet:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to verify wallet' },
            { status: 500 }
        );
    }
}
