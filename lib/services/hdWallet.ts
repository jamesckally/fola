import { ethers } from 'ethers';
import crypto from 'crypto';

/**
 * HD Wallet Service for generating unique deposit addresses
 * Each user gets a deterministic address derived from master seed
 */

const MASTER_SEED = process.env.HD_WALLET_MASTER_SEED;

if (!MASTER_SEED) {
    console.warn('⚠️ HD_WALLET_MASTER_SEED not configured. Deposit addresses will not work.');
}

/**
 * Convert userId to deterministic index
 */
function userIdToIndex(userId: string): number {
    // Create deterministic hash from userId
    const hash = crypto.createHash('sha256').update(userId).digest();
    // Use first 4 bytes as index, then modulo to keep in safe range
    // This gives us 0-9,999 range (10,000 unique addresses)
    const rawIndex = hash.readUInt32BE(0);
    return rawIndex % 10000; // Keep index below 10,000 for safe derivation
}

/**
 * Generate deposit address for a user
 * Uses simple account-based derivation
 */
export function generateDepositAddress(userId: string): {
    address: string;
    index: number;
} {
    if (!MASTER_SEED) {
        throw new Error('HD_WALLET_MASTER_SEED not configured');
    }

    try {
        // Get deterministic index from userId (0-9,999)
        const index = userIdToIndex(userId);

        // Create mnemonic
        const mnemonic = ethers.Mnemonic.fromPhrase(MASTER_SEED);

        // Use simpler path with smaller index
        const basePath = "m/44'/60'/0'/0";
        const wallet = ethers.HDNodeWallet.fromMnemonic(mnemonic, `${basePath}/${index}`);

        console.log(`Generated address for index ${index}: ${wallet.address}`);

        return {
            address: wallet.address,
            index
        };
    } catch (error: any) {
        console.error('Error generating deposit address:', error);
        throw new Error(`Failed to generate deposit address: ${error.message}`);
    }
}

/**
 * Get private key for a deposit address (for sweeping funds)
 * ADMIN USE ONLY - Never expose to frontend
 */
export function getPrivateKeyForAddress(addressIndex: number): string {
    if (!MASTER_SEED) {
        throw new Error('HD_WALLET_MASTER_SEED not configured');
    }

    try {
        const mnemonic = ethers.Mnemonic.fromPhrase(MASTER_SEED);
        const basePath = "m/44'/60'/0'/0";
        const wallet = ethers.HDNodeWallet.fromMnemonic(mnemonic, `${basePath}/${addressIndex}`);

        return wallet.privateKey;
    } catch (error: any) {
        console.error('Error getting private key:', error);
        throw new Error(`Failed to get private key: ${error.message}`);
    }
}

/**
 * Verify that an address belongs to our HD wallet
 */
export function verifyDepositAddress(address: string, addressIndex: number): boolean {
    if (!MASTER_SEED) {
        return false;
    }

    try {
        const mnemonic = ethers.Mnemonic.fromPhrase(MASTER_SEED);
        const basePath = "m/44'/60'/0'/0";
        const wallet = ethers.HDNodeWallet.fromMnemonic(mnemonic, `${basePath}/${addressIndex}`);

        return wallet.address.toLowerCase() === address.toLowerCase();
    } catch (error) {
        return false;
    }
}

/**
 * Generate a new master seed (for initial setup)
 * Run this once and save the output to HD_WALLET_MASTER_SEED
 */
export function generateMasterSeed(): string {
    const wallet = ethers.Wallet.createRandom();
    return wallet.mnemonic!.phrase;
}

/**
 * Get address from index (for admin tools)
 */
export function getAddressFromIndex(index: number): string {
    if (!MASTER_SEED) {
        throw new Error('HD_WALLET_MASTER_SEED not configured');
    }

    const mnemonic = ethers.Mnemonic.fromPhrase(MASTER_SEED);
    const basePath = "m/44'/60'/0'/0";
    const wallet = ethers.HDNodeWallet.fromMnemonic(mnemonic, `${basePath}/${index}`);

    return wallet.address;
}
