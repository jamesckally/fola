"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KeyRound, AlertCircle, Mail, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AuthContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [emailLoading, setEmailLoading] = useState(false);

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/dashboard");
        }
    }, [status, router]);

    useEffect(() => {
        const errorType = searchParams.get("error");
        if (errorType === "AccessDenied") {
            setError("Sorry, your Gmail is not on the whitelist. You can contact Swapa support.");
        }
    }, [searchParams]);

    const handleGoogleSignIn = () => {
        signIn("google", { callbackUrl: "/dashboard" });
    };

    const handlePhraseLogin = () => {
        router.push("/recover");
    };

    const handleEmailSignIn = async () => {
        if (!email || !email.includes("@")) {
            setError("Please enter a valid email address");
            return;
        }

        setEmailLoading(true);
        setError(null);

        try {
            const result = await signIn("email", {
                email: email.trim(),
                redirect: false,
            });

            if (result?.error) {
                setError(result.error === "AccessDenied"
                    ? "This email is not whitelisted. Please contact support."
                    : "Sign in failed. Please try again.");
            } else if (result?.ok) {
                router.push("/dashboard");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setEmailLoading(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-full max-w-md p-8 space-y-6">
                    <Card className="p-6 space-y-6">
                        <div className="text-center">Loading...</div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
                <Card className="p-8 space-y-8 bg-card border-border shadow-2xl">
                    <div className="space-y-2 text-center">
                        <h2 className="text-3xl font-bold text-foreground">Sign In / Sign Up</h2>
                        <p className="text-muted-foreground">
                            Welcome to SwapaWallet
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-4">
                        <Button
                            onClick={handleGoogleSignIn}
                            className="w-full h-10 rounded-full bg-gradient-to-r from-primary to-primary/60 hover:opacity-90 text-primary-foreground text-base font-medium"
                        >
                            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Continue with Google
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-muted" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">
                                    Or continue with email
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Input
                                type="email"
                                placeholder="Enter your whitelisted Gmail"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError(null);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleEmailSignIn();
                                    }
                                }}
                                className="h-10"
                                disabled={emailLoading}
                            />
                            <Button
                                onClick={handleEmailSignIn}
                                className="w-full h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 hover:opacity-90 text-white text-base font-medium"
                                disabled={emailLoading}
                            >
                                {emailLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="mr-2 h-5 w-5" />
                                        Sign In with Email
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-muted" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">
                                    Or
                                </span>
                            </div>
                        </div>

                        <Button
                            onClick={handlePhraseLogin}
                            className="w-full h-10 rounded-full bg-gradient-to-r from-secondary to-secondary/60 hover:opacity-90 text-secondary-foreground text-base font-medium"
                        >
                            <KeyRound className="mr-2 h-5 w-5" />
                            Phrase Key Login
                        </Button>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                        By continuing, you agree to our Terms of Service and Privacy Policy
                    </p>
                </Card>
            </div>
        </div>
    );
};

const Auth = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuthContent />
        </Suspense>
    );
};

export default Auth;
