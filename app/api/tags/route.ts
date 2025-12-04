import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import UserTag from '@/lib/models/UserTag';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const tag = await UserTag.findOne({ userId: user._id });

        if (!tag) {
            return NextResponse.json({ tag: null });
        }

        return NextResponse.json({
            tag_name: tag.tagName,
            created_at: tag.createdAt,
            countdownEndDate: tag.countdownEndDate || null,
        });
    } catch (error) {
        console.error('Error fetching tag:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { tagName, txHash } = body;

        if (!tagName || !txHash) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if tag already exists
        const existingTag = await UserTag.findOne({
            $or: [
                { userId: user._id },
                { tagName: tagName.toLowerCase() }
            ]
        });

        if (existingTag) {
            if (existingTag.userId.toString() === user._id.toString()) {
                return NextResponse.json({ error: 'You already have a tag' }, { status: 400 });
            } else {
                return NextResponse.json({ error: 'This tag is already taken' }, { status: 400 });
            }
        }

        // Create tag with countdown (5 days from now)
        const countdownEndDate = new Date();
        countdownEndDate.setDate(countdownEndDate.getDate() + 5);

        const tag = await UserTag.create({
            userId: user._id,
            tagName: tagName.toLowerCase(),
            transactionHash: txHash,
            countdownEndDate: countdownEndDate,
        });

        return NextResponse.json({
            success: true,
            tag_name: tag.tagName,
            countdownEndDate: tag.countdownEndDate,
        });
    } catch (error: any) {
        console.error('Error creating tag:', error);
        if (error.code === 11000) {
            return NextResponse.json({ error: 'Tag already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
