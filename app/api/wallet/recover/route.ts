import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { isValidMnemonic, encryptMnemonic, deriveWalletFromMnemonic } from '@/lib/crypto';
import Wallet from '@/lib/models/Wallet';
import User from '@/lib/models/User';
import dbConnect from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { mnemonic } = await req.json();

        if (!mnemonic) {
            return NextResponse.json({ error: 'Mnemonic is required' }, { status: 400 });
        }

        // Validate mnemonic
        if (!isValidMnemonic(mnemonic.trim())) {
            return NextResponse.json({ error: 'Invalid recovery phrase' }, { status: 400 });
        }

        await dbConnect();

        // Get user
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Derive wallet address from mnemonic
        const { address } = deriveWalletFromMnemonic(mnemonic.trim());

        // Check if wallet exists
        const existingWallet = await Wallet.findOne({ userId: user._id });

        if (existingWallet) {
            // Verify it matches the existing wallet
            if (existingWallet.publicAddress !== address) {
                return NextResponse.json({
                    error: 'Recovery phrase does not match your wallet'
                }, { status: 400 });
            }

            return NextResponse.json({
                success: true,
                message: 'Wallet recovered successfully',
                address,
            });
        }

        // Create new wallet from recovery phrase
        const encryptedSeed = encryptMnemonic(mnemonic.trim());

        const wallet = await Wallet.create({
            userId: user._id,
            encryptedSeed,
            publicAddress: address,
            phraseLength: mnemonic.trim().split(' ').length,
            verified: true, // Auto-verified since they provided the phrase
        });

        // Update user with wallet address
        await User.findByIdAndUpdate(user._id, {
            walletAddress: address,
        });

        return NextResponse.json({
            success: true,
            message: 'Wallet recovered successfully',
            address,
        });
    } catch (error: any) {
        console.error('Error recovering wallet:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to recover wallet' },
            { status: 500 }
        );
    }
}
