"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KeyRound, AlertTriangle, Loader2, ArrowRight, ClipboardPaste } from "lucide-react";
import { toast } from "sonner";
import { useBiometric } from "@/hooks/useBiometric";
import { BiometricPrompt } from "@/components/BiometricPrompt";

const RecoverWallet = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [words, setWords] = useState<string[]>(Array(12).fill(""));
    const [error, setError] = useState<string | null>(null);
    const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
    const [biometricError, setBiometricError] = useState<string | null>(null);
    const [recoveredEmail, setRecoveredEmail] = useState<string | null>(null);
    const { isAvailable, isRegistered, register } = useBiometric();

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (!text) return;

            const pastedWords = text.trim().split(/\s+/);
            if (pastedWords.length === 12) {
                setWords(pastedWords);
                toast.success("Phrase pasted successfully");
            } else {
                toast.error(`Expected 12 words, found ${pastedWords.length}`);
            }
        } catch (err) {
            console.error("Paste error:", err);
            toast.error("Failed to read from clipboard");
        }
    };

    const handleLogin = async () => {
        if (words.some(w => !w.trim())) {
            setError("Please enter all 12 words");
            return;
        }

        setLoading(true);
        setError(null);
        setBiometricError(null);

        try {
            const phrase = words.map(w => w.trim().toLowerCase()).join(" ");

            const result = await signIn("credentials", {
                phrase,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid recovery phrase. Please check and try again.");
                setLoading(false);
            } else if (result?.ok) {
                toast.success("Wallet recovered successfully!");

                // After successful recovery, register biometric if available and not registered
                if (isAvailable && !isRegistered) {
                    // We need to get the user's email from the session
                    // For now, we'll prompt biometric registration
                    setShowBiometricPrompt(true);

                    // Use a placeholder email - in production, fetch from session
                    const userEmail = "user@recovered.wallet";
                    const registerResult = await register(userEmail);
                    setShowBiometricPrompt(false);

                    if (registerResult.success) {
                        toast.success("Biometric registered on this device!");
                    } else {
                        // Don't block login if biometric registration fails
                        setBiometricError(registerResult.error || "Failed to register biometric");
                    }
                }

                // Redirect to dashboard
                router.push("/dashboard");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("An error occurred. Please try again.");
            setLoading(false);
        }
    };

    const handleBiometricCancel = () => {
        setShowBiometricPrompt(false);
        setBiometricError("Biometric registration cancelled");
        // Still proceed to dashboard
        router.push("/dashboard");
    };

    const handleBiometricRetry = async () => {
        setBiometricError(null);
        setShowBiometricPrompt(true);
        const userEmail = "user@recovered.wallet";
        const registerResult = await register(userEmail);
        setShowBiometricPrompt(false);

        if (!registerResult.success) {
            setBiometricError(registerResult.error || "Failed to register biometric");
        } else {
            toast.success("Biometric registered successfully!");
            router.push("/dashboard");
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 flex items-center justify-center">
            <div className="w-full max-w-2xl space-y-8">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <KeyRound className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Access with Phrase Key</h1>
                    <p className="text-muted-foreground">
                        Enter your 12-word recovery phrase to access your wallet.
                    </p>
                </div>

                <Card className="p-6 bg-card border-border shadow-xl">
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex justify-end mb-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePaste}
                            className="gap-2 rounded-full border-primary/20 hover:bg-primary/10 hover:text-primary"
                        >
                            <ClipboardPaste className="h-4 w-4" />
                            Paste Phrase
                        </Button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-8">
                        {words.map((word, index) => (
                            <div key={index} className="relative">
                                <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-mono border border-border z-10">
                                    {index + 1}
                                </div>
                                <Input
                                    value={word}
                                    onChange={(e) => {
                                        const newWords = [...words];
                                        newWords[index] = e.target.value;
                                        setWords(newWords);
                                        setError(null);
                                    }}
                                    className="text-center rounded-xl"
                                    autoComplete="off"
                                />
                            </div>
                        ))}
                    </div>

                    <Button
                        onClick={handleLogin}
                        className="w-full h-10 rounded-full bg-gradient-to-r from-primary to-primary/60 hover:opacity-90 text-primary-foreground text-base font-medium"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            <>
                                Access Wallet
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                        )}
                    </Button>

                    {biometricError && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{biometricError}</AlertDescription>
                        </Alert>
                    )}
                </Card>

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

export default RecoverWallet;
