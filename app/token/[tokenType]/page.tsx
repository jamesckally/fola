"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";

const TokenDetail = () => {
    const params = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const tokenType = typeof params.tokenType === 'string' ? params.tokenType.toUpperCase() : "CC";

    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth");
        } else if (status === "authenticated") {
            loadBalance();
        }
    }, [status, tokenType]);

    const loadBalance = async () => {
        try {
            const data: any = await api.balances.getAll();
            const tokenBalance = data.find((b: any) => b.token_type === (tokenType === "REWARD" ? "REWARD_POINT" : tokenType));
            if (tokenBalance) {
                setBalance(tokenBalance.balance);
            }
        } catch (error) {
            console.error("Error loading balance:", error);
        } finally {
            setLoading(false);
        }
    };

    const getTokenName = (type: string) => {
        switch (type) {
            case "CC": return "Canton Coin";
            case "SWP": return "Swapa Token";
            case "REWARD": return "Reward Points";
            case "BITSAFE": return "Bitsafe";
            default: return type;
        }
    };

    const getTokenSymbol = (type: string) => {
        switch (type) {
            case "REWARD": return "POINTS";
            default: return type;
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="flex items-center mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-bold text-foreground">{getTokenName(tokenType)}</h1>
            </div>

            <div className="max-w-md mx-auto space-y-6">
                <div className="flex flex-col items-center justify-center py-8">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${tokenType === "CC" ? "bg-secondary/20 text-secondary" :
                        tokenType === "REWARD" ? "bg-accent/20 text-accent" :
                            "bg-primary/20 text-primary"
                        }`}>
                        <span className="text-2xl font-bold">{tokenType.charAt(0)}</span>
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-1">
                        {balance.toFixed(tokenType === "REWARD" ? 0 : 4)} {getTokenSymbol(tokenType)}
                    </h2>
                    <p className="text-muted-foreground">
                        ≈ ${(balance * (tokenType === "CC" ? 0.08 : tokenType === "REWARD" ? 0.07 : 0)).toFixed(2)}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                    <Button
                        variant="outline"
                        className="flex flex-col h-auto py-3 gap-1"
                        onClick={() => router.push("/send")}
                    >
                        <div className="bg-primary/10 p-2 rounded-full">
                            <ArrowUpRight className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-xs">Send</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="flex flex-col h-auto py-3 gap-1"
                        onClick={() => router.push("/receive")}
                    >
                        <div className="bg-primary/10 p-2 rounded-full">
                            <ArrowDownLeft className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-xs">Receive</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="flex flex-col h-auto py-3 gap-1"
                        disabled={tokenType !== "SWP"}
                    >
                        <div className="bg-primary/10 p-2 rounded-full">
                            <RefreshCw className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-xs">Swap</span>
                    </Button>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold text-lg">History</h3>
                    <Card className="p-8 text-center text-muted-foreground bg-card border-border">
                        <p>No transactions yet</p>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TokenDetail;
