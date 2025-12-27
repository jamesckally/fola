import { ethers } from 'ethers';
import { getPrivateKeyForAddress } from './hdWallet';

// USDT Contract ABI
const USDT_ABI = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)',
];

// Network configurations
const NETWORKS = {
    polygon: {
        rpc: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
        usdtContract: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        decimals: 6,
    },
    bsc: {
        rpc: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
        usdtContract: '0x55d398326f99059fF775485246999027B3197955',
        decimals: 18,
    },
} as const;

export type NetworkType = 'polygon' | 'bsc';

/**
 * Sweep USDT from HD wallet address to treasury
 * Used when user makes a purchase - transfers their USDT to treasury
 */
export async function sweepUSDTToTreasury(
    addressIndex: number,
    amount: number,
    network: NetworkType = 'polygon'
): Promise<string> {
    try {
        const config = NETWORKS[network];
        const treasuryAddress = process.env.TREASURY_ADDRESS;

        if (!treasuryAddress) {
            throw new Error('TREASURY_ADDRESS not configured');
        }

        // Get private key for this HD wallet address
        const privateKey = getPrivateKeyForAddress(addressIndex);

        // Setup provider and wallet
        const provider = new ethers.JsonRpcProvider(config.rpc);
        const wallet = new ethers.Wallet(privateKey, provider);

        // Setup USDT contract
        const usdtContract = new ethers.Contract(
            config.usdtContract,
            USDT_ABI,
            wallet
        );

        // Convert amount to proper decimals
        const amountInWei = ethers.parseUnits(amount.toString(), config.decimals);

        // Check balance
        const balance = await usdtContract.balanceOf(wallet.address);
        if (balance < amountInWei) {
            throw new Error(
                `Insufficient balance in HD wallet. Required: ${amount}, Available: ${ethers.formatUnits(balance, config.decimals)}`
            );
        }

        console.log(`💸 Sweeping ${amount} USDT from ${wallet.address} to treasury ${treasuryAddress}`);

        // Execute transfer to treasury
        const tx = await usdtContract.transfer(treasuryAddress, amountInWei);

        // Wait for confirmation
        const receipt = await tx.wait();

        console.log(`✅ Sweep successful! TX: ${receipt.hash}`);

        return receipt.hash;
    } catch (error: any) {
        console.error('Sweep to treasury error:', error);
        throw new Error(`Failed to sweep USDT to treasury: ${error.message}`);
    }
}

/**
 * Get USDT balance for an HD wallet address
 */
export async function getHDWalletUSDTBalance(
    addressIndex: number,
    network: NetworkType = 'polygon'
): Promise<number> {
    try {
        const config = NETWORKS[network];
        const privateKey = getPrivateKeyForAddress(addressIndex);

        const provider = new ethers.JsonRpcProvider(config.rpc);
        const wallet = new ethers.Wallet(privateKey, provider);

        const usdtContract = new ethers.Contract(
            config.usdtContract,
            USDT_ABI,
            wallet
        );

        const balance = await usdtContract.balanceOf(wallet.address);
        return parseFloat(ethers.formatUnits(balance, config.decimals));
    } catch (error: any) {
        console.error('Get HD wallet balance error:', error);
        throw new Error(`Failed to get balance: ${error.message}`);
    }
}
