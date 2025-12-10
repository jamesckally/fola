"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send as SendIcon } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useBiometric } from "@/hooks/useBiometric";
import { BiometricPrompt } from "@/components/BiometricPrompt";

const SendPage = () => {
    const router = useRouter();
    const { data: session } = useSession();
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [memo, setMemo] = useState("");
    const [expiryTime, setExpiryTime] = useState("24h");
    const [useMaxAmount, setUseMaxAmount] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [rewardPointsEarned, setRewardPointsEarned] = useState(0);
    const [maxBalance, setMaxBalance] = useState(0);
    const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
    const [biometricError, setBiometricError] = useState<string | null>(null);
    const { isAvailable, authenticate } = useBiometric(session?.user?.email || "");

    useEffect(() => {
        // Fetch user's balance
        const fetchBalance = async () => {
            try {
                const res = await fetch('/api/wallet/balance');
                if (res.ok) {
                    const data = await res.json();
                    setMaxBalance(data.internalBalance || 0);
                }
            } catch (error) {
                console.error("Error fetching balance:", error);
            }
        };
        fetchBalance();
    }, []);

    useEffect(() => {
        if (useMaxAmount) {
            setAmount(maxBalance.toString());
        }
    }, [useMaxAmount, maxBalance]);

    const totalAmount = Number(amount) || 0;
    const fee = totalAmount * 0.001; // 0.1% fee
    const finalAmount = totalAmount + fee;

    const handleSendClick = async () => {
        if (!recipient || !amount) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (finalAmount > maxBalance) {
            toast.error("Insufficient balance");
            return;
        }

        if (!isAvailable) {
            toast.error("Biometric authentication is not available on this device");
            return;
        }

        // Trigger biometric authentication
        setBiometricError(null);
        setShowBiometricPrompt(true);

        const authResult = await authenticate();
        setShowBiometricPrompt(false);

        if (!authResult.success) {
            setBiometricError(authResult.error || "Biometric authentication failed");
            return;
        }

        // Biometric successful, proceed with send
        await handleSend();
    };

    const handleSend = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/wallet/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient,
                    amount: Number(amount),
                    memo: memo || undefined,
                    expiryTime
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Transfer failed');
            }

            setRewardPointsEarned(data.rewardPoints || 0);
            setShowSuccessDialog(true);
            toast.success("Transfer successful!");

            // Reset form
            setRecipient("");
            setAmount("");
            setMemo("");
            setUseMaxAmount(false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBiometricRetry = async () => {
        setBiometricError(null);
        await handleSendClick();
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="w-full max-w-md mx-auto p-4">
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-full hover:scale-105 transition-all duration-300"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-bold">Send Canton Coin</h1>
                </div>

                {/* Beautiful Gradient Card */}
                <Card className="p-6 bg-gradient-to-br from-[#00ff9d]/20 via-[#00d9ff]/20 to-purple-500/20 border-none shadow-xl rounded-3xl mb-6 relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00ff9d]/30 to-transparent rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#00d9ff]/30 to-transparent rounded-full blur-2xl"></div>

                    <div className="relative z-10 space-y-4">
                        {/* Recipient */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Recipient (Party ID, Email, or @UserTag)</label>
                            <Input
                                placeholder="Enter Party ID, Email, or @UserTag"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                className="bg-background/50 backdrop-blur-sm border-border"
                            />
                        </div>

                        {/* Amount with Max Toggle */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-foreground">Amount (CC)</label>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="max-amount" className="text-xs text-muted-foreground">Use Max</Label>
                                    <Switch
                                        id="max-amount"
                                        checked={useMaxAmount}
                                        onCheckedChange={setUseMaxAmount}
                                    />
                                </div>
                            </div>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => {
                                    setAmount(e.target.value);
                                    setUseMaxAmount(false);
                                }}
                                className="bg-background/50 backdrop-blur-sm border-border"
                            />
                            <p className="text-xs text-muted-foreground">Available: {maxBalance.toFixed(6)} CC</p>
                        </div>

                        {/* Memo */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Memo (Optional)</label>
                            <Input
                                placeholder="Add a note..."
                                value={memo}
                                onChange={(e) => setMemo(e.target.value)}
                                maxLength={100}
                                className="bg-background/50 backdrop-blur-sm border-border"
                            />
                            <p className="text-xs text-muted-foreground">{memo.length}/100 characters</p>
                        </div>

                        {/* Transaction Expiry */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Transaction Expires In</label>
                            <Select value={expiryTime} onValueChange={setExpiryTime}>
                                <SelectTrigger className="bg-background/50 backdrop-blur-sm border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="3h">3 Hours</SelectItem>
                                    <SelectItem value="6h">6 Hours</SelectItem>
                                    <SelectItem value="12h">12 Hours</SelectItem>
                                    <SelectItem value="24h">24 Hours (1 Day)</SelectItem>
                                    <SelectItem value="48h">48 Hours (2 Days)</SelectItem>
                                    <SelectItem value="72h">72 Hours (3 Days)</SelectItem>
                                    <SelectItem value="168h">7 Days</SelectItem>
                                    <SelectItem value="240h">10 Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Total Amount Summary */}
                        <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 space-y-2 border border-border/50">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Amount</span>
                                <span className="font-medium">{totalAmount.toFixed(6)} CC</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Network Fee (0.1%)</span>
                                <span className="font-medium">{fee.toFixed(6)} CC</span>
                            </div>
                            <div className="h-px bg-border/50 my-2"></div>
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-foreground">Total Amount</span>
                                <span className="font-bold text-lg bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] bg-clip-text text-transparent">
                                    {finalAmount.toFixed(6)} CC
                                </span>
                            </div>
                        </div>

                        <Button
                            className="w-full bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300 rounded-xl h-12"
                            onClick={handleSendClick}
                            disabled={loading || !recipient || !amount}
                        >
                            {loading ? (
                                "Sending..."
                            ) : (
                                <>
                                    <SendIcon className="mr-2 h-4 w-4" /> Send CC
                                </>
                            )}
                        </Button>
                    </div>
                </Card>

                <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Transfer Successful!</DialogTitle>
                            <DialogDescription>
                                You have successfully sent {amount} CC to {recipient}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 text-center">
                            <p className="text-success font-bold text-lg">
                                +{rewardPointsEarned} Reward Points Earned!
                            </p>
                        </div>
                        <Button onClick={() => {
                            setShowSuccessDialog(false);
                            router.push('/dashboard');
                        }} className="w-full bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300 rounded-xl">
                            Back to Dashboard
                        </Button>
                    </DialogContent>
                </Dialog>

                <BiometricPrompt
                    isOpen={showBiometricPrompt}
                    isLoading={showBiometricPrompt}
                    error={biometricError}
                    onCancel={() => setShowBiometricPrompt(false)}
                    onRetry={biometricError ? handleBiometricRetry : undefined}
                />
            </div>
        </div>
    );
};

export default SendPage;