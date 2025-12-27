// Gas fee estimation for Polygon and BSC networks

import { ethers } from 'ethers';

const POLYGON_RPC = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
const BSC_RPC = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org';

// Gas buffer to account for price fluctuations (10%)
const GAS_BUFFER = 1.1;

// Estimated gas units for USDT transfer
const USDT_TRANSFER_GAS = 65000;

/**
 * Get current gas price from network
 */
async function getGasPrice(network: 'polygon' | 'bsc'): Promise<bigint> {
    const rpcUrl = network === 'polygon' ? POLYGON_RPC : BSC_RPC;
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    try {
        const feeData = await provider.getFeeData();
        return feeData.gasPrice || BigInt(0);
    } catch (error) {
        console.error(`Error fetching gas price for ${network}:`, error);
        // Fallback gas prices (in gwei)
        return network === 'polygon'
            ? ethers.parseUnits('50', 'gwei')  // 50 gwei for Polygon
            : ethers.parseUnits('5', 'gwei');   // 5 gwei for BSC
    }
}

/**
 * Get native token price in USD
 */
async function getNativeTokenPrice(network: 'polygon' | 'bsc'): Promise<number> {
    try {
        const symbol = network === 'polygon' ? 'MATIC' : 'BNB';
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${symbol === 'MATIC' ? 'matic-network' : 'binancecoin'}&vs_currencies=usd`
        );
        const data = await response.json();
        return symbol === 'MATIC'
            ? data['matic-network']?.usd || 0.8  // Fallback: $0.80
            : data['binancecoin']?.usd || 300;    // Fallback: $300
    } catch (error) {
        console.error(`Error fetching ${network} price:`, error);
        // Fallback prices
        return network === 'polygon' ? 0.8 : 300;
    }
}

/**
 * Estimate gas fee in USD for a withdrawal
 */
export async function estimateGasFee(
    network: 'polygon' | 'bsc',
    amount: number
): Promise<number> {
    try {
        // Get current gas price
        const gasPrice = await getGasPrice(network);

        // Calculate gas cost in native token
        const gasCost = gasPrice * BigInt(USDT_TRANSFER_GAS);
        const gasCostInEther = parseFloat(ethers.formatEther(gasCost));

        // Get native token price in USD
        const tokenPrice = await getNativeTokenPrice(network);

        // Calculate gas fee in USD with buffer
        const gasFeeUSD = gasCostInEther * tokenPrice * GAS_BUFFER;

        // Round to 2 decimal places
        return Math.ceil(gasFeeUSD * 100) / 100;
    } catch (error) {
        console.error(`Error estimating gas fee for ${network}:`, error);
        // Fallback gas fees
        return network === 'polygon' ? 0.05 : 0.10;
    }
}

/**
 * Validate withdrawal after gas fee deduction
 */
export function validateWithdrawalAmount(
    requestedAmount: number,
    gasFee: number,
    minWithdrawal: number = 5
): { valid: boolean; netAmount: number; error?: string } {
    const netAmount = requestedAmount - gasFee;

    if (requestedAmount < minWithdrawal) {
        return {
            valid: false,
            netAmount: 0,
            error: `Minimum withdrawal amount is $${minWithdrawal}`
        };
    }

    if (netAmount <= 0) {
        return {
            valid: false,
            netAmount: 0,
            error: `Withdrawal amount ($${requestedAmount}) is less than gas fee ($${gasFee})`
        };
    }

    if (netAmount < 1) {
        return {
            valid: false,
            netAmount: 0,
            error: `Net amount after gas ($${netAmount.toFixed(2)}) is too low. Minimum net amount is $1`
        };
    }

    return {
        valid: true,
        netAmount: Math.floor(netAmount * 100) / 100
    };
}

/**
 * Get recommended network based on amount
 */
export function getRecommendedNetwork(amount: number): 'polygon' | 'bsc' {
    // For smaller amounts, recommend Polygon (lower gas fees)
    // For larger amounts, BSC might be more stable
    return amount < 50 ? 'polygon' : 'bsc';
}
