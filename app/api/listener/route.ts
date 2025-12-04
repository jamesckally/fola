import { NextResponse } from 'next/server';
import { creditRPSend } from '../../../lib/rewards';

export async function POST(request: Request) {
    const { sender } = await request.json();
    const user = await User.findOne({ address: sender });
    if (user) {
        await creditRPSend(user._id.toString());
    }
    return NextResponse.json({ success: true });
}