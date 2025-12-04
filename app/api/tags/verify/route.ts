import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import UserTag from '@/lib/models/UserTag';
import User from '@/lib/models/User';
import { verifyTagPurchase } from '@/lib/treasury';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { txHash, tagName } = body;

        if (!txHash || !tagName) {
            return NextResponse.json(
                { error: 'Transaction hash and tag name required' },
                { status: 400 }
            );
        }

        // Verify transaction on Canton Network
        const verification = await verifyTagPurchase(txHash);

        if (!verification.verified) {
            return NextResponse.json(
                { error: verification.error || 'Transaction verification failed' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Get user
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Create tag with Swapa_ prefix
        const finalTagName = `Swapa_${tagName}`;

        // Check if tag already exists
        const existingTag = await UserTag.findOne({
            tagName: finalTagName.toLowerCase()
        });

        if (existingTag) {
            return NextResponse.json(
                { error: 'Tag already exists' },
                { status: 400 }
            );
        }

        // Create new tag
        const newTag = await UserTag.create({
            userId: user._id,
            tagName: finalTagName.toLowerCase(),
            transactionHash: txHash
        });

        return NextResponse.json({
            success: true,
            tagName: finalTagName,
            message: 'Tag created successfully'
        });
    } catch (error: any) {
        console.error('Error verifying tag purchase:', error);
        return NextResponse.json(
            { error: error.message || 'Verification failed' },
            { status: 500 }
        );
    }
}
