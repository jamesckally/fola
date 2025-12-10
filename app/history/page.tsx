"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loading } from "@/components/Loading";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Search, Filter, ArrowLeft, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Transaction {
    id: string;
    created_at: string;
    amount: number;
    token_type: string;
    transaction_type: string;
    status: string;
    recipient_address?: string;
    sender_address?: string;
}

const History = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [timeFilter, setTimeFilter] = useState("all");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth");
        } else if (status === "authenticated") {
            loadTransactions();
        }
    }, [status]);

    const loadTransactions = async () => {
        try {
            const data: any = await api.transactions.getAll();
            setTransactions(data || []);
        } catch (error) {
            console.error("Error loading transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "SEND":
                return <ArrowUpRight className="h-5 w-5 text-red-400" />;
            case "RECEIVE":
                return <ArrowDownLeft className="h-5 w-5 text-[#00ff9d]" />;
            case "SWAP":
            case "REWARD_CONVERSION":
                return <RefreshCw className="h-5 w-5 text-[#00d9ff]" />;
            default:
                return <ArrowUpRight className="h-5 w-5 text-gray-400" />;
        }
    };

    const filteredTransactions = transactions.filter(tx => {
        const type = tx.transaction_type || "";
        const token = tx.token_type || "";
        const matchesFilter = filter === "all" || type.toLowerCase() === filter;
        const matchesSearch = search === "" ||
            token.toLowerCase().includes(search.toLowerCase()) ||
            tx.amount.toString().includes(search);

        // Time filter logic
        let matchesTime = true;
        if (timeFilter !== "all") {
            const txDate = new Date(tx.created_at);
            const now = new Date();
            const daysDiff = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));

            if (timeFilter === "today") matchesTime = daysDiff === 0;
            else if (timeFilter === "week") matchesTime = daysDiff <= 7;
            else if (timeFilter === "month") matchesTime = daysDiff <= 30;
        }

        return matchesFilter && matchesSearch && matchesTime;
    });

    if (status === "loading" || loading) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-[#00ff9d]/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-[#00d9ff]/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
            </div>

            <div className="w-full max-w-md mx-auto flex flex-col h-screen relative z-10">
                {/* Header & Filters Combined */}
                <div className="backdrop-blur-xl bg-background/50 border-b border-white/10">
                    {/* Header */}
                    <div className="p-4 flex items-center gap-4 border-b border-white/10">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] bg-clip-text text-transparent">
                                Transaction History
                            </h1>
                            <p className="text-xs text-muted-foreground">{filteredTransactions.length} transactions</p>
                        </div>
                    </div>

                    {/* Filters Section */}
                    <div className="p-4 space-y-3">
                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by token or amount..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-white/5 border-white/10 backdrop-blur-xl focus:border-[#00ff9d]/50 transition-all"
                            />
                        </div>

                        {/* Filter Buttons Row */}
                        <div className="flex gap-2 items-center">
                            <div className="flex gap-2 overflow-x-auto pb-1 flex-1 no-scrollbar">
                                {[
                                    { value: "all", label: "All", icon: Filter },
                                    { value: "send", label: "Sent", icon: TrendingDown },
                                    { value: "receive", label: "Received", icon: TrendingUp },
                                    { value: "swap", label: "Swaps", icon: RefreshCw }
                                ].map((f) => (
                                    <button
                                        key={f.value}
                                        onClick={() => setFilter(f.value)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${filter === f.value
                                                ? "bg-gradient-to-r from-[#00ff9d] to-[#00d9ff] text-black shadow-lg shadow-[#00ff9d]/20"
                                                : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/10"
                                            }`}
                                    >
                                        <f.icon className="h-3.5 w-3.5" />
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            {/* Time Filter Dropdown */}
                            <Select value={timeFilter} onValueChange={setTimeFilter}>
                                <SelectTrigger className="w-[120px] bg-white/5 border-white/10 backdrop-blur-xl">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="week">This Week</SelectItem>
                                    <SelectItem value="month">This Month</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Transaction List */}
                <div className="p-4 flex-grow overflow-y-auto">
                    {filteredTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00ff9d]/20 to-[#00d9ff]/20 flex items-center justify-center mb-4">
                                <Search className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground text-lg font-medium">No transactions found</p>
                            <p className="text-sm text-muted-foreground/60 mt-1">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 backdrop-blur-xl overflow-hidden">
                            {filteredTransactions.map((tx, index) => (
                                <div
                                    key={tx.id}
                                    className={`p-4 hover:bg-white/5 transition-all duration-300 ${index !== filteredTransactions.length - 1 ? 'border-b border-white/10' : ''
                                        }`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${tx.transaction_type === "SEND"
                                                ? "from-red-500/20 to-red-600/10"
                                                : tx.transaction_type === "RECEIVE"
                                                    ? "from-[#00ff9d]/20 to-[#00d9ff]/10"
                                                    : "from-[#00d9ff]/20 to-purple-500/10"
                                                } backdrop-blur-sm border border-white/10`}>
                                                {getIcon(tx.transaction_type)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground">
                                                    {tx.transaction_type === "SEND" ? "Sent" :
                                                        tx.transaction_type === "RECEIVE" ? "Received" :
                                                            tx.transaction_type} {tx.token_type}
                                                </p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(tx.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold text-lg ${tx.transaction_type === "RECEIVE"
                                                ? "text-[#00ff9d]"
                                                : "text-foreground"
                                                }`}>
                                                {tx.transaction_type === "SEND" ? "-" : "+"}{tx.amount}
                                            </p>
                                            <p className={`text-xs px-2 py-0.5 rounded-full inline-block ${tx.status === "completed"
                                                ? "bg-[#00ff9d]/20 text-[#00ff9d]"
                                                : "bg-yellow-500/20 text-yellow-500"
                                                }`}>
                                                {tx.status}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Card>
                    )}
                </div>

                <BottomNav />
            </div>
        </div>
    );
};

export default History;