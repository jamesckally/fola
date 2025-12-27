"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, ArrowLeft, Trophy, Coins, Ticket, Gift } from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { TicketPurchaseDialog } from "@/components/TicketPurchaseDialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// 9 Segments: 7 Cash Prizes + 1 JACKPOT + 1 Free Spin
const PRIZE_COLORS = [
    '#52B788', // $0.10 (Green)
    '#4ECDC4', // $0.25 (Teal)
    '#45B7D1', // $0.50 (Cyan)
    '#98D8C8', // $1 (Mint)
    '#F7DC6F', // $2.50 (Yellow)
    '#F8B739', // $25 (Orange)
    '#FF6B6B', // $50 (Red)
    '#BB8FCE', // JACKPOT (Purple)
    '#4CAF50'  // Free Spin (Bright Green)
];

const PRIZE_LABELS = [
    '$0.10',
    '$0.25',
    '$0.50',
    '$1',
    '$2.50',
    '$25',
    '$50',
    'JACKPOT',
    '🎁 Free Spin'
];

// Snowflake component
const Snowflake = ({ delay, duration, left }: { delay: number; duration: number; left: string }) => (
    <div
        className="absolute text-white opacity-70 animate-fall"
        style={{
            left,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
            top: '-20px',
            fontSize: `${Math.random() * 10 + 10}px`
        }}
    >
        ❄️
    </div>
);

// Confetti component
const Confetti = ({ show }: { show: boolean }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(50)].map((_, i) => (
                <div
                    key={i}
                    className="absolute animate-confetti"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: '-20px',
                        animationDelay: `${Math.random() * 0.5}s`,
                        animationDuration: `${Math.random() * 2 + 2}s`
                    }}
                >
                    <div
                        className="w-2 h-2 rounded-sm"
                        style={{
                            backgroundColor: ['#FF6B6B', '#4ECDC4', '#F7DC6F', '#BB8FCE', '#00ff9d'][Math.floor(Math.random() * 5)],
                            transform: `rotate(${Math.random() * 360}deg)`
                        }}
                    />
                </div>
            ))}
        </div>
    );
};

export default function SpinPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    const [usdtBalance, setUsdtBalance] = useState(0);
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [showResultDialog, setShowResultDialog] = useState(false);
    const [lastResult, setLastResult] = useState<any>(null);
    const [spinHistory, setSpinHistory] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [showConfetti, setShowConfetti] = useState(false);

    // Ticket system state
    const [freeTickets, setFreeTickets] = useState(0);
    const [paidTickets, setPaidTickets] = useState(0);
    const [canClaimFree, setCanClaimFree] = useState(false);
    const [nextClaimTime, setNextClaimTime] = useState<string | null>(null);
    const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

    // Recent winners
    const [recentWinners, setRecentWinners] = useState<any[]>([]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth");
        } else if (status === "authenticated") {
            // @ts-ignore
            if (!session?.user?.walletAddress) {
                router.push("/setup-wallet");
                return;
            }
            loadData();
        }
    }, [status, session]);

    const loadData = async () => {
        try {
            // @ts-ignore
            const userId = session?.user?.id;

            // Fetch USDT balance
            const balanceRes = await fetch('/api/wallet/balance');
            if (balanceRes.ok) {
                const data = await balanceRes.json();
                setUsdtBalance(data.usdtBalance || 0);
            }

            // Fetch prize pool data
            const poolRes = await fetch('/api/game/prize-pool');
            if (poolRes.ok) {
                const poolData = await poolRes.json();

            }

            // Fetch ticket balance
            const ticketRes = await fetch('/api/game/tickets/balance');
            if (ticketRes.ok) {
                const ticketData = await ticketRes.json();
                setFreeTickets(ticketData.freeTickets || 0);
                setPaidTickets(ticketData.paidTickets || 0);
                setCanClaimFree(ticketData.canClaimFree || false);
                setNextClaimTime(ticketData.nextClaimTime || null);
            }

            // Fetch spin history and stats
            if (userId) {
                const spinRes = await fetch(`/api/game/spin?userId=${userId}`);
                if (spinRes.ok) {
                    const spinData = await spinRes.json();
                    setSpinHistory(spinData.history || []);
                    setStats(spinData.stats || null);
                }
            }

            // Fetch recent winners
            const winnersRes = await fetch('/api/game/recent-winners');
            if (winnersRes.ok) {
                const winnersData = await winnersRes.json();
                setRecentWinners(winnersData.winners || []);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    // ... (handleClaimFree implementation remains same if needed, or remove if not used in updated UI) ...
    // Keeping data loading and basic handlers, updating handleSpin thoroughly

    const handleSpin = async () => {
        const totalTickets = freeTickets + paidTickets;

        if (totalTickets === 0) {
            toast.error('No tickets available! Purchase tickets or claim your free daily ticket.');
            return;
        }

        setSpinning(true);

        try {
            const response = await fetch('/api/game/spin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Spin failed');
            }

            // Calculate rotation based on prize amount
            let segmentIndex: number;

            if (data.isJackpot) {
                segmentIndex = PRIZE_LABELS.findIndex(label => label === 'JACKPOT');
            } else if (data.isFreeSpin || data.prize === -1) {
                // Free Spin - target the Free Spin segment
                segmentIndex = PRIZE_LABELS.findIndex(label => label.includes('Free Spin'));
            } else if (data.prize === 0) {
                // Lost - show smallest prize segment as fallback visual
                segmentIndex = 0; // $0.10
            } else {
                // Find matching label
                const prizeNum = Number(data.prize);
                // Format to match label - handle special case of 2.50
                segmentIndex = PRIZE_LABELS.findIndex(label => {
                    if (label === 'JACKPOT' || label.includes('Free Spin')) return false;
                    // Extract number from label
                    const val = parseFloat(label.replace('$', ''));
                    return Math.abs(val - prizeNum) < 0.001;
                });

                if (segmentIndex === -1) {
                    console.error('Could not find segment for prize:', prizeNum);
                    // Fallback to Free Spin segment
                    segmentIndex = PRIZE_LABELS.findIndex(label => label.includes('Free Spin'));
                }
            }

            // Calculation for 9 segments
            const segmentsCount = 9;
            const segmentAngle = 360 / segmentsCount; // 40 degrees
            const spins = 5; // Full rotations

            // Segment Center Logic:
            // SVG starts at -90 degrees.
            // Segment i starts at: i * 40 - 90
            // Segment i center: (i * 40) - 90 + 20 = i*40 - 70
            // Pointer is at TOP (-90 degrees in SVG space)
            // Rotation = Pointer (-90) - Center

            const segmentCenterInWheel = (segmentIndex * segmentAngle) - 70;
            const pointerPosition = -90;
            const absoluteTargetPosition = pointerPosition - segmentCenterInWheel;

            // Normalize
            const normalizedTarget = ((absoluteTargetPosition % 360) + 360) % 360;
            const currentNormalized = rotation % 360;
            let rotationNeeded = normalizedTarget - currentNormalized;

            if (rotationNeeded > 0) {
                rotationNeeded -= 360;
            }

            const finalRotation = rotation + (360 * spins) + rotationNeeded;

            // Debug
            console.log('Spin Target:', data.prize, 'Index:', segmentIndex, 'Label:', PRIZE_LABELS[segmentIndex]);

            setRotation(finalRotation);

            setTimeout(() => {
                setLastResult(data);
                setShowResultDialog(true);
                setSpinning(false);

                if (data.prize > 0) {
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 4000);
                }

                setFreeTickets(data.ticketsRemaining.free);
                setPaidTickets(data.ticketsRemaining.paid);
                setUsdtBalance(data.newUSDTBalance);

                loadData();
            }, 4000);

        } catch (error: any) {
            toast.error(error.message);
            setSpinning(false);
        }
    };

    const getPrizeLabel = (result: string, prize: number) => {
        const safePrize = Number(prize) || 0;
        if (result === 'FREE_SPIN') return '🎁 Free Spin!';
        if (result === 'LOSE' || safePrize === 0) return 'Better Luck!';
        if (result === 'JACKPOT') return `$${safePrize.toFixed(2)} 🎉`;
        return `$${safePrize.toFixed(2)}`;
    };

    if (status === "loading" || loading) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0f1629] pb-24">
            <Confetti show={showConfetti} />

            <div className="w-full max-w-md mx-auto relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                    {[...Array(30)].map((_, i) => (
                        <Snowflake
                            key={i}
                            delay={Math.random() * 5}
                            duration={Math.random() * 10 + 10}
                            left={`${Math.random() * 100}%`}
                        />
                    ))}
                </div>

                {/* Header */}
                <div className="p-4 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/dashboard")}
                        className="hover:bg-white/10 backdrop-blur-sm"
                    >
                        <ArrowLeft className="h-5 w-5 text-white" />
                    </Button>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-[#00ff9d] via-[#00d9ff] to-[#FF6B6B] bg-clip-text text-transparent animate-pulse">
                        🎄 Spin to Earn 🎁
                    </h1>
                    <div className="w-10" />
                </div>

                {/* Ticket & Pool Info */}
                <div className="px-4 mb-6 space-y-3">
                    <Card className="p-4 bg-gradient-to-br from-[#00ff9d]/20 via-[#00d9ff]/20 to-purple-500/20 border border-[#00ff9d]/30 shadow-xl rounded-2xl backdrop-blur-md relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                        <div className="relative z-10">
                            <div className="text-sm text-white/70 mb-3 flex items-center gap-2">
                                <Ticket className="h-4 w-4" />
                                Your Tickets
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="text-3xl font-bold text-[#00ff9d]">{freeTickets + paidTickets}</div>
                                <Button
                                    size="sm"
                                    onClick={() => setShowPurchaseDialog(true)}
                                    className="bg-[#00ff9d]/20 hover:bg-[#00ff9d]/30 text-[#00ff9d] border border-[#00ff9d]/50"
                                >
                                    <Coins className="mr-2 h-4 w-4" /> Buy More
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Spin Wheel */}
                <div className="px-4 mb-6 flex flex-col items-center">
                    <div className="relative w-80 h-80 mb-8">
                        {/* Pointer */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
                            <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-[#00ff9d] drop-shadow-[0_0_10px_rgba(0,255,157,0.8)]" />
                        </div>

                        {/* Wheel Container */}
                        <div
                            className="w-full h-full rounded-full relative overflow-hidden shadow-2xl border-8 border-white/20"
                            style={{
                                transform: `rotate(${rotation}deg)`,
                                transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                                boxShadow: '0 0 50px rgba(0, 255, 157, 0.3), 0 0 100px rgba(0, 217, 255, 0.2)'
                            }}
                        >
                            <svg className="w-full h-full" viewBox="0 0 200 200">
                                {PRIZE_LABELS.map((label, i) => {
                                    const segments = PRIZE_LABELS.length; // 12
                                    const angle = 360 / segments;
                                    const startAngle = i * angle - 90;
                                    const endAngle = startAngle + angle;

                                    const startRad = (startAngle * Math.PI) / 180;
                                    const endRad = (endAngle * Math.PI) / 180;

                                    const x1 = 100 + 100 * Math.cos(startRad);
                                    const y1 = 100 + 100 * Math.sin(startRad);
                                    const x2 = 100 + 100 * Math.cos(endRad);
                                    const y2 = 100 + 100 * Math.sin(endRad);

                                    // Text Layout
                                    const textAngle = startAngle + angle / 2;
                                    const textRad = (textAngle * Math.PI) / 180;
                                    // Adjust text distance based on label length
                                    const dist = 75;
                                    const textX = 100 + dist * Math.cos(textRad);
                                    const textY = 100 + dist * Math.sin(textRad);

                                    return (
                                        <g key={i}>
                                            <path
                                                d={`M 100 100 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`}
                                                fill={PRIZE_COLORS[i]}
                                                stroke="rgba(255,255,255,0.4)"
                                                strokeWidth="1"
                                            />
                                            <text
                                                x={textX}
                                                y={textY}
                                                fill="white"
                                                fontSize={label === 'JACKPOT' ? "7" : (label === 'Try Again' ? "12" : "9")}
                                                fontWeight="bold"
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                                                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                                            >
                                                {label === 'Try Again' ? '❌' : label}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                            {/* Center Logo */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-[#00ff9d] to-[#00d9ff] flex items-center justify-center shadow-xl z-10 border-4 border-white/20">
                                <Sparkles className="h-8 w-8 text-black" />
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleSpin}
                        disabled={spinning || (freeTickets + paidTickets) === 0}
                        className="bg-gradient-to-r from-[#00ff9d] via-[#00d9ff] to-[#FF6B6B] text-black font-bold shadow-lg hover:shadow-[#00ff9d]/40 rounded-xl h-14 px-12 text-lg disabled:opacity-50 min-w-[200px]"
                    >
                        {spinning ? (
                            <>Spinning...</>
                        ) : (
                            <>Spin Now ({freeTickets + paidTickets} tix)</>
                        )}
                    </Button>
                </div>

                {/* Recent Spins List */}
                {spinHistory.length > 0 && (
                    <div className="px-4">
                        <h3 className="text-sm font-bold mb-3 text-white/70">Recent History</h3>
                        <div className="space-y-2">
                            {spinHistory.slice(0, 3).map((spin: any, index: number) => (
                                <Card key={index} className="p-3 bg-white/5 backdrop-blur-sm border border-white/10 flex justify-between items-center">
                                    <span className="text-white text-sm">{getPrizeLabel(spin.result, spin.prize)}</span>
                                    <span className="text-white/50 text-xs">{new Date(spin.createdAt).toLocaleTimeString()}</span>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Result Dialog */}
                <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
                    <DialogContent className="bg-transparent border-none shadow-none p-0 max-w-sm">
                        <Card className="p-6 bg-[#1a1f3a] border border-[#00ff9d]/30 text-center rounded-3xl">
                            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${lastResult?.prize > 0 ? 'bg-[#00ff9d] text-black' : 'bg-gray-700 text-white'}`}>
                                {lastResult?.prize > 0 ? <Trophy className="h-10 w-10" /> : <Coins className="h-10 w-10" />}
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                {lastResult?.prize > 0 ? 'YOU WON!' : 'Try Again!'}
                            </h2>
                            <p className="text-3xl font-bold text-[#00ff9d] mb-4">
                                {lastResult?.prize > 0 ? `$${lastResult.prize.toFixed(2)}` : '$0.00'}
                            </p>
                            <p className="text-white/70 text-sm mb-6">{lastResult?.message}</p>
                            <Button onClick={() => setShowResultDialog(false)} className="w-full bg-[#00ff9d] text-black font-bold h-12 rounded-xl">
                                Continue
                            </Button>
                        </Card>
                    </DialogContent>
                </Dialog>

                <TicketPurchaseDialog
                    open={showPurchaseDialog}
                    onOpenChange={setShowPurchaseDialog}
                    usdtBalance={usdtBalance}
                    onPurchaseSuccess={loadData}
                />
            </div>
            <BottomNav />
        </div>
    );
}
