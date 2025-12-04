import { NextRequest, NextResponse } from 'next/server';
import { isEmailWhitelisted, getWhitelistErrorMessage } from '@/lib/whitelist';
import dbConnect from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@gmail\.com$/i;
        if (!emailRegex.test(email)) {
            return NextResponse.json({
                error: 'Only Gmail addresses are allowed'
            }, { status: 400 });
        }

        await dbConnect();

        // Check whitelist
        const isWhitelisted = await isEmailWhitelisted(email);

        if (!isWhitelisted) {
            return NextResponse.json({
                error: getWhitelistErrorMessage(),
                whitelisted: false
            }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            whitelisted: true,
            message: 'Email is whitelisted',
        });
    } catch (error: any) {
        console.error('Error checking whitelist:', error);
        return NextResponse.json(
            { error: 'Failed to check whitelist' },
            { status: 500 }
        );
    }
}
