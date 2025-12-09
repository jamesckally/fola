import { NextRequest, NextResponse } from 'next/server';
import { isEmailWhitelisted } from '@/lib/whitelist';
import User from '@/lib/models/User';
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
        const userExists = !!user;

        return NextResponse.json({ isWhitelisted, userExists });
    } catch (error) {
        console.error('Whitelist check error:', error);
        return NextResponse.json({ error: 'Failed to check whitelist' }, { status: 500 });
    }
}
