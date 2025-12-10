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
    ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useBiometric } from "@/hooks/useBiometric";
import { BiometricPrompt } from "@/components/BiometricPrompt";

const Settings = () => {
    const router = useRouter();
    const { data: session } = useSession();

    const [utxoManagement, setUtxoManagement] = useState(false);
    const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
    const [biometricError, setBiometricError] = useState<string | null>(null);
    const [pendingUtxoValue, setPendingUtxoValue] = useState<boolean | null>(null);
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
                <div className="p-4 flex items-center gap-4 border-b border-border">
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

                <div className="p-4 space-y-4">
                    {/* User Info Card */}
                    <Card className="p-4 bg-card border-border">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                                <span className="text-2xl font-bold text-primary-foreground">
                                    {userEmail.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="font-semibold text-foreground text-lg">{userEmail}</p>
                                <p className="text-sm text-muted-foreground">{shortAddress}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Menu Items */}
                    <div className="space-y-3">
                        {menuItems.map((item, index) => (
                            <Card key={index} className="bg-card border-border">
                                <button
                                    className="w-full flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors rounded-lg"
                                    onClick={item.onClick}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className={`h-6 w-6 ${item.color}`} />
                                        <span className="text-foreground">{item.label}</span>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </button>
                            </Card>
                        ))}
                    </div>

                    {/* UTXO Management */}
                    <Card className="p-4 bg-card border-border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-foreground">UTXO Management</p>
                                <p className="text-sm text-muted-foreground">Optimize transaction outputs</p>
                            </div>
                            <Switch
                                checked={utxoManagement}
                                onCheckedChange={handleUtxoToggle}
                            />
                        </div>
                    </Card>

                    {/* Sign Out Button */}
                    <Button
                        variant="outline"
                        className="w-full mt-6 h-12 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40 transition-all duration-300 group"
                        onClick={handleSignOut}
                    >
                        <div className="flex items-center gap-2 font-semibold">
                            <span>Sign Out</span>
                            <ArrowLeft className="h-4 w-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Button>
                </div>

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