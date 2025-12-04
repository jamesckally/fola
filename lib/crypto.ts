import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from 'bip39';
import { Wallet } from 'ethers';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Get encryption key from environment variable
 */
function getEncryptionKey(): Buffer {
    const key = process.env.WALLET_ENCRYPTION_KEY;
    if (!key) {
        throw new Error('WALLET_ENCRYPTION_KEY is not set in environment variables');
    }
    return Buffer.from(key, 'hex');
}

/**
 * Generate a 12-word mnemonic phrase
 */
export function generateMnemonicPhrase(): string {
    // 128 bits = 12 words
    return generateMnemonic(128);
}

/**
 * Validate a mnemonic phrase
 */
export function isValidMnemonic(mnemonic: string): boolean {
    return validateMnemonic(mnemonic);
}

/**
 * Derive wallet from mnemonic phrase
 */
export function deriveWalletFromMnemonic(mnemonic: string): { address: string; privateKey: string } {
    if (!isValidMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
    }

    const wallet = Wallet.fromPhrase(mnemonic);
    return {
        address: wallet.address,
        privateKey: wallet.privateKey,
    };
}

/**
 * Encrypt mnemonic phrase using AES-256-GCM
 */
export function encryptMnemonic(mnemonic: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(mnemonic, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine salt + iv + authTag + encrypted data
    const combined = Buffer.concat([
        salt,
        iv,
        authTag,
        Buffer.from(encrypted, 'hex')
    ]);

    return combined.toString('base64');
}

/**
 * Decrypt mnemonic phrase using AES-256-GCM
 */
export function decryptMnemonic(encryptedData: string): string {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedData, 'base64');

    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Verify specific words from a mnemonic phrase
 */
export function verifyMnemonicWords(
    mnemonic: string,
    wordIndices: number[],
    providedWords: string[]
): boolean {
    const words = mnemonic.split(' ');

    for (let i = 0; i < wordIndices.length; i++) {
        const index = wordIndices[i];
        if (index < 0 || index >= words.length) {
            return false;
        }
        if (words[index].toLowerCase() !== providedWords[i].toLowerCase()) {
            return false;
        }
    }

    return true;
}

/**
 * Get random word indices for verification
 */
export function getRandomWordIndices(count: number = 2, totalWords: number = 12): number[] {
    const indices: number[] = [];
    while (indices.length < count) {
        const randomIndex = Math.floor(Math.random() * totalWords);
        if (!indices.includes(randomIndex)) {
            indices.push(randomIndex);
        }
    }
    return indices.sort((a, b) => a - b);
}
