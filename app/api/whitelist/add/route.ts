import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { addEmailToWhitelist } from '@/lib/whitelist';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        await dbConnect();
        const result = await addEmailToWhitelist(email);

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: result.message
            });
        } else {
            return NextResponse.json(
                { error: result.message },
                { status: 400 }
            );
        }
    } catch (error: any) {
        console.error('Error in whitelist API:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to add email to whitelist' },
            { status: 500 }
        );
    }
}
