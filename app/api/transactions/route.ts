import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import Transaction from '@/lib/models/Transaction';

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

        const transactions = await Transaction.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(100);

        // Format for frontend
        const formattedTransactions = transactions.map(tx => ({
            id: tx._id.toString(),
            created_at: tx.createdAt,
            amount: tx.amount,
            token_type: tx.tokenType,
            transaction_type: tx.transactionType,
            status: tx.status,
            recipient_address: tx.recipientAddress,
            sender_address: tx.senderAddress,
            transaction_hash: tx.transactionHash,
            metadata: tx.metadata,
        }));

        return NextResponse.json(formattedTransactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
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
        const { recipient, amount, token, memo } = body;

        if (!recipient || !amount || !token) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Create transaction
        const transaction = await Transaction.create({
            userId: user._id,
            transactionType: 'SEND',
            tokenType: token,
            amount: parseFloat(amount),
            recipientAddress: recipient,
            status: 'pending',
            metadata: { memo },
        });

        return NextResponse.json({
            success: true,
            transactionId: transaction._id.toString(),
        });
    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
