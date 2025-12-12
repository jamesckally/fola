import { NextRequest, NextResponse } from 'next/server';
import { isEmailWhitelisted } from '@/lib/whitelist';
import User from '@/lib/models/User';
import Wallet from '@/lib/models/Wallet';
import dbConnect from '@/lib/db';

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const isWhitelisted = await isEmailWhitelisted(email);

        // Check if user already exists
        const user = await User.findOne({ email });

        // User exists only if they have a complete wallet with encrypted seed
        let userExists = false;
        if (user) {
            const wallet = await Wallet.findOne({ userId: user._id });
            // Only consider user as "existing" if they have a wallet with encrypted seed
            userExists = !!(wallet && wallet.encryptedSeed);
        }

        // Check if public registration is available for non-whitelisted users
        let publicRegistrationAvailable = false;
        if (!isWhitelisted) {
            const nonWhitelistedCount = await User.countDocuments({ isWhitelisted: false });
            publicRegistrationAvailable = nonWhitelistedCount < 5000;
        }

        return NextResponse.json({
            isWhitelisted,
            userExists,
            publicRegistrationAvailable
        });
    } catch (error) {
        console.error('Whitelist check error:', error);
        return NextResponse.json({ error: 'Failed to check whitelist' }, { status: 500 });
    }
}
