import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import DepositMonitor from '@/lib/models/DepositMonitor';
import { scanForDeposits, getLatestBlockNumber } from '@/lib/services/depositScanner';
import { processDeposits } from '@/lib/services/depositProcessor';
import type { NetworkType } from '@/lib/services/blockchain';

/**
 * GET /api/cron/monitor-deposits?network=polygon|bsc
 * Background job to monitor blockchain for deposits
 * Should be called every 2 minutes via cron
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const network = searchParams.get('network') as NetworkType;

        if (!network || !['polygon', 'bsc'].includes(network)) {
            return NextResponse.json(
                { error: 'Invalid network parameter' },
                { status: 400 }
            );
        }

        await dbConnect();

        console.log(`\n🔄 Starting deposit monitoring for ${network}...`);

        // Get or create monitoring state
        let monitor = await DepositMonitor.findOne({ network });

        if (!monitor) {
            // First time - get current block
            const currentBlock = await getLatestBlockNumber(network);
            monitor = await DepositMonitor.create({
                network,
                lastCheckedBlock: currentBlock - 100, // Start from 100 blocks ago
                lastCheckedAt: new Date(),
                isRunning: false
            });
            console.log(`📝 Created new monitor for ${network}, starting from block ${monitor.lastCheckedBlock}`);
        }

        // Prevent concurrent runs
        if (monitor.isRunning) {
            console.log(`⏸️  Monitor already running for ${network}`);
            return NextResponse.json({
                success: false,
                message: 'Monitor already running'
            });
        }

        // Mark as running
        monitor.isRunning = true;
        await monitor.save();

        try {
            // Get all user deposit addresses
            const users = await User.find({
                depositAddress: { $exists: true, $ne: null }
            }).select('depositAddress email');

            if (users.length === 0) {
                console.log(`ℹ️  No users with deposit addresses on ${network}`);
                monitor.isRunning = false;
                await monitor.save();
                return NextResponse.json({
                    success: true,
                    depositsProcessed: 0,
                    message: 'No users to monitor'
                });
            }

            const depositAddresses = users.map(u => u.depositAddress!.toLowerCase());
            console.log(`👥 Monitoring ${depositAddresses.length} deposit addresses`);

            // Get current block
            const currentBlock = await getLatestBlockNumber(network);
            const fromBlock = monitor.lastCheckedBlock + 1;

            // Don't scan too many blocks at once (max 1000)
            const toBlock = Math.min(currentBlock, fromBlock + 1000);

            if (fromBlock > currentBlock) {
                console.log(`✅ Already up to date (block ${currentBlock})`);
                monitor.isRunning = false;
                monitor.lastCheckedAt = new Date();
                await monitor.save();
                return NextResponse.json({
                    success: true,
                    depositsProcessed: 0,
                    currentBlock,
                    message: 'No new blocks'
                });
            }

            // Scan for deposits
            const deposits = await scanForDeposits(
                network,
                depositAddresses,
                fromBlock,
                toBlock
            );

            // Process deposits
            const result = await processDeposits(deposits, network);

            // Update monitoring state
            monitor.lastCheckedBlock = toBlock;
            monitor.lastCheckedAt = new Date();
            monitor.totalDepositsProcessed += result.processed;
            monitor.isRunning = false;
            monitor.lastError = null;
            await monitor.save();

            console.log(`✅ Monitoring complete: ${result.processed} processed, ${result.failed} failed`);
            console.log(`📊 Current block: ${toBlock}, Total deposits: ${monitor.totalDepositsProcessed}\n`);

            return NextResponse.json({
                success: true,
                network,
                blocksScanned: toBlock - fromBlock + 1,
                depositsFound: deposits.length,
                depositsProcessed: result.processed,
                depositsFailed: result.failed,
                currentBlock: toBlock,
                totalProcessed: monitor.totalDepositsProcessed
            });
        } catch (error: any) {
            // Mark as not running and save error
            monitor.isRunning = false;
            monitor.lastError = error.message;
            await monitor.save();
            throw error;
        }
    } catch (error: any) {
        console.error('❌ Deposit monitoring error:', error);
        return NextResponse.json(
            {
                error: 'Monitoring failed',
                details: error.message
            },
            { status: 500 }
        );
    }
}
