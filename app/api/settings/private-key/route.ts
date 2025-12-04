import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import User from '@/lib/models/User';
import Wallet from '@/lib/models/Wallet';
import { decryptMnemonic } from '@/lib/crypto';
import connectDB from '@/lib/db';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const wallet = await Wallet.findOne({ userId: user._id });
        if (!wallet || !wallet.encryptedSeed) {
            return NextResponse.json({
                privateKey: 'No private key found'
            });
        }

        try {
            const privateKey = decryptMnemonic(wallet.encryptedSeed);
            return NextResponse.json({ privateKey });
        } catch (error) {
            console.error('Error decrypting seed:', error);
            return NextResponse.json({ error: 'Failed to decrypt key' }, { status: 500 });
        }

    } catch (error) {
        console.error('Error fetching private key:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
