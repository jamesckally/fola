"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowUp, ArrowDown, X } from "lucide-react";
import Image from "next/image";

const USDCxPage = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth");
        } else if (status === "authenticated") {
            setLoading(false);
        }
    }, [status, router]);

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    const usdValue = balance * 1.0; // $1.000 per USDCx

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
                <Card className="p-3 bg-gradient-to-br from-[#00ff9d]/20 via-[#00d9ff]/20 to-purple-500/20 border-none shadow-xl rounded-3xl mb-6 relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00ff9d]/30 to-transparent rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#00d9ff]/30 to-transparent rounded-full blur-2xl"></div>

                    <div className="relative z-10">
                        {/* Token Icon and Name */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg">
                                <Image
                                    src="/sbc-icon.png"
                                    alt="CUSD"
                                    width={48}
                                    height={48}
                                    className="object-cover"
                                />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">CUSD</h1>
                                <p className="text-xs text-muted-foreground">CUSD</p>
                            </div>
                        </div>

                        {/* Balance */}
                        <div className="text-center mb-3">
                            <p className="text-xs text-muted-foreground mb-1">BALANCE</p>
                            <h2 className="text-2xl font-bold text-foreground mb-1">
                                {balance} CUSD
                            </h2>
                            <p className="text-lg text-muted-foreground">${usdValue.toFixed(2)}</p>
                        </div>

                        {/* Price and 24H Change */}
                        <div className="bg-background/50 backdrop-blur-sm rounded-xl p-2 mb-3 grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">PRICE</p>
                                <p className="text-base font-bold text-foreground">$1.000</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">24H CHANGE</p>
                                <p className="text-base font-bold text-[#00ff9d]">+0.00%</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                disabled
                                className="bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300 rounded-xl h-10 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ArrowUp className="mr-1.5 h-4 w-4" />
                                Send
                            </Button>
                            <Button
                                onClick={() => router.push('/receive')}
                                className="bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300 rounded-xl h-10 text-sm"
                            >
                                <ArrowDown className="mr-1.5 h-4 w-4" />
                                Receive
                            </Button>
                        </div>
                    </div>
                </Card>

                <p className="text-center text-sm text-muted-foreground mb-4">
                    Insufficient balance to send
                </p>

                {/* Activity Section */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-foreground">Activity</h2>
                    <Card className="p-8 text-center bg-card border-border">
                        <p className="text-muted-foreground">No results found</p>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default USDCxPage;
