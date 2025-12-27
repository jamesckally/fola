"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowUp, ArrowDown, X, Copy, Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";

type Network = 'polygon' | 'bsc';

const USDTPage = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);

    // Deposit state
    const [showDepositDialog, setShowDepositDialog] = useState(false);
    const [depositAddress, setDepositAddress] = useState('');
    const [addressCopied, setAddressCopied] = useState(false);

    // Verify deposit state
    const [showVerifyDialog, setShowVerifyDialog] = useState(false);
    const [verifyTxHash, setVerifyTxHash] = useState('');
    const [verifyNetwork, setVerifyNetwork] = useState<Network>('polygon');
    const [verifying, setVerifying] = useState(false);

    // Withdrawal state
    const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
    const [withdrawNetwork, setWithdrawNetwork] = useState<Network>('polygon');
    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth");
        } else if (status === "authenticated") {
            loadBalance();
            fetchDepositAddress();
        }
    }, [status, router]);

    const loadBalance = async () => {
        try {
            const response = await fetch('/api/wallet/balance');
            if (response.ok) {
                const data = await response.json();
                setBalance(data.usdtBalance || 0);
            }
        } catch (error) {
            console.error("Error loading balance:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepositAddress = async () => {
        try {
            const response = await fetch('/api/user/deposit-address');
            if (response.ok) {
                const data = await response.json();
                if (data.address) {
                    setDepositAddress(data.address);
                } else {
                    // Address is empty, generate one
                    await generateDepositAddress();
                }
            }
        } catch (error) {
            console.error("Error fetching deposit address:", error);
            toast.error("Failed to load deposit address");
        }
    };

    const generateDepositAddress = async () => {
        try {
            const response = await fetch('/api/user/generate-deposit-address', {
                method: 'POST'
            });
            if (response.ok) {
                const data = await response.json();
                setDepositAddress(data.address);
                toast.success("Deposit address generated!");
            }
        } catch (error) {
            console.error("Error generating deposit address:", error);
        }
    };

    const copyAddress = () => {
        navigator.clipboard.writeText(depositAddress);
        setAddressCopied(true);
        toast.success("Address copied!");
        setTimeout(() => setAddressCopied(false), 2000);
    };

    const handleVerifyDeposit = async () => {
        if (!verifyTxHash) {
            toast.error("Please enter transaction hash");
            return;
        }

        setVerifying(true);
        try {
            const response = await fetch('/api/wallet/deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    txHash: verifyTxHash,
                    network: verifyNetwork
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`✅ Deposit verified! +$${data.deposit.amount} USDT`);
                setBalance(data.newBalance);
                setShowVerifyDialog(false);
                setVerifyTxHash('');
            } else {
                toast.error(data.error || 'Verification failed');
            }
        } catch (error) {
            console.error("Verify error:", error);
            toast.error("Failed to verify deposit");
        } finally {
            setVerifying(false);
        }
    };

    const handleWithdraw = async () => {
        if (!withdrawAddress || !withdrawAmount) {
            toast.error("Please fill in all fields");
            return;
        }

        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Invalid amount");
            return;
        }

        if (amount > balance) {
            toast.error("Insufficient balance");
            return;
        }

        setWithdrawing(true);
        try {
            const response = await fetch('/api/wallet/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    network: withdrawNetwork,
                    toAddress: withdrawAddress
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`Withdrawal of $${data.withdrawal.netAmount} initiated!`);
                toast.info(`TX: ${data.withdrawal.transactionHash.substring(0, 10)}...`);
                setBalance(data.newBalance);
                setShowWithdrawDialog(false);
                setWithdrawAddress('');
                setWithdrawAmount('');
            } else {
                toast.error(data.error || 'Withdrawal failed');
            }
        } catch (error) {
            console.error("Withdrawal error:", error);
            toast.error("Failed to process withdrawal");
        } finally {
            setWithdrawing(false);
        }
    };

    if (status === "loading" || loading) {
        return <Loading />;
    }

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
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#26a17b] to-[#50af95] flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-2xl">₮</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">USDT</h1>
                                <p className="text-xs text-muted-foreground">Tether USD</p>
                            </div>
                        </div>

                        {/* Balance */}
                        <div className="text-center mb-3">
                            <p className="text-xs text-muted-foreground mb-1">BALANCE</p>
                            <h2 className="text-2xl font-bold text-foreground mb-1">
                                {balance.toFixed(2)} USDT
                            </h2>
                            <p className="text-lg text-muted-foreground">${balance.toFixed(2)}</p>
                        </div>

                        {/* Price and 24H Change */}
                        <div className="bg-background/50 backdrop-blur-sm rounded-xl p-2 mb-3 grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">PRICE</p>
                                <p className="text-base font-bold text-foreground">$1.0000</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">24H CHANGE</p>
                                <p className="text-base font-bold text-[#00ff9d]">+0.00%</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                onClick={() => setShowWithdrawDialog(true)}
                                className="bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300 rounded-xl h-10 text-xs"
                            >
                                <ArrowUp className="mr-1 h-3 w-3" />
                                Withdraw
                            </Button>
                            <Button
                                onClick={() => setShowDepositDialog(true)}
                                className="bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300 rounded-xl h-10 text-xs"
                            >
                                <ArrowDown className="mr-1 h-3 w-3" />
                                Deposit
                            </Button>
                            <Button
                                onClick={() => setShowVerifyDialog(true)}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg hover:shadow-purple-500/20 hover:scale-105 transition-all duration-300 rounded-xl h-10 text-xs"
                            >
                                <Check className="mr-1 h-3 w-3" />
                                Verify
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

            {/* Deposit Dialog */}
            <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Deposit USDT</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Auto-detect notice */}
                        <div className="bg-gradient-to-r from-[#00ff9d]/10 to-[#00d9ff]/10 border border-[#00ff9d]/20 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-[#00ff9d]">
                                <Sparkles className="h-4 w-4" />
                                <p className="text-sm font-medium">Automatic Detection Enabled!</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Just send USDT to your address below. Your balance will update automatically within 2 minutes.
                            </p>
                        </div>

                        {/* Deposit Address */}
                        <div>
                            <Label>Your Unique Deposit Address</Label>
                            <p className="text-xs text-muted-foreground mb-2">
                                Works on both Polygon and BSC networks
                            </p>

                            {/* QR Code */}
                            {depositAddress && (
                                <div className="flex justify-center mb-3 p-4 bg-white rounded-lg mx-8">
                                    <QRCode value={depositAddress} size={150} />
                                </div>
                            )}

                            {/* Address Input */}
                            <div className="flex gap-2">
                                <Input
                                    value={depositAddress}
                                    readOnly
                                    className="flex-1 font-mono text-xs"
                                />
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={copyAddress}
                                >
                                    {addressCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                            <p className="text-xs font-medium">How to deposit:</p>
                            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                                <li>Copy your deposit address above</li>
                                <li>Send USDT from any wallet or exchange</li>
                                <li>Select <strong>Polygon</strong> or <strong>BSC</strong> network</li>
                                <li>Your balance will update automatically!</li>
                            </ol>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Withdraw Dialog */}
            <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Withdraw USDT</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Network Selection */}
                        <div>
                            <Label>Select Network</Label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <Button
                                    variant={withdrawNetwork === 'polygon' ? 'default' : 'outline'}
                                    onClick={() => setWithdrawNetwork('polygon')}
                                    className="w-full"
                                >
                                    Polygon
                                </Button>
                                <Button
                                    variant={withdrawNetwork === 'bsc' ? 'default' : 'outline'}
                                    onClick={() => setWithdrawNetwork('bsc')}
                                    className="w-full"
                                >
                                    BSC
                                </Button>
                            </div>
                        </div>

                        {/* Withdrawal Address */}
                        <div>
                            <Label>Withdrawal Address</Label>
                            <Input
                                value={withdrawAddress}
                                onChange={(e) => setWithdrawAddress(e.target.value)}
                                placeholder="0x..."
                                className="mt-2 font-mono text-xs"
                            />
                        </div>

                        {/* Amount */}
                        <div>
                            <Label>Amount (USDT)</Label>
                            <Input
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                placeholder="0.00"
                                className="mt-2"
                                step="0.01"
                                min="5"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Available: {balance.toFixed(2)} USDT • Min: $5
                            </p>
                        </div>

                        <Button
                            onClick={handleWithdraw}
                            disabled={withdrawing || !withdrawAddress || !withdrawAmount}
                            className="w-full bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold"
                        >
                            {withdrawing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Withdraw'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Verify Deposit Dialog */}
            <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
                <DialogContent className="bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0f1629] border border-purple-500/30">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Verify Deposit
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                            <p className="text-sm text-white/80">
                                📝 After sending USDT to your deposit address, paste the transaction hash here to verify and credit your balance instantly.
                            </p>
                        </div>

                        <div>
                            <Label className="text-white/90">Network</Label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <Button
                                    type="button"
                                    variant={verifyNetwork === 'polygon' ? 'default' : 'outline'}
                                    onClick={() => setVerifyNetwork('polygon')}
                                    className={verifyNetwork === 'polygon' ? 'bg-purple-500 hover:bg-purple-600' : ''}
                                >
                                    Polygon
                                </Button>
                                <Button
                                    type="button"
                                    variant={verifyNetwork === 'bsc' ? 'default' : 'outline'}
                                    onClick={() => setVerifyNetwork('bsc')}
                                    className={verifyNetwork === 'bsc' ? 'bg-purple-500 hover:bg-purple-600' : ''}
                                >
                                    BSC
                                </Button>
                            </div>
                        </div>

                        <div>
                            <Label className="text-white/90">Transaction Hash</Label>
                            <Input
                                type="text"
                                value={verifyTxHash}
                                onChange={(e) => setVerifyTxHash(e.target.value)}
                                placeholder="0x..."
                                className="mt-2 bg-white/5 border-white/20 text-white"
                            />
                            <p className="text-xs text-white/50 mt-1">
                                Find this in your wallet after sending USDT
                            </p>
                        </div>

                        <Button
                            onClick={handleVerifyDeposit}
                            disabled={verifying || !verifyTxHash}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold"
                        >
                            {verifying ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify Deposit'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default USDTPage;
