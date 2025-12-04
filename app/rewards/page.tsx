"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, ArrowDownUp, Gift, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface RewardHistory {
    id: string;
    amount: number;
    source: string;
    createdAt: string;
}

const RewardsPage = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    const [converting, setConverting] = useState(false);
    const [rewardPoints, setRewardPoints] = useState(0);
    const [rewardsHistory, setRewardsHistory] = useState<RewardHistory[]>([]);
    const [showConvertDialog, setShowConvertDialog] = useState(false);
    const [convertAmount, setConvertAmount] = useState("");

    // Conversion rate: 1 Reward Point = 1 CC
    const CONVERSION_RATE = 1;
    const MINIMUM_CONVERSION = 350;

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth");
        } else if (status === "authenticated") {
            loadRewardsData();
        }
    }, [status]);

    const loadRewardsData = async () => {
        try {
            // Fetch reward points balance
            const balanceRes = await fetch('/api/wallet/balance');
            if (balanceRes.ok) {
                const data = await balanceRes.json();
                setRewardPoints(data.rewardPoints || 0);
            }

            // Fetch rewards history
            const historyRes = await fetch('/api/rewards/history');
            if (historyRes.ok) {
                const data = await historyRes.json();
                setRewardsHistory(data.history || []);
            }
        } catch (error) {
            console.error("Error loading rewards data:", error);
            toast.error("Failed to load rewards data");
        } finally {
            setLoading(false);
        }
    };

    const handleConvert = async () => {
        const amount = Number(convertAmount);

        if (!amount || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (amount > rewardPoints) {
            toast.error("Insufficient reward points");
            return;
        }

        if (amount < MINIMUM_CONVERSION) {
            toast.error(`Minimum conversion is ${MINIMUM_CONVERSION} points`);
            return;
        }

        setConverting(true);
        try {
            const res = await fetch('/api/rewards/convert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Conversion failed');
            }

            const ccReceived = amount / CONVERSION_RATE;
            toast.success(`Converted ${amount} points to ${ccReceived} CC!`);
            setRewardPoints(data.newRewardPoints);
            setShowConvertDialog(false);
            setConvertAmount("");
            loadRewardsData(); // Reload to get updated history
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setConverting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    const convertibleCC = Math.floor(rewardPoints / CONVERSION_RATE);

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="w-full max-w-md mx-auto p-4">
                {/* Header */}
                <div className="flex items-center mb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="mr-2 hover:scale-105 transition-all duration-300"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-bold text-foreground">Reward Points</h1>
                </div>

                {/* Total Rewards Card */}
                <Card className="p-6 bg-gradient-to-br from-[#00ff9d]/20 via-[#00d9ff]/20 to-purple-500/20 border-none shadow-xl rounded-3xl mb-6 relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00ff9d]/30 to-transparent rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#00d9ff]/30 to-transparent rounded-full blur-2xl"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-5 w-5 text-[#00ff9d]" />
                            <span className="text-sm text-muted-foreground">Total Rewards</span>
                        </div>

                        <div className="flex items-end justify-between mb-4">
                            <div>
                                <h2 className="text-5xl font-bold bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] bg-clip-text text-transparent">
                                    {rewardPoints.toLocaleString()}
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">Reward Points</p>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1 text-[#00ff9d]">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="text-sm font-semibold">Active</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-background/50 backdrop-blur-sm rounded-xl p-3 mb-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Convertible to CC</span>
                                <span className="font-bold text-foreground">{convertibleCC} CC</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Rate: {CONVERSION_RATE} points = 1 CC
                            </p>
                        </div>

                        <Button
                            onClick={() => setShowConvertDialog(true)}
                            disabled={rewardPoints < MINIMUM_CONVERSION}
                            className="w-full bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300 rounded-xl h-12"
                        >
                            <ArrowDownUp className="mr-2 h-5 w-5" />
                            Convert to Canton Coin
                        </Button>
                    </div>
                </Card>

                {/* Rewards History */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-foreground">Rewards History</h2>
                        <Gift className="h-5 w-5 text-[#00ff9d]" />
                    </div>

                    {rewardsHistory.length === 0 ? (
                        <Card className="p-8 text-center bg-card border-border">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center">
                                    <Gift className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground mb-1">No rewards yet</p>
                                    <p className="text-sm text-muted-foreground">
                                        Start sending transactions to earn reward points!
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {rewardsHistory.map((reward) => (
                                <Card
                                    key={reward.id}
                                    className="p-4 bg-card border-border hover:bg-card/80 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-[#00ff9d]/20 to-[#00d9ff]/20 rounded-full flex items-center justify-center">
                                                <Gift className="h-5 w-5 text-[#00ff9d]" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {reward.source}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(reward.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-[#00ff9d]">
                                                +{reward.amount}
                                            </p>
                                            <p className="text-xs text-muted-foreground">points</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Convert Dialog */}
                <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Convert Reward Points</DialogTitle>
                            <DialogDescription>
                                Convert your reward points to Canton Coin at a rate of 1 point = 1 CC (Minimum: {MINIMUM_CONVERSION} points)
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Amount (Reward Points)</label>
                                <Input
                                    type="number"
                                    placeholder={`Minimum ${MINIMUM_CONVERSION} points`}
                                    value={convertAmount}
                                    onChange={(e) => setConvertAmount(e.target.value)}
                                    min={MINIMUM_CONVERSION}
                                    max={rewardPoints}
                                />
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Available: {rewardPoints} points</span>
                                    {convertAmount && Number(convertAmount) >= CONVERSION_RATE && (
                                        <span className="text-[#00ff9d] font-semibold">
                                            ≈ {(Number(convertAmount) / CONVERSION_RATE).toFixed(2)} CC
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Button
                                onClick={handleConvert}
                                disabled={converting}
                                className="w-full bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300 rounded-xl"
                            >
                                {converting ? "Converting..." : "Convert Now"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default RewardsPage;
