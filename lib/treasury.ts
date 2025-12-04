import { CANTON_CONFIG, sendCantonCC, verifyTransaction } from './canton';

// Treasury configuration
export const TREASURY = {
    address: CANTON_CONFIG.treasuryAddress,
    tagPurchaseAmount: 25, // 25 CC for tag purchase
    rewardConversionAmount: 10, // 10 CC for reward conversion
};

/**
 * Send payment to treasury for tag purchase
 */
export async function purchaseTag(
    fromPartyId: string,
    privateKey: Buffer,
    tagName: string
): Promise<{ txHash: string; success: boolean; error?: string }> {
    try {
        // Validate tag name format
        if (!tagName || tagName.length < 3 || tagName.length > 20) {
            throw new Error('Tag name must be between 3 and 20 characters');
        }

        // Send 25 CC to treasury
        const txHash = await sendCantonCC(
            fromPartyId,
            TREASURY.address,
            TREASURY.tagPurchaseAmount,
            privateKey
        );

        return {
            txHash,
            success: true
        };
    } catch (error: any) {
        console.error('Tag purchase error:', error);
        return {
            txHash: '',
            success: false,
            error: error.message || 'Failed to purchase tag'
        };
    }
}

/**
 * Verify tag purchase transaction
 */
export async function verifyTagPurchase(txHash: string): Promise<{
    verified: boolean;
    amount?: number;
    error?: string;
}> {
    try {
        const verification = await verifyTransaction(txHash);

        if (!verification.success) {
            return {
                verified: false,
                error: 'Transaction not confirmed'
            };
        }

        // Check if payment was exactly 25 CC
        if (verification.amount !== TREASURY.tagPurchaseAmount) {
            return {
                verified: false,
                amount: verification.amount,
                error: `Invalid amount: expected ${TREASURY.tagPurchaseAmount} CC, got ${verification.amount} CC`
            };
        }

        // Check if payment went to treasury
        if (verification.to !== TREASURY.address) {
            return {
                verified: false,
                error: 'Payment not sent to treasury address'
            };
        }

        return {
            verified: true,
            amount: verification.amount
        };
    } catch (error: any) {
        console.error('Tag verification error:', error);
        return {
            verified: false,
            error: error.message || 'Failed to verify transaction'
        };
    }
}

/**
 * Send payment to treasury for reward conversion
 */
export async function convertRewards(
    fromPartyId: string,
    privateKey: Buffer
): Promise<{ txHash: string; success: boolean; error?: string }> {
    try {
        // Send 10 CC to treasury
        const txHash = await sendCantonCC(
            fromPartyId,
            TREASURY.address,
            TREASURY.rewardConversionAmount,
            privateKey
        );

        return {
            txHash,
            success: true
        };
    } catch (error: any) {
        console.error('Reward conversion error:', error);
        return {
            txHash: '',
            success: false,
            error: error.message || 'Failed to convert rewards'
        };
    }
}

/**
 * Verify reward conversion transaction
 */
export async function verifyRewardConversion(txHash: string): Promise<{
    verified: boolean;
    amount?: number;
    error?: string;
}> {
    try {
        const verification = await verifyTransaction(txHash);

        if (!verification.success) {
            return {
                verified: false,
                error: 'Transaction not confirmed'
            };
        }

        // Check if payment was exactly 10 CC
        if (verification.amount !== TREASURY.rewardConversionAmount) {
            return {
                verified: false,
                amount: verification.amount,
                error: `Invalid amount: expected ${TREASURY.rewardConversionAmount} CC, got ${verification.amount} CC`
            };
        }

        // Check if payment went to treasury
        if (verification.to !== TREASURY.address) {
            return {
                verified: false,
                error: 'Payment not sent to treasury address'
            };
        }

        return {
            verified: true,
            amount: verification.amount
        };
    } catch (error: any) {
        console.error('Reward conversion verification error:', error);
        return {
            verified: false,
            error: error.message || 'Failed to verify transaction'
        };
    }
}
