import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/db';
import { claimDailyRP } from '../../../../lib/rewards';

export async function POST(request: Request) {
    await connectDB();
    const { userId } = await request.json();
    const rp = await claimDailyRP(userId);
    return NextResponse.json({ rp });
}