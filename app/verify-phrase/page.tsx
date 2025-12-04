"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, AlertTriangle, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

const VerifyPhrase = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [indices, setIndices] = useState<number[]>([]);
    const [words, setWords] = useState<string[]>(["", ""]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth");
        } else if (status === "authenticated") {
            // Generate 2 random unique indices between 0 and 11
            const newIndices: number[] = [];
            while (newIndices.length < 2) {
                const rand = Math.floor(Math.random() * 12);
                if (!newIndices.includes(rand)) {
                    newIndices.push(rand);
                }
            }
            setIndices(newIndices.sort((a, b) => a - b));
        }
    }, [status]);

    const handleVerify = async () => {
        if (words.some(w => !w.trim())) {
            setError("Please enter both words");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await api.wallet.verify({
                wordIndices: indices,
                providedWords: words.map(w => w.trim().toLowerCase()),
            });

            toast.success("Wallet verified successfully!");

            // Use window.location to force a full page reload
            // This ensures the session is refreshed with the new wallet address
            window.location.href = "/dashboard";
        } catch (err: any) {
            console.error("Verification failed:", err);
            setError(err.message || "Verification failed. Please check your words and try again.");
            setLoading(false);
        }
    };

    if (status === "loading" || indices.length === 0) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 flex items-center justify-center">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Verify Your Phrase</h1>
                    <p className="text-muted-foreground">
                        Please enter the requested words from your recovery phrase to verify you have saved it.
                    </p>
                </div>

                <Card className="p-6 bg-card border-border shadow-xl">
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-6">
                        {indices.map((index, i) => (
                            <div key={index} className="space-y-2">
                                <label className="text-sm font-medium">
                                    Word #{index + 1}
                                </label>
                                <Input
                                    value={words[i]}
                                    onChange={(e) => {
                                        const newWords = [...words];
                                        newWords[i] = e.target.value;
                                        setWords(newWords);
                                        setError(null);
                                    }}
                                    placeholder={`Enter word #${index + 1}`}
                                    className="bg-background"
                                    autoComplete="off"
                                />
                            </div>
                        ))}

                        <Button
                            onClick={handleVerify}
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
                                    Verify & Continue
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default VerifyPhrase;
