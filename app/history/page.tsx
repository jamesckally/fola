"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Search, Filter, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";

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
                return <ArrowUpRight className="h-5 w-5 text-red-500" />;
            case "RECEIVE":
                return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
            case "SWAP":
            case "REWARD_CONVERSION":
                return <RefreshCw className="h-5 w-5 text-blue-500" />;
            default:
                return <ArrowUpRight className="h-5 w-5 text-gray-500" />;
        }
    };

    const filteredTransactions = transactions.filter(tx => {
        const type = tx.transaction_type || "";
        const token = tx.token_type || "";
        const matchesFilter = filter === "all" || type.toLowerCase() === filter;
        const matchesSearch = search === "" ||
            token.toLowerCase().includes(search.toLowerCase()) ||
            tx.amount.toString().includes(search);
        return matchesFilter && matchesSearch;
    });

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Loading transactions...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="w-full max-w-md mx-auto flex flex-col h-screen">
                {/* Header */}
                <div className="p-4 flex items-center gap-4 border-b border-border">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="hover:bg-secondary/50"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-lg font-bold">History</h1>
                </div>

                <div className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search transactions..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-transparent border border-border"
                            />
                        </div>
                        <Button variant="ghost" size="icon" className="bg-gradient-to-r from-primary to-primary/60 text-primary-foreground hover:opacity-90">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {["all", "send", "receive", "swap"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === f
                                    ? "bg-gradient-to-r from-primary to-primary/60 text-primary-foreground"
                                    : "bg-gradient-to-r from-secondary to-secondary/60 text-secondary-foreground hover:opacity-90"
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 space-y-3 flex-grow overflow-y-auto">
                    {filteredTransactions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No transactions found
                        </div>
                    ) : (
                        filteredTransactions.map((tx) => (
                            <Card key={tx.id} className="p-4 bg-card border-border">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-secondary/50`}>
                                            {getIcon(tx.transaction_type)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">
                                                {tx.transaction_type === "SEND" ? "Sent" :
                                                    tx.transaction_type === "RECEIVE" ? "Received" :
                                                        tx.transaction_type} {tx.token_type}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(tx.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${tx.transaction_type === "RECEIVE" ? "text-green-500" : "text-foreground"
                                            }`}>
                                            {tx.transaction_type === "SEND" ? "-" : "+"}{tx.amount}
                                        </p>
                                        <p className="text-xs text-muted-foreground capitalize">{tx.status}</p>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                <BottomNav />
            </div>
        </div>
    );
};

export default History;