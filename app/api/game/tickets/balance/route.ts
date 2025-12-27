import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Ticket from '@/lib/models/Ticket';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        // @ts-ignore
        const userId = session.user.id;

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID not found in session' },
                { status: 400 }
            );
        }

        // Get user's ticket record
        let userTickets = await Ticket.findOne({ userId });

        if (!userTickets) {
            // Create default ticket record
            userTickets = await Ticket.create({ userId });
        }

        // Check if can claim free ticket
        const canClaimFree = userTickets.canClaimFreeTicket();

        // Calculate next claim time
        let nextClaimTime = null;
        if (!canClaimFree && userTickets.lastFreeTicketClaim) {
            nextClaimTime = new Date(userTickets.lastFreeTicketClaim);
            nextClaimTime.setHours(nextClaimTime.getHours() + 24);
        }

        return NextResponse.json({
            freeTickets: userTickets.freeTickets,
            paidTickets: userTickets.paidTickets,
            totalTickets: userTickets.getTotalTickets(),
            canClaimFree,
            nextClaimTime: nextClaimTime?.toISOString() || null,
        });
    } catch (error: any) {
        console.error('Error fetching ticket balance:', error);
        return NextResponse.json(
            { error: 'Failed to fetch ticket balance' },
            { status: 500 }
        );
    }
}
