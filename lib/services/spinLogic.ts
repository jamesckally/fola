// Prize determination and spin logic utilities

// Money Split:
// $1 Ticket = $0.80 Pool (80%), $0.20 Treasury (20%)
export const HOUSE_EDGE = 0.20;
export const POOL_CONTRIBUTION = 0.80;

// STRICT Allowed Prizes (No duplicates) - REDUCED BY 50%
export const ALLOWED_PRIZES = [0.10, 0.25, 0.50, 1, 2.50, 25, 50];
// Special: FREE_SPIN is not a cash prize, handled separately

// Probability Weights - HYBRID SYSTEM
// Target: 30% cash win, 20% free spin, 30% lose, 20% small consolation
// Total Weight: 10,000
// Expected Cash Payout: ~$0.18-$0.20
export const PAID_PRIZE_WEIGHTS = {
    50: 1,          // 0.01% - $50
    25: 4,          // 0.04% - $25
    "2.50": 50,     // 0.5% - $2.50
    1: 300,         // 3.0% - $1
    "0.50": 800,    // 8.0% - $0.50
    "0.25": 1200,   // 12.0% - $0.25
    "0.10": 645,    // 6.45% - $0.10 (small consolation)
    // Special outcomes (non-cash)
    "-1": 2000,     // 20% - FREE SPIN (represented as -1)
    0: 3000         // 30% - LOSE / Try Again
};

export const FREE_PRIZE_WEIGHTS = {
    1: 5,           // 0.05% - Max for free tickets
    "0.50": 20,     // 0.2%
    "0.25": 100,    // 1.0%
    "0.10": 200,    // 2.0%
    "-1": 1000,     // 10% - Free spin (another free ticket)
    0: 8675         // 86.75% - Mostly lose for free tickets
};

// Use ALLOWED_PRIZES for tiers, sorted descending for downgrade logic
export const PRIZE_TIERS = [...ALLOWED_PRIZES].sort((a, b) => b - a);

/**
 * Select a prize from weighted probabilities
 * Returns -1 for FREE_SPIN, 0 for LOSE, or cash amount
 */
export function selectWeightedPrize(weights: Record<number, number>): number {
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (const [prizeStr, weight] of Object.entries(weights)) {
        random -= weight;
        if (random <= 0) {
            return parseFloat(prizeStr);
        }
    }

    // Fallback to lose
    return 0;
}

/**
 * Calculate jackpot chance based on pool balance
 * Rules:
 * - Min pool $500
 * - Chance increases with pool size
 */
export function calculateJackpotChance(poolBalance: number): number {
    if (poolBalance < 500) return 0;        // Jackpot inactive < $500
    if (poolBalance < 1000) return 0.0001;  // 0.01%
    if (poolBalance < 5000) return 0.0005;  // 0.05%
    if (poolBalance < 10000) return 0.001;  // 0.1%
    return 0.002;                           // 0.2% max
}

/**
 * Calculate Jackpot Amount
 * Rule: Min(Pool * 30%, Cap)
 */
export function calculateJackpotAmount(poolBalance: number): number {
    const JACKPOT_CAP = 5000; // Example cap
    return Math.min(poolBalance * 0.30, JACKPOT_CAP);
}

/**
 * Auto-downgrade prize to next affordable tier
 */
export function autoDowngradePrize(requestedPrize: number, poolBalance: number): number {
    // If we can't afford the requested prize, find the next highest one we CAN afford
    for (const tier of PRIZE_TIERS) { // Tiers are sorted Descending (50, 25, 2.5...)
        if (tier < requestedPrize && poolBalance >= tier) {
            return tier;
        }
        if (tier <= poolBalance && tier < requestedPrize) {
            return tier;
        }
    }
    // If even smallest prize is too expensive, return 0
    return 0;
}

/**
 * Determine prize result category
 */
export function getPrizeResult(prize: number, isJackpot: boolean, isFreeSpin: boolean): string {
    if (isJackpot) return 'JACKPOT';
    if (isFreeSpin) return 'FREE_SPIN';
    if (prize === 0) return 'LOSE';
    if (prize >= 25) return 'BIG_WIN';
    if (prize >= 1) return 'MEDIUM_WIN';
    if (prize >= 0.10) return 'SMALL_WIN';
    return 'LOSE';
}

/**
 * Get prize message for user
 */
export function getPrizeMessage(prize: number, isJackpot: boolean, isFreeSpin: boolean, wasDowngraded: boolean): string {
    if (isJackpot) {
        return `🎉 JACKPOT! You won $${prize.toFixed(2)}! Congratulations!`;
    }
    if (isFreeSpin) {
        return "🎁 Free Spin! You got a bonus ticket!";
    }
    if (prize === 0) {
        return "Better luck next time! Keep spinning!";
    }
    if (wasDowngraded) {
        return `You won $${prize.toFixed(2)}! (Prize pool adjusted)`;
    }
    if (prize >= 25) {
        return `🎊 Big Win! You won $${prize.toFixed(2)}!`;
    }
    if (prize >= 1) {
        return `🎁 Nice! You won $${prize.toFixed(2)}!`;
    }
    return `You won $${prize.toFixed(2)}!`;
}
