"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-card/30 backdrop-blur-lg p-8 rounded-3xl text-center space-y-8 border border-white/10 shadow-2xl relative overflow-hidden">
                    {/* Decorative background glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-10"></div>

                    <div className="space-y-6">
                        <div className="w-32 h-32 bg-primary/10 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-primary/20 overflow-hidden">
                            <Image
                                src="/logo.png"
                                alt="SwapaWallet Logo"
                                width={128}
                                height={128}
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground">SwapaWallet</h1>
                        <p className="text-base font-normal text-muted-foreground">
                            The future of decentralized finance
                        </p>
                    </div>

                    <div className="pt-4">
                        <Link href="/auth" className="w-full block">
                            <Button className="w-full h-10 py-1.5 text-lg rounded-full bg-gradient-to-r from-primary to-primary/60 hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/20">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}