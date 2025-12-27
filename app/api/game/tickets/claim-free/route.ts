import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Ticket from '@/lib/models/Ticket';

export async function POST(request: NextRequest) {
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

        // Get or create user's ticket record
        let userTickets = await Ticket.findOne({ userId });

        if (!userTickets) {
            userTickets = await Ticket.create({ userId });
        }

        // Check if user can claim free ticket
        if (!userTickets.canClaimFreeTicket()) {
            const nextClaimTime = new Date(userTickets.lastFreeTicketClaim);
            nextClaimTime.setHours(nextClaimTime.getHours() + 24);

            return NextResponse.json(
                {
                    error: 'Free ticket already claimed today',
                    nextClaimTime: nextClaimTime.toISOString()
                },
                { status: 400 }
            );
        }

        // Grant free ticket
        userTickets.freeTickets += 1;
        userTickets.lastFreeTicketClaim = new Date();
        await userTickets.save();

        // Calculate next claim time
        const nextClaimTime = new Date();
        nextClaimTime.setHours(nextClaimTime.getHours() + 24);

        return NextResponse.json({
            success: true,
            freeTickets: userTickets.freeTickets,
            paidTickets: userTickets.paidTickets,
            totalTickets: userTickets.getTotalTickets(),
            nextClaimTime: nextClaimTime.toISOString(),
            message: '🎟️ Free ticket claimed! Good luck!'
        });
    } catch (error: any) {
        console.error('Error claiming free ticket:', error);
        return NextResponse.json(
            { error: 'Failed to claim free ticket' },
            { status: 500 }
        );
    }
}
