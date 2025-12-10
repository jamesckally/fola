"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowUp, ArrowDown, X } from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api-client";

const CantonPage = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth");
        } else if (status === "authenticated") {
            loadBalance();
        }
    }, [status, router]);

    const loadBalance = async () => {
        try {
            const data: any = await api.balance.get();
            setBalance(data?.balance || 0);
        } catch (error) {
            console.error("Error loading balance:", error);
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading" || loading) {
        return <Loading />;
    }

    const CC_RATE = 0.077;
    const usdValue = balance * CC_RATE;

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="w-full max-w-md mx-auto p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="hover:scale-105 transition-all duration-300"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/dashboard')}
                        className="hover:scale-105 transition-all duration-300"
                    >
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                {/* Token Info Card */}
                <Card className="p-6 bg-gradient-to-br from-[#00ff9d]/20 via-[#00d9ff]/20 to-purple-500/20 border-none shadow-xl rounded-3xl mb-6 relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00ff9d]/30 to-transparent rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#00d9ff]/30 to-transparent rounded-full blur-2xl"></div>

                    <div className="relative z-10">
                        {/* Token Icon and Name */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg">
                                <Image
                                    src="/newcanton.png"
                                    alt="Canton Coin"
                                    width={64}
                                    height={64}
                                    className="object-cover"
                                />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Canton Coin</h1>
                                <p className="text-sm text-muted-foreground">CC</p>
                            </div>
                        </div>

                        {/* Balance */}
                        <div className="text-center mb-6">
                            <p className="text-sm text-muted-foreground mb-2">BALANCE</p>
                            <h2 className="text-4xl font-bold bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] bg-clip-text text-transparent mb-2">
                                {balance.toFixed(6)} CC
                            </h2>
                            <p className="text-2xl text-muted-foreground">${usdValue.toFixed(2)}</p>
                        </div>

                        {/* Price and 24H Change */}
                        <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 mb-6 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">PRICE</p>
                                <p className="text-lg font-bold text-foreground">${CC_RATE.toFixed(4)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">24H CHANGE</p>
                                <p className="text-lg font-bold text-[#00ff9d]">+0.00%</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                onClick={() => router.push('/send')}
                                className="bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300 rounded-xl h-12"
                            >
                                <ArrowUp className="mr-2 h-5 w-5" />
                                Send
                            </Button>
                            <Button
                                onClick={() => router.push('/receive')}
                                className="bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300 rounded-xl h-12"
                            >
                                <ArrowDown className="mr-2 h-5 w-5" />
                                Receive
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Activity Section */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-foreground">Activity</h2>
                    <Card className="p-8 text-center bg-card border-border">
                        <p className="text-muted-foreground">No recent transactions</p>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CantonPage;
