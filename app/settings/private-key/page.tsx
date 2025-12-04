"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Copy, ShieldAlert, Key, Check } from "lucide-react";
import { toast } from "sonner";

const PrivateKeyPage = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    const [privateKey, setPrivateKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth");
        } else if (status === "authenticated") {
            fetchPrivateKey();
        }
    }, [status]);

    const fetchPrivateKey = async () => {
        try {
            const res = await fetch('/api/settings/private-key');
            if (res.ok) {
                const data = await res.json();
                setPrivateKey(data.privateKey);
            } else {
                toast.error("Failed to load private key");
            }
        } catch (error) {
            console.error("Error fetching private key:", error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (privateKey) {
            navigator.clipboard.writeText(privateKey);
            setCopied(true);
            toast.success("Private key copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    const words = privateKey ? privateKey.split(' ') : [];

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="w-full max-w-md mx-auto p-4">
                {/* Header */}
                <div className="flex items-center mb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="mr-2 hover:scale-105 transition-all duration-300"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-bold text-foreground">Private Key</h1>
                </div>

                {/* Warning Card */}
                <Card className="p-4 bg-red-500/10 border-red-500/20 mb-6">
                    <div className="flex items-start gap-3">
                        <ShieldAlert className="h-6 w-6 text-red-500 shrink-0 mt-1" />
                        <div>
                            <h3 className="font-bold text-red-500 mb-1">Security Warning</h3>
                            <p className="text-sm text-red-500/90">
                                Never share your private key or seed phrase with anyone. Anyone with this key can access your funds.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Private Key Card */}
                <Card className="p-6 bg-gradient-to-br from-[#00ff9d]/20 via-[#00d9ff]/20 to-purple-500/20 border-none shadow-xl rounded-3xl mb-6 relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00ff9d]/30 to-transparent rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#00d9ff]/30 to-transparent rounded-full blur-2xl"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Key className="h-5 w-5 text-[#00ff9d]" />
                            <span className="text-sm text-muted-foreground">Your Private Key</span>
                        </div>

                        {/* Grid Display */}
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            {words.map((word, index) => (
                                <div key={index} className="bg-background/50 backdrop-blur-sm rounded-lg p-2 text-center border border-white/5">
                                    <span className="text-xs text-muted-foreground block mb-1">{index + 1}</span>
                                    <span className="font-medium text-foreground text-sm">{word}</span>
                                </div>
                            ))}
                        </div>

                        <Button
                            onClick={handleCopy}
                            className="w-full bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300 rounded-xl h-12"
                        >
                            {copied ? (
                                <>
                                    <Check className="mr-2 h-5 w-5" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="mr-2 h-5 w-5" />
                                    Copy Private Key
                                </>
                            )}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PrivateKeyPage;
