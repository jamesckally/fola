import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import UserTag from '@/lib/models/UserTag';
import Wallet from '@/lib/models/Wallet';
import Transaction from '@/lib/models/Transaction';

const TAG_PURCHASE_COST = 30; // 30 Internal CC

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { tagName } = body;

        if (!tagName) {
            return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
        }

        // Validate tag name
        if (tagName.length < 3 || tagName.length > 20) {
            return NextResponse.json({ error: 'Tag name must be between 3 and 20 characters' }, { status: 400 });
        }

        if (!/^[a-z0-9_]+$/.test(tagName.toLowerCase())) {
            return NextResponse.json({ error: 'Tag name can only contain lowercase letters, numbers, and underscores' }, { status: 400 });
        }

        await connectDB();

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if user already has a tag
        const existingUserTag = await UserTag.findOne({ userId: user._id });
        if (existingUserTag) {
            return NextResponse.json({ error: 'You already have a tag' }, { status: 400 });
        }

        // Check if tag name is already taken
        const existingTag = await UserTag.findOne({ tagName: tagName.toLowerCase() });
        if (existingTag) {
            return NextResponse.json({ error: 'This tag name is already taken' }, { status: 400 });
        }

        // Check user's wallet balance
        const wallet = await Wallet.findOne({ userId: user._id });
        if (!wallet) {
            return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
        }

        if (wallet.internalBalance < TAG_PURCHASE_COST) {
            return NextResponse.json({ error: `Insufficient balance. You need ${TAG_PURCHASE_COST} CC to purchase a tag.` }, { status: 400 });
        }

        // Deduct balance
        wallet.internalBalance -= TAG_PURCHASE_COST;
        await wallet.save();

        // Create tag with countdown (5 days from now)
        const countdownEndDate = new Date();
        countdownEndDate.setDate(countdownEndDate.getDate() + 5);

        const tag = await UserTag.create({
            userId: user._id,
            tagName: tagName.toLowerCase(),
            countdownEndDate: countdownEndDate,
        });

        // Record transaction
        await Transaction.create({
            userId: user._id,
            type: 'TAG_PURCHASE',
            amount: -TAG_PURCHASE_COST,
            status: 'COMPLETED',
            description: `Purchased tag: @${tagName.toLowerCase()}`
        });

        return NextResponse.json({
            success: true,
            tagName: tag.tagName,
            countdownEndDate: tag.countdownEndDate,
            newBalance: wallet.internalBalance,
        });
    } catch (error: any) {
        console.error('Error purchasing tag:', error);
        if (error.code === 11000) {
            return NextResponse.json({ error: 'Tag already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
