import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Wallet from "@/lib/models/Wallet";

export async function GET() {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
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

        // Get wallet for reward history
        const wallet = await Wallet.findOne({ userId: user._id });

        if (!wallet) {
            return NextResponse.json({ history: [] });
        }

        // Get reward history from wallet transactions
        const rewardHistory = wallet.transactions
            ?.filter((tx: any) => tx.rewardPoints && tx.rewardPoints > 0)
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 50) // Limit to last 50 rewards
            .map((tx: any) => ({
                id: tx._id.toString(),
                amount: tx.rewardPoints,
                source: tx.description || `${tx.type} Transaction`,
                createdAt: tx.createdAt.toISOString(),
            })) || [];

        return NextResponse.json({ history: rewardHistory });
    } catch (error) {
        console.error("Error fetching rewards history:", error);
        return NextResponse.json(
            { error: "Failed to fetch rewards history" },
            { status: 500 }
        );
    }
}
