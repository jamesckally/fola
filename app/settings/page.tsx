"use client";

import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BottomNav } from "@/components/BottomNav";
import { Switch } from "@/components/ui/switch";
import {
    User,
    Key,
    ChevronRight,
    ArrowLeft,
    Copy,
    Users,
    Share2
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useBiometric } from "@/hooks/useBiometric";
import { BiometricPrompt } from "@/components/BiometricPrompt";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const Settings = () => {
    const router = useRouter();
    const { data: session } = useSession();

    const [utxoManagement, setUtxoManagement] = useState(false);
    const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
    const [biometricError, setBiometricError] = useState<string | null>(null);
    const [pendingUtxoValue, setPendingUtxoValue] = useState<boolean | null>(null);
    const [showSignOutDialog, setShowSignOutDialog] = useState(false);
    const { isAvailable, authenticate } = useBiometric(session?.user?.email || "");

    const handleSignOut = async () => {
        try {
            await signOut({ callbackUrl: "/" });
            toast.success("Signed out successfully");
        } catch (error) {
            console.error("Error signing out:", error);
            toast.error("Error signing out");
        }
    };

    const handleUtxoToggle = async (newValue: boolean) => {
        if (!isAvailable) {
            toast.error("Biometric authentication is not available on this device");
            return;
        }

        setPendingUtxoValue(newValue);
        setBiometricError(null);
        setShowBiometricPrompt(true);

        const authResult = await authenticate();
        setShowBiometricPrompt(false);

        if (!authResult.success) {
            setBiometricError(authResult.error || "Biometric authentication failed");
            setPendingUtxoValue(null);
            return;
        }

        // Biometric successful, update UTXO setting
        setUtxoManagement(newValue);
        setPendingUtxoValue(null);
        toast.success(`UTXO Management ${newValue ? 'enabled' : 'disabled'}`);
    };

    const handleBiometricRetry = async () => {
        if (pendingUtxoValue !== null) {
            setBiometricError(null);
            await handleUtxoToggle(pendingUtxoValue);
        }
    };

    // Get user email and wallet address
    const userEmail = session?.user?.email || "user@gmail.com";
    // @ts-ignore
    const walletAddress = session?.user?.walletAddress || "0xaa75...6907";
    const shortAddress = walletAddress.length > 12
        ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
        : walletAddress;

    // Get referral code and generate referral link
    // @ts-ignore
    const [referralCode, setReferralCode] = useState<string>(session?.user?.referralCode || "");
    const [hasTag, setHasTag] = useState<boolean>(false);
    const referralLink = referralCode ? `${window.location.origin}/auth?ref=${referralCode}` : "";

    // Check if user has Swapa Tag
    useEffect(() => {
        const checkTag = async () => {
            try {
                const response = await fetch('/api/user/check-tag');
                if (response.ok) {
                    const data = await response.json();
                    setHasTag(data.hasTag);
                }
            } catch (error) {
                console.error('Error checking tag:', error);
            }
        };
        checkTag();
    }, []);

    // Fetch/generate referral code on mount
    useEffect(() => {
        const fetchReferralCode = async () => {
            try {
                const response = await fetch('/api/user/generate-referral-code');
                if (response.ok) {
                    const data = await response.json();
                    if (data.referralCode) {
                        setReferralCode(data.referralCode);
                    }
                }
            } catch (error) {
                console.error('Error fetching referral code:', error);
            }
        };

        if (!referralCode) {
            fetchReferralCode();
        }
    }, [referralCode]);

    const copyReferralLink = () => {
        navigator.clipboard.writeText(referralLink);
        toast.success("Referral link copied to clipboard!");
    };

    const menuItems = [
        {
            icon: User,
            label: "Account Management",
            onClick: () => router.push("/settings/account"),
            color: "text-primary"
        },
        {
            icon: Key,
            label: "Private Key",
            onClick: () => router.push("/settings/private-key"),
            color: "text-primary"
        },
    ];

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="w-full max-w-md mx-auto">
                {/* Header */}
                <div className="p-4 flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="hover:bg-secondary/50"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-2xl font-bold">Settings</h1>
                </div>

                <div className="p-4">
                    {/* Combined Card - User Info + Features */}
                    <Card className="bg-card border-border overflow-hidden">
                        {/* User Info */}
                        <div className="flex items-center gap-4 p-4 border-b border-border/50">
                            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                                <span className="text-2xl font-bold text-primary-foreground">
                                    {userEmail.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-foreground text-lg">{userEmail}</p>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(walletAddress);
                                        toast.success("Wallet address copied!");
                                    }}
                                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                                >
                                    <span>{shortAddress}</span>
                                    <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            </div>
                        </div>

                        {/* Referral Section - Only show if user has Swapa Tag */}
                        {referralCode && hasTag && (
                            <>
                                {/* Referral Code */}
                                <div className="p-4 border-b border-border/50">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <Users className="h-5 w-5 text-[#00ff9d]" />
                                            <div>
                                                <p className="font-semibold text-foreground">Referral Code</p>
                                                <p className="text-xs text-muted-foreground">Share with friends</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(referralCode);
                                                toast.success("Referral code copied!");
                                            }}
                                            className="px-3 py-1.5 bg-gradient-to-r from-[#00ff9d]/10 to-[#00d9ff]/10 hover:from-[#00ff9d]/20 hover:to-[#00d9ff]/20 rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <span className="text-sm font-bold bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] bg-clip-text text-transparent">
                                                {referralCode}
                                            </span>
                                            <Copy className="h-3.5 w-3.5 text-[#00ff9d]" />
                                        </button>
                                    </div>
                                </div>

                                {/* Referral Link */}
                                <div className="p-4 border-b border-border/50">
                                    <div className="bg-secondary/20 rounded-lg p-2.5 flex items-center gap-2">
                                        <input
                                            readOnly
                                            value={referralLink}
                                            className="flex-1 bg-transparent text-xs text-foreground outline-none"
                                        />
                                        <Button
                                            size="sm"
                                            onClick={copyReferralLink}
                                            className="bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold hover:scale-105 transition-transform h-7 px-3"
                                        >
                                            <Copy className="h-3.5 w-3.5 mr-1.5" />
                                            Copy
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Account Management */}
                        <button
                            className="w-full flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors border-b border-border/50"
                            onClick={() => router.push("/settings/account")}
                        >
                            <div className="flex items-center gap-3">
                                <User className="h-6 w-6 text-primary" />
                                <span className="text-foreground">Account Management</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </button>

                        {/* Private Key */}
                        <button
                            className="w-full flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors border-b border-border/50"
                            onClick={() => router.push("/settings/private-key")}
                        >
                            <div className="flex items-center gap-3">
                                <Key className="h-6 w-6 text-primary" />
                                <span className="text-foreground">Private Key</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </button>

                        {/* UTXO Management */}
                        <div className="flex items-center justify-between p-4 border-b border-border/50">
                            <div>
                                <p className="text-foreground">UTXO Management</p>
                                <p className="text-sm text-muted-foreground">Optimize transaction outputs</p>
                            </div>
                            <Switch
                                checked={utxoManagement}
                                onCheckedChange={handleUtxoToggle}
                            />
                        </div>

                        {/* Sign Out */}
                        <button
                            className="w-full flex items-center justify-between p-4 hover:bg-red-500/10 transition-colors group"
                            onClick={() => setShowSignOutDialog(true)}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-red-500 font-semibold">Sign Out</span>
                            </div>
                            <ArrowLeft className="h-4 w-4 text-red-500 rotate-180 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </Card>
                </div>

                {/* Sign Out Confirmation Dialog */}
                <Dialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
                    <DialogContent className="max-w-sm bg-gradient-to-br from-[#00ff9d]/10 via-[#00d9ff]/10 to-purple-500/10 border-border backdrop-blur-xl p-6">
                        <DialogHeader className="space-y-2">
                            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] bg-clip-text text-transparent">
                                Sign Out?
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground text-sm">
                                Are you sure you want to sign out of your account?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex gap-2 mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowSignOutDialog(false)}
                                className="flex-1 h-10 text-sm border-border hover:bg-secondary/20 transition-all duration-300"
                            >
                                Stay in App
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowSignOutDialog(false);
                                    handleSignOut();
                                }}
                                className="flex-1 h-10 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-lg hover:shadow-red-500/20 hover:scale-105 transition-all duration-300"
                            >
                                Log Out
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <BiometricPrompt
                    isOpen={showBiometricPrompt}
                    isLoading={showBiometricPrompt}
                    error={biometricError}
                    onCancel={() => {
                        setShowBiometricPrompt(false);
                        setPendingUtxoValue(null);
                    }}
                    onRetry={biometricError ? handleBiometricRetry : undefined}
                />

                <BottomNav />
            </div>
        </div>
    );
};

export default Settings;