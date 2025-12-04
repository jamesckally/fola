"use client";

import { Home, History, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function BottomNav() {
    const router = useRouter();
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
            <div className="w-full max-w-md mx-auto">
                <div className="grid grid-cols-3 h-16">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 transition-colors",
                            isActive("/dashboard") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Home className="h-5 w-5" />
                        <span className="text-xs">Dashboard</span>
                    </button>
                    <button
                        onClick={() => router.push("/history")}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 transition-colors",
                            isActive("/history") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <History className="h-5 w-5" />
                        <span className="text-xs">History</span>
                    </button>
                    <button
                        onClick={() => router.push("/settings")}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 transition-colors",
                            isActive("/settings") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Settings className="h-5 w-5" />
                        <span className="text-xs">Settings</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
