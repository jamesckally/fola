"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, AlertTriangle, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useBiometric } from "@/hooks/useBiometric";
import { BiometricPrompt } from "@/components/BiometricPrompt";

const SetupWallet = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [mnemonic, setMnemonic] = useState<string[]>([]);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const generatingRef = useRef(false); // Use ref to prevent double-firing in Strict Mode
    const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
    const [biometricError, setBiometricError] = useState<string | null>(null);
    const { isAvailable, isRegistered, authenticate, register } = useBiometric();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth");
        } else if (status === "authenticated" && !generatingRef.current) {
            generatingRef.current = true;
            generateWallet();
        }
    }, [status]);

    const generateWallet = async () => {
        try {
            setLoading(true);
            const data: any = await api.wallet.generate();
            if (data.mnemonic) {
                setMnemonic(data.mnemonic.split(" "));
            }
        } catch (err: any) {
            console.error("Error generating wallet:", err);
            if (err.message === "Wallet already exists") {
                router.push("/dashboard");
            } else {
                setError(err.message || "Failed to generate wallet");
            }
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(mnemonic.join(" "));
        toast.success("Recovery phrase copied to clipboard");
    };

    const handleContinue = async () => {
        if (!saved) return;

        setBiometricError(null);

        // Check if biometric is available
        if (isAvailable) {
            const userEmail = session?.user?.email || "";

            // If not registered, register first
            if (!isRegistered && userEmail) {
                setShowBiometricPrompt(true);
                const registerResult = await register(userEmail);

                if (!registerResult.success) {
                    setShowBiometricPrompt(false);
                    setBiometricError(registerResult.error || "Failed to register biometric");
                    // Allow user to continue without biometric
                    router.push("/verify-phrase");
                    return;
                }
            }

            // Authenticate with biometric
            setShowBiometricPrompt(true);
            const authResult = await authenticate();
            setShowBiometricPrompt(false);

            if (!authResult.success) {
                setBiometricError(authResult.error || "Biometric authentication failed");
                return;
            }
        }

        // Proceed to verification page
        router.push("/verify-phrase");
    };

    const handleBiometricCancel = () => {
        setShowBiometricPrompt(false);
        setBiometricError("Biometric authentication cancelled");
    };

    const handleBiometricRetry = async () => {
        setBiometricError(null);
        setShowBiometricPrompt(true);
        const authResult = await authenticate();
        setShowBiometricPrompt(false);

        if (!authResult.success) {
            setBiometricError(authResult.error || "Biometric authentication failed");
        } else {
            router.push("/verify-phrase");
        }
    };

    if (status === "loading" || (loading && mnemonic.length === 0)) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Generating your secure wallet...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 flex items-center justify-center">
            <div className="w-full max-w-2xl space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-foreground">Secure Your Wallet</h1>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Write down your 12-word recovery phrase. This is the only way to recover your wallet if you lose access.
                    </p>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Card className="p-6 bg-card border-primary/20 shadow-2xl relative overflow-hidden">
                    {/* Glow effect */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-6">
                        {mnemonic.map((word, index) => (
                            <div key={index} className="relative group">
                                <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-mono border border-border">
                                    {index + 1}
                                </div>
                                <div className="bg-secondary/30 border border-border rounded-lg p-3 text-center font-mono text-sm font-medium hover:bg-secondary/50 transition-colors">
                                    {word}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-center">
                        <Button
                            variant="outline"
                            onClick={copyToClipboard}
                            className="gap-2 hover:bg-secondary/50"
                        >
                            <Copy className="h-4 w-4" />
                            Copy Phrase
                        </Button>
                    </div>
                </Card>

                <div className="space-y-6">
                    <Alert className="bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-500">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Never share this phrase with anyone. Swapa support will never ask for it.
                            If you lose it, your funds are lost forever.
                        </AlertDescription>
                    </Alert>

                    <div className="flex items-center space-x-2 bg-card p-4 rounded-lg border border-border">
                        <Checkbox
                            id="saved"
                            checked={saved}
                            onCheckedChange={(checked) => setSaved(checked as boolean)}
                        />
                        <label
                            htmlFor="saved"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                            I have saved my recovery phrase in a secure location
                        </label>
                    </div>

                    <Button
                        onClick={handleContinue}
                        className="w-full h-10 rounded-full bg-gradient-to-r from-primary to-primary/60 hover:opacity-90 text-primary-foreground text-base font-medium gap-2"
                        disabled={!saved}
                    >
                        Continue
                        <ArrowRight className="h-5 w-5" />
                    </Button>

                    {biometricError && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{biometricError}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <BiometricPrompt
                    isOpen={showBiometricPrompt}
                    isLoading={showBiometricPrompt}
                    error={biometricError}
                    onCancel={handleBiometricCancel}
                    onRetry={biometricError ? handleBiometricRetry : undefined}
                />
            </div>
        </div>
    );
};

export default SetupWallet;
