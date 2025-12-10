"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loading } from "@/components/Loading";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Tag, PartyPopper, Copy, Plus, Eye, EyeOff, Check, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/BottomNav";

interface TokenBalance {
    token_type: string;
    balance: number;
}

const DashboardContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    const [internalBalance, setInternalBalance] = useState(0);
    const [rewardPoints, setRewardPoints] = useState(0);
    const [userTag, setUserTag] = useState<string | null>(null);
    const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'not-synced'>('syncing');
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Deposit State
    const [showDepositDialog, setShowDepositDialog] = useState(false);
    const [depositTxHash, setDepositTxHash] = useState("");
    const [verifyingDeposit, setVerifyingDeposit] = useState(false);
    const [balanceHidden, setBalanceHidden] = useState(false);
    const [hasDeposited, setHasDeposited] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState("");

    // Global countdown end date - 6 days 3 hours from 2025-12-10 15:07:49 +01:00
    const GLOBAL_COUNTDOWN_END = new Date('2025-12-16T18:07:49+01:00');

    // Success Dialog State
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    // Treasury Address for deposits
    const TREASURY_ADDRESS = "331ad0da16421f0d8046d864c745ad72::12203ca3910059e9ef2795c9bacfd2e2316e6f42db57d8965ff2dce0392a37f3e5a4";

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth");
        } else if (status === "authenticated") {
            // Check if user has a wallet
            // @ts-ignore
            if (!session?.user?.walletAddress) {
                router.push("/setup-wallet");
                return;
            }

            loadData();
        }
    }, [status, session]);

    // Reload data when page becomes visible (e.g., returning from tag purchase)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && status === "authenticated") {
                loadData();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [status]);

    // Check if user has deposited based on balance (persists across refreshes)
    useEffect(() => {
        if (internalBalance >= 200 && !userTag) {
            setHasDeposited(true);
        }
    }, [internalBalance, userTag]);

    const loadData = async () => {
        try {
            setSyncStatus('syncing');
            // Fetch internal balance and rewards
            const response = await fetch('/api/wallet/balance');
            if (response.ok) {
                const data = await response.json();
                setInternalBalance(data.internalBalance || 0);
                setRewardPoints(data.rewardPoints || 0);
            } else {
                throw new Error('Failed to fetch balance');
            }

            const tagData: any = await api.tags.get();
            if (tagData.tag_name) {
                setUserTag(tagData.tag_name);
                setHasDeposited(true); // User has deposited if they have a tag
            }
            setSyncStatus('synced');
        } catch (error) {
            console.error("Error loading data:", error);
            setSyncStatus('not-synced');
        } finally {
            setLoading(false);
        }
    };

    // Auto-retry effect
    useEffect(() => {
        if (syncStatus === 'not-synced') {
            retryTimeoutRef.current = setTimeout(() => {
                loadData();
            }, 3000); // Retry every 3 seconds
        }

        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, [syncStatus]);

    // Global countdown timer effect
    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date();
            const diff = GLOBAL_COUNTDOWN_END.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeRemaining("Expired");
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleDeposit = async () => {
        if (!depositTxHash) {
            toast.error("Please enter transaction hash");
            return;
        }

        setVerifyingDeposit(true);
        try {
            const res = await fetch('/api/deposits/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ txHash: depositTxHash })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Verification failed');

            // toast.success(`Deposit verified! Credited ${data.newBalance - internalBalance} CC`);
            setInternalBalance(data.newBalance);
            setShowDepositDialog(false);
            setDepositTxHash("");
            setHasDeposited(true); // Mark that user has successfully deposited
            setShowSuccessDialog(true); // Show success popup
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setVerifyingDeposit(false);
        }
    };

    const copyTagName = () => {
        if (userTag) {
            navigator.clipboard.writeText(userTag);
            toast.success("Tag name copied!");
        }
    };

    // Mock exchange rate
    const CC_RATE = 0.077;
    const totalBalance = internalBalance * CC_RATE;

    if (status === "loading" || loading) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen bg-background pb-24 relative">
            {/* Processing Overlay */}
            {verifyingDeposit && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="relative mb-8">
                        {/* Outer rotating ring */}
                        <div className="w-32 h-32 rounded-full border-4 border-transparent border-t-[#00ff9d] border-r-[#00d9ff] animate-spin"></div>
                        {/* Inner rotating ring (reverse) */}
                        <div className="absolute top-2 left-2 w-28 h-28 rounded-full border-4 border-transparent border-b-purple-500 border-l-pink-500 animate-spin-reverse"></div>
                        {/* Center glowing orb */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00ff9d] to-[#00d9ff] blur-md animate-pulse"></div>
                            <div className="absolute top-0 left-0 w-16 h-16 rounded-full bg-gradient-to-br from-[#00ff9d] to-[#00d9ff] opacity-50"></div>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] bg-clip-text text-transparent animate-pulse">
                        Verifying Transaction...
                    </h2>
                    <p className="text-muted-foreground mt-2">Please wait while we confirm your deposit</p>
                </div>
            )}

            <div className="w-full max-w-md mx-auto">
                {/* Header */}
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 relative">
                            <Image
                                src="/newlogo.png"
                                alt="SwapaWallet Logo"
                                width={32}
                                height={32}
                                className="object-contain"
                            />
                        </div>
                        <span className="font-bold text-lg text-foreground">Swapa</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {userTag ? (
                            <button
                                onClick={copyTagName}
                                className="flex items-center gap-1 bg-secondary/10 px-3 py-1.5 rounded-full text-secondary text-xs font-medium hover:bg-secondary/20 transition-colors"
                            >
                                <span>@{userTag}</span>
                                <Copy className="h-3 w-3" />
                            </button>
                        ) : (
                            <span className="text-xs text-muted-foreground">No tag</span>
                        )}
                    </div>
                </div>

                {/* Wallet Overview */}
                <div className="px-4 mb-6">
                    <Card className="p-6 bg-[#1a1f2e] border-none text-white shadow-lg rounded-2xl relative overflow-hidden">
                        {/* Synced indicator - moved to top right */}
                        <div className="absolute top-4 right-4">
                            {syncStatus === 'synced' && (
                                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md shadow-[0_0_15px_rgba(0,255,157,0.1)]">
                                    <div className="bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] rounded-full p-0.5">
                                        <Check className="h-2.5 w-2.5 text-black" strokeWidth={4} />
                                    </div>
                                    <span className="text-[10px] font-bold tracking-widest uppercase bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] bg-clip-text text-transparent">
                                        Synced
                                    </span>
                                </div>
                            )}
                            {syncStatus === 'syncing' && (
                                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                                    <Loader2 className="h-3 w-3 text-[#00ff9d] animate-spin" />
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-white/70">
                                        Syncing...
                                    </span>
                                </div>
                            )}
                            {syncStatus === 'not-synced' && (
                                <div className="flex items-center gap-1.5 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 backdrop-blur-md">
                                    <XCircle className="h-3 w-3 text-red-500" />
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-red-500">
                                        Not Synced
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-sm">Wallet overview</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setBalanceHidden(!balanceHidden)}
                                    className="h-6 w-6 hover:bg-white/10 transition-colors"
                                >
                                    {balanceHidden ? (
                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-400" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-4xl font-bold mb-1">
                                        {balanceHidden ? "••••••" : `$${totalBalance.toFixed(2)}`}
                                    </h1>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[#00ff9d] text-sm">+0.00%</span>
                                    <span className="text-gray-400 text-sm">24h</span>
                                </div>
                            </div>
                            <div className="text-right">
                                {userTag && timeRemaining && timeRemaining !== "Expired" ? (
                                    <div className="bg-background/50 backdrop-blur-sm rounded-lg px-2 py-1 border border-[#00ff9d]/30">
                                        <div className="text-[10px] text-muted-foreground mb-0.5">Rewards Ending In</div>
                                        <div className="text-xs font-bold bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] bg-clip-text text-transparent">
                                            {timeRemaining}
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => hasDeposited ? router.push('/tag') : setShowDepositDialog(true)}
                                        className="bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300 rounded-xl px-6 h-10"
                                    >
                                        {hasDeposited ? (
                                            <>
                                                <Tag className="mr-2 h-4 w-4" />
                                                Get Tag
                                            </>
                                        ) : (
                                            "Fund"
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="px-4 mb-8 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            onClick={() => router.push("/send")}
                            className="bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300 rounded-xl h-12"
                        >
                            <ArrowUp className="mr-2 h-5 w-5" />
                            Send
                        </Button>
                        <Button
                            onClick={() => router.push("/receive")}
                            className="bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300 rounded-xl h-12"
                        >
                            <ArrowDown className="mr-2 h-5 w-5" />
                            Receive
                        </Button>
                    </div>
                </div>

                {/* My Tokens - Beautiful Gradient Card */}
                <div className="px-4">
                    <Card className="p-6 bg-gradient-to-br from-[#00ff9d]/20 via-[#00d9ff]/20 to-purple-500/20 border-none shadow-xl rounded-3xl mb-4 relative overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00ff9d]/30 to-transparent rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#00d9ff]/30 to-transparent rounded-full blur-2xl"></div>

                        <div className="relative z-10">
                            <h2 className="text-lg font-bold mb-4 bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] bg-clip-text text-transparent">My Tokens</h2>

                            <div className="space-y-1">
                                {/* Canton Coin */}
                                <div
                                    onClick={() => router.push('/canton')}
                                    className="bg-background/50 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-background/70 transition-all duration-300 hover:scale-[1.02]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden shadow-lg">
                                            <Image
                                                src="/newcanton.png"
                                                alt="Canton Coin"
                                                width={32}
                                                height={32}
                                                className="object-cover"
                                            />
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm text-foreground">Canton</div>
                                            <div className="text-xs text-muted-foreground">CC</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-base text-foreground">
                                            {internalBalance.toFixed(6)}
                                        </div>
                                        <div className="text-xs text-[#00ff9d] font-normal">
                                            +0.00% ${(internalBalance * CC_RATE).toFixed(3)}
                                        </div>
                                    </div>
                                </div>

                                {/* USDCx */}
                                <div
                                    onClick={() => router.push('/usdcx')}
                                    className="bg-background/50 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-background/70 transition-all duration-300 hover:scale-[1.02]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden shadow-lg">
                                            <Image
                                                src="/sbc-icon.png"
                                                alt="CUSD"
                                                width={32}
                                                height={32}
                                                className="object-cover"
                                            />
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm text-foreground">CUSD</div>
                                            <div className="text-xs text-muted-foreground">CUSD</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-base text-foreground">
                                            0
                                        </div>
                                        <div className="text-xs text-[#00ff9d] font-normal">
                                            +0.00% $1.000
                                        </div>
                                    </div>
                                </div>

                                {/* Stable Coin */}
                                <div
                                    onClick={() => router.push('/stable-coin')}
                                    className="bg-background/50 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-background/70 transition-all duration-300 hover:scale-[1.02]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden shadow-lg">
                                            <Image
                                                src="/stable.svg"
                                                alt="Stable Coin"
                                                width={32}
                                                height={32}
                                                className="object-cover"
                                            />
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm text-foreground">Stable Coin</div>
                                            <div className="text-xs text-muted-foreground">SBC</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-base text-foreground">
                                            0
                                        </div>
                                        <div className="text-xs text-[#00ff9d] font-normal">
                                            +0.00% $1.000
                                        </div>
                                    </div>
                                </div>

                                {/* Reward Points */}
                                <div
                                    onClick={() => router.push('/rewards')}
                                    className="bg-background/50 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-background/70 transition-all duration-300 hover:scale-[1.02]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-[#00d9ff] flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                            R
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm text-foreground">Rewards</div>
                                            <div className="text-xs text-muted-foreground">Points</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-base text-foreground">{rewardPoints}</div>
                                        <div className="text-xs text-muted-foreground">Tap to convert</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Deposit Dialog Trigger */}
                <div className="fixed bottom-24 right-4">
                    <Button
                        onClick={() => setShowDepositDialog(true)}
                        size="icon"
                        className="rounded-full h-12 w-12 bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </div>

                {/* Deposit Dialog */}
                <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Deposit Canton Coin</DialogTitle>
                            <DialogDescription>
                                Send 30 CC to the treasury address below to receive 200 CC.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Treasury Address</label>
                                <div className="bg-secondary/10 p-3 rounded-lg font-mono text-xs break-all flex items-center justify-between gap-2 border border-secondary/20">
                                    <span>{TREASURY_ADDRESS}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 hover:scale-105 transition-all duration-300"
                                        onClick={() => {
                                            navigator.clipboard.writeText(TREASURY_ADDRESS);
                                            toast.success("Address copied!");
                                        }}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Transaction Hash</label>
                                <Input
                                    placeholder="Enter transaction hash..."
                                    value={depositTxHash}
                                    onChange={(e) => setDepositTxHash(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={handleDeposit}
                                className="w-full bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300 rounded-xl"
                                disabled={verifyingDeposit}
                            >
                                {verifyingDeposit ? "Verifying..." : "Verify Deposit"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Success Dialog */}
                <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                    <DialogContent className="bg-transparent border-none shadow-none p-0 max-w-sm">
                        <Card className="p-6 bg-gradient-to-br from-[#00ff9d]/20 via-[#00d9ff]/20 to-purple-500/20 border-none shadow-xl rounded-3xl relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00ff9d]/30 to-transparent rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#00d9ff]/30 to-transparent rounded-full blur-2xl"></div>

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#00ff9d] to-[#00d9ff] rounded-full flex items-center justify-center mb-4 shadow-lg animate-bounce">
                                    <PartyPopper className="h-8 w-8 text-black" />
                                </div>

                                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] bg-clip-text text-transparent">
                                    Deposit Verified!
                                </h2>

                                <p className="text-foreground mb-4 font-medium">
                                    You have been successfully credited 200 CC for your internal transaction.
                                </p>

                                <p className="text-sm text-muted-foreground mb-6">
                                    Your deposit is now under review, and you will continue to earn rewards during this period.
                                </p>

                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-6 w-full text-left">
                                    <div className="flex items-start gap-2">
                                        <span className="text-xl">⚠️</span>
                                        <div>
                                            <p className="text-yellow-500 font-bold text-sm mb-1">Important:</p>
                                            <p className="text-yellow-500/90 text-xs">
                                                Please ensure that you submitted the correct and authentic transaction hash, or you may lose your reward.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => setShowSuccessDialog(false)}
                                    className="w-full bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300 rounded-xl h-12"
                                >
                                    Awesome!
                                </Button>
                            </div>
                        </Card>
                    </DialogContent>
                </Dialog>
            </div>
            <BottomNav />
        </div>
    );
};

const Dashboard = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DashboardContent />
        </Suspense>
    );
};

export default Dashboard;