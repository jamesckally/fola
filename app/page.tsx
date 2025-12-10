"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SplashScreen() {
    const router = useRouter();

    useEffect(() => {
        // Auto-redirect to auth page after 3.5 seconds
        const timer = setTimeout(() => {
            router.push("/auth");
        }, 3500);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0">
                {/* Floating Orbs */}
                <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-[#00ff9d]/30 to-transparent rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-[#00d9ff]/30 to-transparent rounded-full blur-3xl animate-float-delayed"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse-slow"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center gap-8">
                {/* Logo Container with Glow Effect */}
                <div className="relative">
                    {/* Outer Glow Ring */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] rounded-full blur-3xl opacity-50 animate-pulse-slow scale-150"></div>

                    {/* Logo */}
                    <div className="relative w-40 h-40 bg-gradient-to-br from-[#00ff9d]/20 via-[#00d9ff]/20 to-purple-500/20 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-center animate-float overflow-hidden">
                        <Image
                            src="/newlogo.png"
                            alt="Swapa Logo"
                            width={128}
                            height={128}
                            className="object-contain animate-scale-pulse"
                            priority
                        />
                    </div>

                    {/* Rotating Ring */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-56 border-2 border-[#00ff9d]/30 rounded-full animate-spin-slow"></div>
                </div>

                {/* App Name */}
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00ff9d] via-[#00d9ff] to-purple-500 bg-clip-text text-transparent animate-gradient">
                    Swapa
                </h1>

                {/* Loading Indicator */}
                <div className="flex gap-2">
                    <div className="w-2 h-2 bg-[#00ff9d] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-[#00d9ff] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
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
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(360deg); }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 0.8; }
                }
                @keyframes gradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                @keyframes scale-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float-delayed 4s ease-in-out infinite;
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
                .animate-pulse-slow {
                    animation: pulse-slow 3s ease-in-out infinite;
                }
                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient 3s ease infinite;
                }
                .animate-scale-pulse {
                    animation: scale-pulse 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}