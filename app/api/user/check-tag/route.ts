import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import UserTag from '@/lib/models/UserTag';

/**
 * GET /api/user/check-tag
 * Check if the current user has a Swapa Tag
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ hasTag: false });
        }

        await dbConnect();

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ hasTag: false });
        }

        // Check if user has a tag
        const userTag = await UserTag.findOne({ userId: user._id });

        return NextResponse.json({
            hasTag: !!userTag,
            tagName: userTag?.tagName || null
        });
    } catch (error: any) {
        console.error('Error checking tag status:', error);
        return NextResponse.json(
            { hasTag: false, error: error.message },
            { status: 500 }
        );
    }
}
