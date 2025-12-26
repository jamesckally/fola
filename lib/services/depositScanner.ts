import { ethers } from 'ethers';
import { getNetworkConfig, type NetworkType } from './blockchain';

const USDT_ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

export interface DepositEvent {
    from: string;
    to: string;
    amount: number;
    txHash: string;
    blockNumber: number;
    timestamp?: number;
}

/**
 * Scan blockchain for USDT deposits to specific addresses
 */
export async function scanForDeposits(
    network: NetworkType,
    depositAddresses: string[],
    fromBlock: number,
    toBlock?: number | 'latest'
): Promise<DepositEvent[]> {
    if (depositAddresses.length === 0) {
        return [];
    }

    const config = getNetworkConfig(network);
    const provider = new ethers.JsonRpcProvider(config.rpc);

    try {
        // Get current block if not specified
        const currentBlock = await provider.getBlockNumber();
        const endBlock = toBlock === 'latest' || !toBlock ? currentBlock : toBlock;

        console.log(`🔍 Scanning ${network} blocks ${fromBlock} to ${endBlock} for ${depositAddresses.length} addresses`);

        // Create USDT contract interface
        const usdtInterface = new ethers.Interface(USDT_ABI);

        // Query Transfer events to our deposit addresses
        const filter = {
            address: config.usdtContract,
            topics: [
                ethers.id("Transfer(address,address,uint256)"),
                null, // from (any address)
                depositAddresses.map(addr => ethers.zeroPadValue(addr, 32)) // to (our addresses)
            ],
            fromBlock,
            toBlock: endBlock
        };

        const logs = await provider.getLogs(filter);

        console.log(`📦 Found ${logs.length} deposit events`);

        // Parse events
        const deposits: DepositEvent[] = [];

        for (const log of logs) {
            try {
                const parsed = usdtInterface.parseLog({
                    topics: log.topics as string[],
                    data: log.data
                });

                if (parsed && parsed.name === 'Transfer') {
                    const amount = Number(ethers.formatUnits(parsed.args.value, config.decimals));

                    deposits.push({
                        from: parsed.args.from,
                        to: parsed.args.to,
                        amount,
                        txHash: log.transactionHash,
                        blockNumber: log.blockNumber
                    });

                    console.log(`💰 Deposit: ${amount} USDT to ${parsed.args.to} (tx: ${log.transactionHash})`);
                }
            } catch (error) {
                console.error('Error parsing log:', error);
                continue;
            }
        }

        return deposits;
    } catch (error: any) {
        console.error(`Error scanning ${network} for deposits:`, error.message);
        throw error;
    }
}

/**
 * Get the latest block number for a network
 */
export async function getLatestBlockNumber(network: NetworkType): Promise<number> {
    const config = getNetworkConfig(network);
    const provider = new ethers.JsonRpcProvider(config.rpc);
    return await provider.getBlockNumber();
}
