"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Tag as TagIcon, Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CANTON_CONFIG } from "@/lib/canton";

const TagPage = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [tagName, setTagName] = useState("");
    const [existingTag, setExistingTag] = useState<string | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth");
        } else if (status === "authenticated") {
            checkExistingTag();
        }
    }, [status]);

    const checkExistingTag = async () => {
        try {
            const data: any = await api.tags.get();
            if (data.tag_name) {
                setExistingTag(data.tag_name);
            }
        } catch (error) {
            console.error("Error checking tag:", error);
        }
    };

    const handlePurchaseTag = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!tagName || tagName.length < 3 || tagName.length > 20) {
            toast.error("Tag name must be between 3 and 20 characters");
            return;
        }

        if (!/^[a-z0-9_]+$/i.test(tagName)) {
            toast.error("Tag name can only contain letters, numbers, and underscores");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/shop/buy-tag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // @ts-ignore
                    userId: session?.user?.id,
                    tagName
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Purchase failed');
            }

            toast.success("Tag purchased successfully!");
            setExistingTag(data.tagName);
            // Redirect to dashboard to see countdown
            setTimeout(() => router.push('/dashboard'), 1500);
        } catch (error: any) {
            toast.error(error.message || "Purchase failed");
        } finally {
            setLoading(false);
        }
    };

    const TREASURY_ADDRESS = CANTON_CONFIG.treasuryAddress;

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Loading...</p>
            </div>
        );
    }

    if (existingTag) {
        return (
            <div className="min-h-screen bg-background pb-20">
                <div className="w-full max-w-md mx-auto p-4">
                    <div className="flex items-center mb-6">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <h1 className="text-xl font-bold text-foreground">Your Tag</h1>
                    </div>

                    <div className="flex flex-col items-center justify-center space-y-6 mt-12">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                            <TagIcon className="h-12 w-12 text-primary" />
                        </div>

                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-foreground mb-2">You have a tag!</h2>
                            <p className="text-muted-foreground">Your unique identifier on SwapaWallet</p>
                        </div>

                        <Card className="p-6 bg-card border-border w-full">
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-mono font-bold text-primary">@{existingTag}</span>
                                <Check className="h-5 w-5 text-green-500" />
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="w-full max-w-md mx-auto p-4">
                <div className="flex items-center mb-6">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2 hover:scale-105 transition-all duration-300">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-bold text-foreground">Purchase Tag</h1>
                </div>

                <form onSubmit={handlePurchaseTag} className="space-y-6">
                    <Card className="p-4 bg-secondary/20 border-border">
                        <div className="space-y-2">
                            <h3 className="font-semibold text-foreground">Tag Purchase</h3>
                            <p className="text-sm text-muted-foreground">
                                Cost: <span className="text-primary font-semibold">$2.50 USDT</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Your tag will be prefixed with "Swapa_"
                            </p>
                        </div>
                    </Card>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Tag Name</label>
                        <Input
                            placeholder="username"
                            value={tagName}
                            onChange={(e) => setTagName(e.target.value)}
                            maxLength={20}
                            className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                            Final tag: Swapa_{tagName || "username"}
                        </p>
                    </div>



                    <Button
                        type="submit"
                        className="w-full h-10 py-1.5 bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300 rounded-xl"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Purchasing...
                            </>
                        ) : (
                            "Purchase Tag ($2.50 USDT)"
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default TagPage;
