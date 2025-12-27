import { ethers } from 'ethers';

// USDT Contract ABI (minimal - only what we need)
const USDT_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// Network configurations
const NETWORKS = {
    polygon: {
        name: 'Polygon',
        rpc: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
        usdtContract: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        decimals: 6,
        chainId: 137,
        explorer: 'https://polygonscan.com'
    },
    bsc: {
        name: 'BSC',
        rpc: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
        usdtContract: '0x55d398326f99059fF775485246999027B3197955',
        decimals: 18,
        chainId: 56,
        explorer: 'https://bscscan.com'
    }
} as const;

export type NetworkType = keyof typeof NETWORKS;

/**
 * Verify a USDT deposit transaction on the blockchain
 */
export async function verifyDeposit(
    txHash: string,
    network: NetworkType,
    expectedRecipient: string,
    minAmount: number = 1
): Promise<{
    from: string;
    to: string;
    amount: number;
    blockNumber: number;
    timestamp: number;
}> {
    const config = NETWORKS[network];
    const provider = new ethers.JsonRpcProvider(config.rpc);

    console.log(`🔍 Verifying deposit on ${config.name}:`, txHash);

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
        throw new Error('Transaction not found on blockchain');
    }

    if (receipt.status !== 1) {
        throw new Error('Transaction failed on blockchain');
    }

    console.log(`✅ Transaction found in block ${receipt.blockNumber}`);

    // Create USDT contract interface
    const usdtInterface = new ethers.Interface(USDT_ABI);

    // Parse logs to find Transfer event
    let transferEvent: any = null;
    for (const log of receipt.logs) {
        try {
            const parsed = usdtInterface.parseLog({
                topics: log.topics as string[],
                data: log.data
            });

            if (parsed && parsed.name === 'Transfer' && log.address.toLowerCase() === config.usdtContract.toLowerCase()) {
                transferEvent = parsed;
                break;
            }
        } catch (e) {
            // Not a Transfer event or wrong contract, continue
            continue;
        }
    }

    if (!transferEvent) {
        throw new Error('No USDT transfer found in this transaction');
    }

    const from = transferEvent.args.from;
    const to = transferEvent.args.to;
    const rawAmount = transferEvent.args.value;

    // Convert amount from wei to USDT
    const amount = Number(ethers.formatUnits(rawAmount, config.decimals));

    console.log(`💰 Transfer: ${amount} USDT from ${from} to ${to}`);

    // Verify recipient
    if (to.toLowerCase() !== expectedRecipient.toLowerCase()) {
        throw new Error(`Transfer recipient (${to}) does not match treasury address (${expectedRecipient})`);
    }

    // Verify minimum amount
    if (amount < minAmount) {
        throw new Error(`Amount (${amount} USDT) is below minimum (${minAmount} USDT)`);
    }

    // Get block timestamp
    const block = await provider.getBlock(receipt.blockNumber);
    if (!block) {
        throw new Error('Block not found');
    }

    return {
        from,
        to,
        amount,
        blockNumber: receipt.blockNumber,
        timestamp: block.timestamp
    };
}

/**
 * Process a USDT withdrawal to an external address
 */
export async function processWithdrawal(
    network: NetworkType,
    toAddress: string,
    amount: number
): Promise<{
    transactionHash: string;
    blockNumber: number;
    gasUsed: string;
    status: 'success' | 'failed';
}> {
    const config = NETWORKS[network];

    // Get private key from environment
    const privateKey = process.env.TREASURY_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('Treasury private key not configured');
    }

    const provider = new ethers.JsonRpcProvider(config.rpc);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`💸 Processing withdrawal on ${config.name}: ${amount} USDT to ${toAddress}`);

    // Create USDT contract instance
    const usdtContract = new ethers.Contract(
        config.usdtContract,
        USDT_ABI,
        wallet
    );

    // Convert amount to wei
    const amountInWei = ethers.parseUnits(amount.toString(), config.decimals);

    // Check treasury balance
    const balance = await usdtContract.balanceOf(wallet.address);
    const balanceInUsdt = Number(ethers.formatUnits(balance, config.decimals));

    if (balanceInUsdt < amount) {
        throw new Error(`Insufficient treasury balance. Available: ${balanceInUsdt} USDT, Required: ${amount} USDT`);
    }

    // Send transaction
    const tx = await usdtContract.transfer(toAddress, amountInWei);
    console.log(`📤 Transaction sent: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();

    if (!receipt) {
        throw new Error('Transaction receipt not found');
    }

    console.log(`✅ Withdrawal confirmed in block ${receipt.blockNumber}`);

    return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed'
    };
}

/**
 * Estimate gas fee for a withdrawal
 */
export async function estimateWithdrawalGas(
    network: NetworkType,
    amount: number
): Promise<{
    gasPrice: string;
    estimatedGas: string;
    gasFeeInNative: string;
    gasFeeInUSD: number;
}> {
    const config = NETWORKS[network];
    const provider = new ethers.JsonRpcProvider(config.rpc);

    // Get current gas price
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || ethers.parseUnits('5', 'gwei');

    // Estimate gas for USDT transfer (typically ~50,000 gas)
    const estimatedGas = BigInt(65000); // Conservative estimate

    // Calculate gas fee in native token (MATIC or BNB)
    const gasFeeInWei = gasPrice * estimatedGas;
    const gasFeeInNative = ethers.formatEther(gasFeeInWei);

    // Estimate USD value (rough estimate)
    // In production, you'd want to fetch real-time prices
    const nativeTokenPriceUSD = network === 'polygon' ? 0.8 : 300; // MATIC ~$0.80, BNB ~$300
    const gasFeeInUSD = Number(gasFeeInNative) * nativeTokenPriceUSD;

    return {
        gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
        estimatedGas: estimatedGas.toString(),
        gasFeeInNative,
        gasFeeInUSD
    };
}

/**
 * Get treasury balance for a network
 */
export async function getTreasuryBalance(network: NetworkType): Promise<number> {
    const config = NETWORKS[network];
    const treasuryAddress = process.env.TREASURY_ADDRESS;

    if (!treasuryAddress) {
        throw new Error('Treasury address not configured');
    }

    const provider = new ethers.JsonRpcProvider(config.rpc);
    const usdtContract = new ethers.Contract(
        config.usdtContract,
        USDT_ABI,
        provider
    );

    const balance = await usdtContract.balanceOf(treasuryAddress);
    return Number(ethers.formatUnits(balance, config.decimals));
}

/**
 * Validate an Ethereum address
 */
export function isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
}

/**
 * Get network configuration
 */
export function getNetworkConfig(network: NetworkType) {
    return NETWORKS[network];
}
