"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <QueryClientProvider client={queryClient}>
                <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
                    <TooltipProvider>{children}</TooltipProvider>
                </NextThemesProvider>
            </QueryClientProvider>
        </SessionProvider>
    );
}
