import * as bip39 from 'bip39';
import { createHash } from 'crypto';

// Lazy load BIP32 only on server side to avoid WebAssembly issues in browser
let bip32: any = null;

const loadBip32 = () => {
    if (!bip32 && typeof window === 'undefined') {
        const { BIP32Factory } = require('bip32');
        const ecc = require('tiny-secp256k1');
        bip32 = BIP32Factory(ecc);
    }
    return bip32;
};

// Canton Network Configuration
export const CANTON_CONFIG = {
    rpcUrl: process.env.CANTON_RPC_URL || 'https://api.cantonnodes.com/v0',
    treasuryAddress: process.env.CANTON_TREASURY_ADDRESS || '331ad0da16421f0d8046d864c745ad72::12203ca3910059e9ef2795c9bacfd2e2316e6f42db57d8965ff2dce0392a37f3e5a4',
    cantonScanApi: process.env.CANTONSCAN_API_URL || 'https://www.cantonscan.com/api',
    jwtToken: process.env.CANTON_JWT_TOKEN || '', // JWT Token for private endpoints
    chainId: 8888,
    derivationPath: "m/44'/8888'/0'/0/0"
};

/**
 * Derive Canton Party ID from BIP39 mnemonic
 * Canton uses Party IDs in format: {namespace}::{party_name}
 */
export function deriveCantonPartyId(mnemonic: string): string {
    try {
        // Validate mnemonic
        if (!bip39.validateMnemonic(mnemonic)) {
            throw new Error('Invalid mnemonic phrase');
        }

        // Generate seed from mnemonic
        const seed = bip39.mnemonicToSeedSync(mnemonic);

        // Derive key using Canton's derivation path
        const bip32Instance = loadBip32();
        if (!bip32Instance) {
            console.error('BIP32 library failed to load. Ensure bip32 and tiny-secp256k1 are installed.');
            throw new Error('BIP32 library failed to load. This may be a server configuration issue.');
        }

        const root = bip32Instance.fromSeed(seed);
        const child = root.derivePath(CANTON_CONFIG.derivationPath);

        if (!child.privateKey) {
            throw new Error('Failed to derive private key');
        }

        // Generate namespace and party name from derived key
        const namespace = createHash('sha256')
            .update(child.publicKey.slice(0, 16))
            .digest('hex')
            .slice(0, 32);

        const partyName = createHash('sha256')
            .update(child.publicKey)
            .digest('hex');

        // Return Canton Party ID format
        return `${namespace}::${partyName}`;
    } catch (error: any) {
        console.error('Error deriving Canton Party ID:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            mnemonicLength: mnemonic ? mnemonic.split(' ').length : 0
        });
        throw new Error(`Failed to derive Canton address: ${error.message}`);
    }
}

/**
 * Get private key from mnemonic for transaction signing
 */
export function getPrivateKeyFromMnemonic(mnemonic: string): Buffer {
    try {
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        const bip32Instance = loadBip32();
        if (!bip32Instance) {
            throw new Error('BIP32 library failed to load');
        }

        const root = bip32Instance.fromSeed(seed);
        const child = root.derivePath(CANTON_CONFIG.derivationPath);

        if (!child.privateKey) {
            throw new Error('Failed to derive private key');
        }

        return child.privateKey;
    } catch (error) {
        console.error('Error getting private key:', error);
        throw new Error('Failed to get private key');
    }
}

/**
 * Check Canton Network Status (Public Endpoint)
 */
export async function checkCantonStatus(): Promise<{ round: number; timestamp: string } | null> {
    try {
        const response = await fetch(`${CANTON_CONFIG.rpcUrl}/round-of-latest-data`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Canton status check failed:', response.status);
            return null;
        }

        const data = await response.json();
        return {
            round: data.round,
            timestamp: data.timestamp
        };
    } catch (error) {
        console.error('Error checking Canton status:', error);
        return null;
    }
}

/**
 * Query CC balance for a Canton Party ID
 * Uses /v1/query/parties/balance (requires JWT)
 */
export async function getCantonBalance(partyId: string): Promise<number> {
    try {
        // If no JWT is configured, we can't query private balances
        if (!CANTON_CONFIG.jwtToken) {
            console.warn('Missing CANTON_JWT_TOKEN. Cannot query private balance.');
            return 0;
        }

        const response = await fetch(`${CANTON_CONFIG.rpcUrl}/v1/query/parties/balance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CANTON_CONFIG.jwtToken}`
            },
            body: JSON.stringify({
                parties: [partyId]
            })
        });

        if (!response.ok) {
            // Fallback to standard Daml JSON API if the specific endpoint fails
            if (response.status === 404) {
                return getCantonBalanceStandard(partyId);
            }
            const errorText = await response.text();
            throw new Error(`Failed to query balance: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        // Assuming response format: { result: { [partyId]: { balance: number } } } or similar
        // Adjust based on actual API response
        return data.result?.[partyId]?.balance || 0;

    } catch (error) {
        console.error('Error querying Canton balance:', error);
        return 0;
    }
}

/**
 * Fallback: Query CC balance using standard Daml JSON API /v1/query
 */
async function getCantonBalanceStandard(partyId: string): Promise<number> {
    try {
        const response = await fetch(`${CANTON_CONFIG.rpcUrl}/v1/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CANTON_CONFIG.jwtToken}`
            },
            body: JSON.stringify({
                templateIds: ['Canton.Coin:CC'],
                query: {
                    owner: partyId
                }
            })
        });

        if (!response.ok) return 0;

        const data = await response.json();
        const contracts = data.result || [];
        return contracts.reduce((sum: number, contract: any) => {
            return sum + (parseFloat(contract.payload?.amount || 0));
        }, 0);
    } catch (e) {
        return 0;
    }
}

/**
 * Send CC to another Canton Party ID
 * Uses /v1/submit/transaction (requires JWT)
 */
export async function sendCantonCC(
    fromPartyId: string,
    toPartyId: string,
    amount: number,
    privateKey: Buffer
): Promise<string> {
    try {
        if (!CANTON_CONFIG.jwtToken) {
            throw new Error('Missing CANTON_JWT_TOKEN. Cannot submit transaction.');
        }

        // Validate inputs
        if (!fromPartyId || !toPartyId) throw new Error('Invalid party IDs');
        if (amount <= 0) throw new Error('Amount must be greater than 0');

        const command = {
            templateId: 'Canton.Coin:Transfer',
            payload: {
                from: fromPartyId,
                to: toPartyId,
                amount: amount.toString(),
                currency: 'CC'
            }
        };

        // Note: Real signing usually happens client-side or via a signed command payload.
        // If the API accepts raw commands with JWT, it implies the JWT authorizes the 'actAs' party.

        const response = await fetch(`${CANTON_CONFIG.rpcUrl}/v1/submit/transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CANTON_CONFIG.jwtToken}`
            },
            body: JSON.stringify({
                commands: {
                    party: fromPartyId,
                    commands: [{
                        create: command
                    }]
                }
            })
        });

        const responseText = await response.text();
        console.log('Canton submit response:', response.status, responseText);

        if (!response.ok) {
            // Fallback to standard /v1/create
            if (response.status === 404) {
                return sendCantonCCStandard(command);
            }
            throw new Error(`Transaction failed: ${response.status} ${responseText}`);
        }

        const result = JSON.parse(responseText);
        return result.transactionId || result.commandId || "tx_submitted";

    } catch (error: any) {
        console.error('Error sending CC:', error);
        throw new Error(error.message || 'Failed to send CC');
    }
}

/**
 * Fallback: Send CC using standard Daml JSON API /v1/create
 */
async function sendCantonCCStandard(command: any): Promise<string> {
    const response = await fetch(`${CANTON_CONFIG.rpcUrl}/v1/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CANTON_CONFIG.jwtToken}`
        },
        body: JSON.stringify(command)
    });

    const responseText = await response.text();
    if (!response.ok) {
        throw new Error(`Transaction failed (Standard API): ${response.status} ${responseText}`);
    }
    const result = JSON.parse(responseText);
    return result.result?.contractId || "tx_submitted";
}

/**
 * Verify transaction on CantonScan
 */
export async function verifyTransaction(txHash: string): Promise<{
    success: boolean;
    amount?: number;
    from?: string;
    to?: string;
    timestamp?: number;
}> {
    try {
        console.log(`Verifying transaction: ${txHash}`);
        const response = await fetch(`${CANTON_CONFIG.cantonScanApi}/tx/${txHash}`);

        if (!response.ok) {
            console.error(`CantonScan API error: ${response.status} ${response.statusText}`);
            throw new Error('Transaction not found');
        }

        const data = await response.json();
        console.log('CantonScan response:', JSON.stringify(data, null, 2));

        return {
            success: data.status === 'success' || data.status === 'confirmed',
            amount: parseFloat(data.amount || 0),
            from: data.from,
            to: data.to,
            timestamp: data.timestamp
        };
    } catch (error) {
        console.error('Error verifying transaction:', error);
        return { success: false };
    }
}

/**
 * Validate Canton Party ID format
 */
export function isValidCantonAddress(address: string): boolean {
    const parts = address.split('::');
    if (parts.length !== 2) return false;
    const [namespace, partyName] = parts;
    const hexRegex = /^[0-9a-f]+$/i;
    return hexRegex.test(namespace) && hexRegex.test(partyName);
}

/**
 * Format Canton address for display
 */
export function formatCantonAddress(address: string): string {
    if (!address || !address.includes('::')) return address;
    const [namespace, partyName] = address.split('::');
    if (namespace.length <= 12 && partyName.length <= 12) return address;

    const shortNamespace = namespace.length > 12 ? `${namespace.slice(0, 6)}...${namespace.slice(-4)}` : namespace;
    const shortPartyName = partyName.length > 12 ? `${partyName.slice(0, 6)}...${partyName.slice(-4)}` : partyName;
    return `${shortNamespace}::${shortPartyName}`;
}