import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/test/env-check
 * Test endpoint to verify environment variables are loaded
 */
export async function GET(req: NextRequest) {
    const hasMasterSeed = !!process.env.HD_WALLET_MASTER_SEED;
    const hasTreasuryAddress = !!process.env.TREASURY_ADDRESS;
    const hasTreasuryKey = !!process.env.TREASURY_PRIVATE_KEY;
    const hasPolygonRPC = !!process.env.POLYGON_RPC_URL;
    const hasBSCRPC = !!process.env.BSC_RPC_URL;

    return NextResponse.json({
        environment: {
            HD_WALLET_MASTER_SEED: hasMasterSeed ? 'Configured ✅' : 'Missing ❌',
            TREASURY_ADDRESS: hasTreasuryAddress ? 'Configured ✅' : 'Missing ❌',
            TREASURY_PRIVATE_KEY: hasTreasuryKey ? 'Configured ✅' : 'Missing ❌',
            POLYGON_RPC_URL: hasPolygonRPC ? 'Configured ✅' : 'Missing ❌',
            BSC_RPC_URL: hasBSCRPC ? 'Configured ✅' : 'Missing ❌',
        },
        masterSeedLength: process.env.HD_WALLET_MASTER_SEED?.split(' ').length || 0,
        note: 'Master seed should have 12 words'
    });
}
