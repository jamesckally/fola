import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Wallet from "@/lib/models/Wallet";

const CONVERSION_RATE = 100; // 100 Reward Points = 1 CC

export async function POST(req: Request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { amount } = await req.json();

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: "Invalid amount" },
                { status: 400 }
            );
        }

        if (amount < CONVERSION_RATE) {
            return NextResponse.json(
                { error: `Minimum conversion is ${CONVERSION_RATE} points` },
                { status: 400 }
            );
        }

        // Get user
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Get wallet
        const wallet = await Wallet.findOne({ userId: user._id });

        if (!wallet) {
            return NextResponse.json(
                { error: "Wallet not found" },
                { status: 404 }
            );
        }

        // Check if user has enough reward points
        if ((wallet.rewardPoints || 0) < amount) {
            return NextResponse.json(
                { error: "Insufficient reward points" },
                { status: 400 }
            );
        }

        // Calculate CC to receive
        const ccToReceive = amount / CONVERSION_RATE;

        // Update wallet balance and reward points
        wallet.rewardPoints = (wallet.rewardPoints || 0) - amount;
        wallet.internalBalance = (wallet.internalBalance || 0) + ccToReceive;

        // Add transaction to history
        if (!wallet.transactions) {
            wallet.transactions = [];
        }

        wallet.transactions.push({
            type: 'INTERNAL_TRANSFER',
            amount: ccToReceive,
            status: 'COMPLETED',
            description: `Converted ${amount} reward points to ${ccToReceive} CC`,
            createdAt: new Date(),
        });

        await wallet.save();

        return NextResponse.json({
            success: true,
            ccReceived: ccToReceive,
            newRewardPoints: wallet.rewardPoints,
            newBalance: wallet.internalBalance
        });
    } catch (error) {
        console.error("Error converting rewards:", error);
        return NextResponse.json(
            { error: "Failed to convert rewards" },
            { status: 500 }
        );
    }
}
