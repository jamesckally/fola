"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Copy, Share2, QrCode } from "lucide-react";
import { toast } from "sonner";

const Receive = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [address, setAddress] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth");
        } else if (status === "authenticated") {
            loadWalletAddress();
        }
    }, [status]);

    const loadWalletAddress = async () => {
        try {
            // Fetch real Canton Party ID from session
            const walletAddress = (session?.user as any)?.walletAddress;

            if (walletAddress) {
                setAddress(walletAddress);
            } else {
                toast.error("Wallet address not found. Please create a wallet first.");
            }
        } catch (error) {
            console.error("Error loading address:", error);
            toast.error("Failed to load wallet address");
        } finally {
            setLoading(false);
        }
    };

    const copyAddress = () => {
        navigator.clipboard.writeText(address);
        toast.success("Canton Party ID copied to clipboard!");
    };

    const shareAddress = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My Canton Wallet Address',
                    text: address,
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            copyAddress();
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
        <div className="min-h-screen bg-background pb-20">
            <div className="w-full max-w-md mx-auto p-4">
                {/* Header */}
                <div className="flex items-center mb-6">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2 hover:scale-105 transition-all duration-300">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-bold text-foreground">Receive</h1>
                </div>

                {/* Content */}
                <div className="flex flex-col items-center justify-center space-y-6">
                    <Card className="p-8 bg-card border-border rounded-3xl shadow-lg">
                        {/* QR Code Placeholder */}
                        <div className="w-48 h-48 bg-secondary/20 rounded-2xl flex items-center justify-center">
                            <QrCode className="h-24 w-24 text-muted-foreground" />
                        </div>
                    </Card>

                    {/* Address Display */}
                    <div className="w-full space-y-2">
                        <p className="text-sm text-muted-foreground text-center">
                            Your Canton Party ID
                        </p>
                        <Card className="p-4 bg-secondary/20 border-border">
                            <p className="text-xs font-mono text-foreground break-all text-center">
                                {address || "No wallet found"}
                            </p>
                        </Card>
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full flex gap-3">
                        <Button
                            onClick={copyAddress}
                            className="flex-1 h-12 bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300 rounded-xl"
                            disabled={!address}
                        >
                            <Copy className="mr-2 h-5 w-5" />
                            Copy
                        </Button>
                        <Button
                            onClick={shareAddress}
                            className="flex-1 h-12 bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300 rounded-xl"
                            disabled={!address}
                        >
                            <Share2 className="mr-2 h-5 w-5" />
                            Share
                        </Button>
                    </div>

                    {/* Warning */}
                    <Card className="p-4 bg-warning/10 border-warning/20">
                        <p className="text-sm text-warning text-center">
                            Only send Canton Coin (CC) or supported tokens to this address.
                            Sending other tokens may result in permanent loss.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Receive;