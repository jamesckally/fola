"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Settings, Sparkles } from "lucide-react";

const AccountManagementPage = () => {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="w-full max-w-md mx-auto p-4">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/settings")}
                        className="rounded-full hover:scale-105 transition-all duration-300"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-bold">Account Management</h1>
                </div>

                {/* Beautiful Gradient Card */}
                <Card className="p-8 bg-gradient-to-br from-[#00ff9d]/20 via-[#00d9ff]/20 to-purple-500/20 border-none shadow-xl rounded-3xl relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00ff9d]/30 to-transparent rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#00d9ff]/30 to-transparent rounded-full blur-2xl"></div>

                    <div className="relative z-10 space-y-6">
                        {/* 3D Icon Container */}
                        <div className="flex justify-center">
                            <div className="relative">
                                {/* Outer Glow Ring */}
                                <div className="absolute inset-0 bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] rounded-full blur-2xl opacity-50 animate-pulse-slow scale-150"></div>

                                {/* Main Icon Container */}
                                <div className="relative w-24 h-24 bg-gradient-to-br from-[#00ff9d]/20 via-[#00d9ff]/20 to-purple-500/20 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-center animate-float">
                                    {/* Inner Glow */}
                                    <div className="absolute inset-2 bg-gradient-to-br from-[#00ff9d]/10 to-[#00d9ff]/10 rounded-2xl animate-pulse"></div>

                                    {/* Rotating Settings Icon */}
                                    <div className="relative animate-spin-slow">
                                        <Settings className="h-12 w-12 text-[#00ff9d]" strokeWidth={1.5} />
                                    </div>

                                    {/* Sparkle Effect */}
                                    <Sparkles className="absolute top-1 right-1 h-5 w-5 text-[#00d9ff] animate-pulse" />
                                </div>

                                {/* Orbiting Particles */}
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36">
                                    <div className="absolute top-0 left-1/2 w-2 h-2 bg-[#00ff9d] rounded-full animate-orbit"></div>
                                    <div className="absolute top-1/2 right-0 w-2 h-2 bg-[#00d9ff] rounded-full animate-orbit-delayed"></div>
                                    <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-purple-500 rounded-full animate-orbit-delayed-2"></div>
                                </div>
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="text-center space-y-4">
                            {/* Main Title */}
                            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#00ff9d] via-[#00d9ff] to-purple-500 bg-clip-text text-transparent animate-gradient">
                                System Upgrade in Progress…
                            </h2>

                            {/* Subtitle */}
                            <p className="text-base md:text-lg text-muted-foreground font-medium">
                                Canton credential features are being deployed.
                            </p>

                            {/* Loading Bar */}
                            <div className="w-full max-w-xs mx-auto mt-6">
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                                    <div className="h-full bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] rounded-full animate-loading-bar shadow-lg shadow-[#00ff9d]/50"></div>
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="mt-6 p-4 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    We're enhancing your account management experience with advanced Canton Network credentials.
                                    This feature will be available soon. Thank you for your patience! 🚀
                                </p>
                            </div>

                            {/* Back Button */}
                            <Button
                                onClick={() => router.push("/settings")}
                                className="mt-6 w-full bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300 rounded-xl h-12"
                            >
                                <ArrowLeft className="mr-2 h-5 w-5" />
                                Back to Settings
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Custom Animations */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 0.8; }
                }
                @keyframes gradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                @keyframes loading-bar {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
                @keyframes orbit {
                    from { transform: rotate(0deg) translateX(72px) rotate(0deg); }
                    to { transform: rotate(360deg) translateX(72px) rotate(-360deg); }
                }
                @keyframes orbit-delayed {
                    from { transform: rotate(120deg) translateX(72px) rotate(-120deg); }
                    to { transform: rotate(480deg) translateX(72px) rotate(-480deg); }
                }
                @keyframes orbit-delayed-2 {
                    from { transform: rotate(240deg) translateX(72px) rotate(-240deg); }
                    to { transform: rotate(600deg) translateX(72px) rotate(-600deg); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .animate-spin-slow {
                    animation: spin-slow 20s linear infinite;
                }
                .animate-pulse-slow {
                    animation: pulse-slow 4s ease-in-out infinite;
                }
                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient 3s ease infinite;
                }
                .animate-loading-bar {
                    animation: loading-bar 2s ease-in-out infinite;
                }
                .animate-orbit {
                    animation: orbit 10s linear infinite;
                }
                .animate-orbit-delayed {
                    animation: orbit-delayed 10s linear infinite;
                }
                .animate-orbit-delayed-2 {
                    animation: orbit-delayed-2 10s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default AccountManagementPage;
