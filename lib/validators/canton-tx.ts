/**
 * Validates Canton transaction hash format
 * Canton transaction hashes are hexadecimal strings (typically 32-128 characters)
 */
export function isValidCantonTxHash(txHash: string): boolean {
    if (!txHash || typeof txHash !== 'string') {
        return false;
    }

    const trimmed = txHash.trim();

    // Canton transaction hashes are hex strings (flexible length: 32-128 characters)
    // This accommodates various Canton hash formats
    const hexPattern = /^[0-9a-fA-F]{32,128}$/;
    return hexPattern.test(trimmed);
}

/**
 * Validates Canton Party ID format
 * Format: {namespace}::{party_name} where both are hex strings
 */
export function isValidCantonPartyId(partyId: string): boolean {
    if (!partyId || typeof partyId !== 'string') {
        return false;
    }

    const parts = partyId.split('::');
    if (parts.length !== 2) {
        return false;
    }

    const [namespace, partyName] = parts;
    const hexRegex = /^[0-9a-f]+$/i;

    return hexRegex.test(namespace) && hexRegex.test(partyName);
}
