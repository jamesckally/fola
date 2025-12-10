"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Sparkles } from "lucide-react";

const AccountManagementPage = () => {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Floating Orbs */}
                <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-[#00ff9d]/30 to-transparent rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-[#00d9ff]/30 to-transparent rounded-full blur-3xl animate-float-delayed"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse-slow"></div>

                {/* Rotating Rings */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-[500px] h-[500px] border-2 border-[#00ff9d]/20 rounded-full animate-spin-slow"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border-2 border-[#00d9ff]/20 rounded-full animate-spin-reverse-slow"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border-2 border-purple-500/20 rounded-full animate-spin-slow"></div>
                </div>

                {/* Particle Grid */}
                <div className="absolute inset-0 opacity-20">
                    <div className="grid grid-cols-12 gap-4 h-full p-8">
                        {[...Array(48)].map((_, i) => (
                            <div
                                key={i}
                                className="w-2 h-2 bg-gradient-to-br from-[#00ff9d] to-[#00d9ff] rounded-full animate-pulse"
                                style={{
                                    animationDelay: `${i * 0.1}s`,
                                    opacity: Math.random() * 0.5 + 0.3
                                }}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-2xl mx-auto px-4">
                {/* Back Button */}
                <div className="absolute top-4 left-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/settings")}
                        className="hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </div>

                {/* 3D Icon Container */}
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        {/* Outer Glow Ring */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] rounded-full blur-2xl opacity-50 animate-pulse-slow scale-150"></div>

                        {/* Main Icon Container */}
                        <div className="relative w-32 h-32 bg-gradient-to-br from-[#00ff9d]/20 via-[#00d9ff]/20 to-purple-500/20 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-center animate-float">
                            {/* Inner Glow */}
                            <div className="absolute inset-2 bg-gradient-to-br from-[#00ff9d]/10 to-[#00d9ff]/10 rounded-2xl animate-pulse"></div>

                            {/* Rotating Settings Icon */}
                            <div className="relative animate-spin-slow">
                                <Settings className="h-16 w-16 text-[#00ff9d]" strokeWidth={1.5} />
                            </div>

                            {/* Sparkle Effect */}
                            <Sparkles className="absolute top-2 right-2 h-6 w-6 text-[#00d9ff] animate-pulse" />
                        </div>

                        {/* Orbiting Particles */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48">
                            <div className="absolute top-0 left-1/2 w-3 h-3 bg-[#00ff9d] rounded-full animate-orbit"></div>
                            <div className="absolute top-1/2 right-0 w-3 h-3 bg-[#00d9ff] rounded-full animate-orbit-delayed"></div>
                            <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-purple-500 rounded-full animate-orbit-delayed-2"></div>
                        </div>
                    </div>
                </div>

                {/* Text Content */}
                <div className="text-center space-y-6">
                    {/* Main Title */}
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#00ff9d] via-[#00d9ff] to-purple-500 bg-clip-text text-transparent animate-gradient">
                        System Upgrade in Progress…
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xl md:text-2xl text-muted-foreground font-medium">
                        Canton credential features are being deployed.
                    </p>

                    {/* Loading Bar */}
                    <div className="w-full max-w-md mx-auto mt-8">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                            <div className="h-full bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] rounded-full animate-loading-bar shadow-lg shadow-[#00ff9d]/50"></div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-12 p-6 bg-gradient-to-br from-[#00ff9d]/10 via-[#00d9ff]/10 to-purple-500/10 rounded-2xl backdrop-blur-xl border border-white/10">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            We're enhancing your account management experience with advanced Canton Network credentials.
                            This feature will be available soon. Thank you for your patience! 🚀
                        </p>
                    </div>

                    {/* Back Button */}
                    <Button
                        onClick={() => router.push("/settings")}
                        className="mt-8 bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/20 hover:scale-105 transition-all duration-300 rounded-xl h-12 px-8"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Back to Settings
                    </Button>
                </div>
            </div>

            {/* Custom Animations */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-30px); }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes spin-reverse-slow {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
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
                    from { transform: rotate(0deg) translateX(96px) rotate(0deg); }
                    to { transform: rotate(360deg) translateX(96px) rotate(-360deg); }
                }
                @keyframes orbit-delayed {
                    from { transform: rotate(120deg) translateX(96px) rotate(-120deg); }
                    to { transform: rotate(480deg) translateX(96px) rotate(-480deg); }
                }
                @keyframes orbit-delayed-2 {
                    from { transform: rotate(240deg) translateX(96px) rotate(-240deg); }
                    to { transform: rotate(600deg) translateX(96px) rotate(-600deg); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float-delayed 8s ease-in-out infinite;
                }
                .animate-spin-slow {
                    animation: spin-slow 20s linear infinite;
                }
                .animate-spin-reverse-slow {
                    animation: spin-reverse-slow 15s linear infinite;
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
