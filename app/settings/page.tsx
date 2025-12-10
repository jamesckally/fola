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
    Copy
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
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
                    <DialogContent className="bg-gradient-to-br from-[#00ff9d]/10 via-[#00d9ff]/10 to-purple-500/10 border-border backdrop-blur-xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] bg-clip-text text-transparent">
                                Sign Out?
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground text-base">
                                Are you sure you want to sign out of your account?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex gap-3 mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowSignOutDialog(false)}
                                className="flex-1 h-12 border-border hover:bg-secondary/20 transition-all duration-300"
                            >
                                Stay in App
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowSignOutDialog(false);
                                    handleSignOut();
                                }}
                                className="flex-1 h-12 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-lg hover:shadow-red-500/20 hover:scale-105 transition-all duration-300"
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