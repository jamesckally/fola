import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Wallet from '@/lib/models/Wallet';
import Transaction from '@/lib/models/Transaction';
import UserTag from '@/lib/models/UserTag';

export async function DELETE() {
    try {
        await dbConnect();

        // Delete ALL data from all collections
        await User.deleteMany({});
        await Wallet.deleteMany({});
        await Transaction.deleteMany({});
        await UserTag.deleteMany({});

        return NextResponse.json({
            success: true,
            message: 'All data (Users, Wallets, Transactions, Tags) has been permanently deleted.'
        });
    } catch (error: any) {
        console.error('Error resetting database:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to reset database' },
            { status: 500 }
        );
    }
}
