"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Fingerprint, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BiometricPromptProps {
    isOpen: boolean;
    isLoading: boolean;
    error?: string | null;
    onCancel: () => void;
    onRetry?: () => void;
}

export function BiometricPrompt({
    isOpen,
    isLoading,
    error,
    onCancel,
    onRetry,
}: BiometricPromptProps) {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-sm p-8 space-y-6 bg-card border-border shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col items-center space-y-4">
                    {/* Icon */}
                    <div className="relative">
                        {isLoading ? (
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                            </div>
                        ) : error ? (
                            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertCircle className="h-10 w-10 text-destructive" />
                            </div>
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                                <Fingerprint className="h-10 w-10 text-primary" />
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-foreground text-center">
                        {error ? "Authentication Failed" : "Biometric Authentication"}
                    </h3>

                    {/* Message */}
                    <p className="text-sm text-muted-foreground text-center">
                        {error
                            ? error
                            : isLoading
                                ? "Verifying your identity..."
                                : "Use your fingerprint, face, or device PIN to continue"}
                    </p>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                    {error && onRetry && (
                        <Button
                            onClick={onRetry}
                            className="w-full h-10 rounded-full bg-gradient-to-r from-primary to-primary/60 hover:opacity-90 text-primary-foreground"
                        >
                            Try Again
                        </Button>
                    )}
                    <Button
                        onClick={onCancel}
                        variant="outline"
                        className="w-full h-10 rounded-full"
                    >
                        Cancel
                    </Button>
                </div>
            </Card>
        </div>
    );
}
