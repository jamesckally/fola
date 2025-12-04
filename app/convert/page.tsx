"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, RefreshCw, Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CANTON_CONFIG } from "@/lib/canton";

const ConvertPage = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [txHash, setTxHash] = useState("");
    const [step, setStep] = useState<'info' | 'verify'>('info');

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth");
        }
    }, [status]);

    const handleConvert = async () => {
        setLoading(true);
        try {
            // Call API to perform the conversion (send 10 CC)
            const response = await fetch('/api/convert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'convert' })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Conversion failed');
            }

            setTxHash(data.txHash);
            setStep('verify');
            toast.success("Payment sent! Verifying conversion...");

            // Auto-verify after a short delay
            setTimeout(() => handleVerify(data.txHash), 2000);

        } catch (error: any) {
            toast.error(error.message || "Conversion failed");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (hash: string) => {
        setVerifying(true);
        try {
            const response = await fetch('/api/convert/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ txHash: hash })
            });


            const TREASURY_ADDRESS = CANTON_CONFIG.treasuryAddress;

            if (status === "loading") {
                return (
                    <div className="flex items-center justify-center h-screen">
                        <p>Loading...</p>
                    </div>
                );
            }

            return (
                <div className="min-h-screen bg-background pb-20">
                    <div className="w-full max-w-md mx-auto p-4">
                        <div className="flex items-center mb-6">
                            <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                            <h1 className="text-xl font-bold text-foreground">Convert Rewards</h1>
                        </div>

                        {step === 'info' && (
                            <div className="space-y-6">
                                <Card className="p-4 bg-secondary/20 border-border">
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-foreground">Reward Conversion</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Convert your accumulated points into Canton Coin.
                                        </p>
                                        <div className="flex items-center justify-between mt-4 p-3 bg-background/50 rounded-lg">
                                            <span className="text-sm">Cost</span>
                                            <span className="font-bold text-primary">10 CC</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            This will reset your 5-day reward cycle.
                                        </p>
                                    </div>
                                </Card>

                                <Card className="p-4 bg-card border-border">
                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground">Treasury Address</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-mono text-xs break-all flex-1">{TREASURY_ADDRESS}</p>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(TREASURY_ADDRESS);
                                                    toast.success("Address copied!");
                                                }}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>

                                <Button
                                    onClick={handleConvert}
                                    className="w-full h-12 rounded-full bg-gradient-to-r from-secondary to-secondary/60 hover:opacity-90 text-secondary-foreground text-lg"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        "Pay 10 CC & Convert"
                                    )}
                                </Button>
                            </div>
                        )}

                        {step === 'verify' && (
                            <div className="space-y-6">
                                <Card className="p-4 bg-success/10 border-success/20">
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-success">Payment Sent!</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Your payment is being verified on the Canton Network.
                                        </p>
                                    </div>
                                </Card>

                                <Card className="p-4 bg-card border-border">
                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground">Transaction Hash</p>
                                        <p className="font-mono text-xs break-all">{txHash}</p>
                                    </div>
                                </Card>

                                <a
                                    href={`https://www.cantonscan.com/tx/${txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
                                >
                                    View on CantonScan
                                    <ExternalLink className="h-4 w-4" />
                                </a>

                                <Button
                                    onClick={() => handleVerify(txHash)}
                                    className="w-full h-10 py-1.5 rounded-full bg-gradient-to-r from-primary to-primary/60 hover:opacity-90 text-primary-foreground"
                                    disabled={verifying}
                                >
                                    {verifying ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        "Check Status"
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            );
        };

        export default ConvertPage;