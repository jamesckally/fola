import { ethers } from 'ethers';

// USDT Contract Addresses
export const USDT_CONTRACTS = {
    BSC: '0x55d398326f99059fF775485246999027B3197955',
    POLYGON: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
};

// Network Configuration
export const NETWORKS = {
    BSC: {
        name: 'BNB Smart Chain',
        rpcUrl: process.env.BSC_RPC_URL || '',
        chainId: 56,
        usdtAddress: USDT_CONTRACTS.BSC,
    },
    POLYGON: {
        name: 'Polygon',
        rpcUrl: process.env.POLYGON_RPC_URL || '',
        chainId: 137,
        usdtAddress: USDT_CONTRACTS.POLYGON,
    },
};

// ERC20 ABI (minimal for USDT transfers)
const ERC20_ABI = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)',
];

/**
 * Treasury Service for USDT On-Chain Operations
 */
export class TreasuryService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private usdtContract: ethers.Contract;
    private network: typeof NETWORKS.BSC | typeof NETWORKS.POLYGON;

    constructor(networkName: 'BSC' | 'POLYGON' = 'BSC') {
        this.network = NETWORKS[networkName];

        // Initialize provider
        this.provider = new ethers.JsonRpcProvider(this.network.rpcUrl);

        // Initialize wallet from private key
        const privateKey = process.env.TREASURY_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('TREASURY_PRIVATE_KEY not configured in environment');
        }
        this.wallet = new ethers.Wallet(privateKey, this.provider);

        // Initialize USDT contract
        this.usdtContract = new ethers.Contract(
            this.network.usdtAddress,
            ERC20_ABI,
            this.wallet
        );
    }

    /**
     * Send USDT from treasury to user address
     */
    async sendUSDT(toAddress: string, amount: number): Promise<string> {
        try {
            // Convert amount to proper decimals (USDT uses 6 decimals on BSC, 6 on Polygon)
            const decimals = await this.usdtContract.decimals();
            const amountInWei = ethers.parseUnits(amount.toString(), decimals);

            // Check treasury balance
            const balance = await this.usdtContract.balanceOf(this.wallet.address);
            if (balance < amountInWei) {
                throw new Error(`Insufficient treasury balance. Required: ${amount}, Available: ${ethers.formatUnits(balance, decimals)}`);
            }

            // Execute transfer
            const tx = await this.usdtContract.transfer(toAddress, amountInWei);

            // Wait for confirmation
            const receipt = await tx.wait();

            return receipt.hash;
        } catch (error: any) {
            console.error('Treasury send error:', error);
            throw new Error(`Failed to send USDT: ${error.message}`);
        }
    }

    /**
     * Get treasury wallet address
     */
    getTreasuryAddress(): string {
        return this.wallet.address;
    }

    /**
     * Get treasury USDT balance
     */
    async getTreasuryBalance(): Promise<number> {
        try {
            const decimals = await this.usdtContract.decimals();
            const balance = await this.usdtContract.balanceOf(this.wallet.address);
            return parseFloat(ethers.formatUnits(balance, decimals));
        } catch (error: any) {
            console.error('Get balance error:', error);
            throw new Error(`Failed to get treasury balance: ${error.message}`);
        }
    }

    /**
     * Verify a transaction on-chain
     */
    async verifyTransaction(txHash: string): Promise<{
        success: boolean;
        amount?: number;
        from?: string;
        to?: string;
        error?: string;
    }> {
        try {
            const receipt = await this.provider.getTransactionReceipt(txHash);

            if (!receipt) {
                return { success: false, error: 'Transaction not found' };
            }

            if (receipt.status !== 1) {
                return { success: false, error: 'Transaction failed' };
            }

            // Parse transfer event
            const tx = await this.provider.getTransaction(txHash);
            if (!tx) {
                return { success: false, error: 'Transaction details not found' };
            }

            return {
                success: true,
                from: tx.from,
                to: tx.to || undefined,
            };
        } catch (error: any) {
            console.error('Verify transaction error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export singleton instances
export const bscTreasury = new TreasuryService('BSC');
export const polygonTreasury = new TreasuryService('POLYGON');
