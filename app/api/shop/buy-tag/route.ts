import { NextRequest, NextResponse } from 'next/server';
import { SwapaService } from '@/lib/services/swapa';
import dbConnect from '@/lib/db';

/**
 * POST /api/shop/buy-tag
 * Purchase a Swapa Tag
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const { userId, tagName } = await req.json();

        // Validate inputs
        if (!userId || !tagName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Purchase tag
        const result = await SwapaService.purchaseTag(userId, tagName);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            tag: result.tag,
            message: 'Tag purchased successfully',
        });
    } catch (error: any) {
        console.error('Tag purchase error:', error);
        return NextResponse.json(
            { error: error.message || 'Purchase failed' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/shop/buy-tag?tagName=xxx
 * Check if tag name is available
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const tagName = searchParams.get('tagName');

        if (!tagName) {
            return NextResponse.json(
                { error: 'tagName is required' },
                { status: 400 }
            );
        }

        const available = await SwapaService.isTagAvailable(tagName);

        return NextResponse.json({
            success: true,
            available,
        });
    } catch (error: any) {
        console.error('Check tag availability error:', error);
        return NextResponse.json(
            { error: error.message || 'Check failed' },
            { status: 500 }
        );
    }
}
