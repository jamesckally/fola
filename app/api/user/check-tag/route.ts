import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import SwapaTag from '@/lib/models/SwapaTag';

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

        // Check if user has a tag (using SwapaTag model)
        const userTag = await SwapaTag.findOne({ owner: user._id });

        return NextResponse.json({
            hasTag: !!userTag,
            tag_name: userTag?.name || null  // Changed from tagName to name
        });
    } catch (error: any) {
        console.error('Error checking tag status:', error);
        return NextResponse.json(
            { hasTag: false, error: error.message },
            { status: 500 }
        );
    }
}
