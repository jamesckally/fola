"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Coins, Ticket } from "lucide-react";
import { toast } from "sonner";

interface TicketPurchaseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    usdtBalance: number;
    onPurchaseSuccess: () => void;
}

const TICKET_RATE = 3; // 3 tickets per $1

export function TicketPurchaseDialog({
    open,
    onOpenChange,
    usdtBalance,
    onPurchaseSuccess,
}: TicketPurchaseDialogProps) {
    const [amount, setAmount] = useState("");
    const [purchasing, setPurchasing] = useState(false);

    const usdtAmount = parseFloat(amount) || 0;
    const ticketsToReceive = Math.floor(usdtAmount * TICKET_RATE);

    const handlePurchase = async () => {
        if (usdtAmount < 1) {
            toast.error("Minimum purchase is $1");
            return;
        }

        if (usdtAmount > usdtBalance) {
            toast.error("Insufficient USDT balance");
            return;
        }

        setPurchasing(true);

        try {
            const response = await fetch('/api/game/tickets/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: usdtAmount }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Purchase failed');
            }

            toast.success(data.message || `Purchased ${ticketsToReceive} tickets!`);
            setAmount("");
            onPurchaseSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setPurchasing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0f1629] border border-[#00ff9d]/30 max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] bg-clip-text text-transparent">
                        🎟️ Purchase Tickets
                    </DialogTitle>
                    <DialogDescription className="text-white/70">
                        Buy spin tickets with USDT. $1 = {TICKET_RATE} tickets
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {/* Balance Display */}
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-white/60 mb-1">Your USDT Balance</div>
                        <div className="text-lg font-bold text-white flex items-center gap-2">
                            <Coins className="h-5 w-5 text-[#00ff9d]" />
                            ${usdtBalance.toFixed(2)}
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="text-sm text-white/70 mb-2 block">
                            Amount (USDT)
                        </label>
                        <Input
                            type="number"
                            min="1"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                        />
                    </div>

                    {/* Preview */}
                    {usdtAmount > 0 && (
                        <div className="bg-gradient-to-r from-[#00ff9d]/10 to-[#00d9ff]/10 rounded-lg p-4 border border-[#00ff9d]/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xs text-white/60 mb-1">You'll Receive</div>
                                    <div className="text-2xl font-bold text-[#00ff9d] flex items-center gap-2">
                                        <Ticket className="h-6 w-6" />
                                        {ticketsToReceive} Tickets
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-white/60 mb-1">Cost</div>
                                    <div className="text-xl font-bold text-white">
                                        ${usdtAmount.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Purchase Button */}
                    <Button
                        onClick={handlePurchase}
                        disabled={purchasing || usdtAmount < 1 || usdtAmount > usdtBalance}
                        className="w-full bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300 rounded-xl h-12"
                    >
                        {purchasing ? "Processing..." : `Purchase ${ticketsToReceive} Tickets`}
                    </Button>

                    {/* Info */}
                    <div className="text-xs text-white/50 text-center">
                        Tickets are added instantly and can be used immediately
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
