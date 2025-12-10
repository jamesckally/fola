/**
 * Lightweight Biometric Authentication using WebAuthn API
 * Supports: Fingerprint, Face ID, Windows Hello, Touch ID
 */

const RP_NAME = "SwapaWallet";
const RP_ID = typeof window !== "undefined" ? window.location.hostname : "localhost";

/**
 * Check if biometric authentication is available on this device
 */
export async function isBiometricAvailable(): Promise<boolean> {
    if (typeof window === "undefined") return false;

    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
        return false;
    }

    // Check if platform authenticator (biometric) is available
    try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return available;
    } catch (error) {
        console.error("Error checking biometric availability:", error);
        return false;
    }
}

/**
 * Register a new biometric credential for the user
 */
export async function registerBiometric(userEmail: string): Promise<{ success: boolean; credentialId?: string; error?: string }> {
    try {
        // Generate a random challenge
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        // Create credential options
        const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
            challenge,
            rp: {
                name: RP_NAME,
                id: RP_ID,
            },
            user: {
                id: new TextEncoder().encode(userEmail),
                name: userEmail,
                displayName: userEmail.split("@")[0],
            },
            pubKeyCredParams: [
                { alg: -7, type: "public-key" },  // ES256
                { alg: -257, type: "public-key" }, // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: "platform", // Use platform authenticator (biometric)
                userVerification: "required",
                requireResidentKey: false,
            },
            timeout: 60000,
            attestation: "none",
        };

        // Create credential
        const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions,
        }) as PublicKeyCredential;

        if (!credential) {
            return { success: false, error: "Failed to create credential" };
        }

        // Store credential ID in localStorage (email-specific key)
        const credentialId = arrayBufferToBase64(credential.rawId);
        const storageKey = `biometric_credential_${userEmail}`;
        localStorage.setItem(storageKey, credentialId);

        return { success: true, credentialId };
    } catch (error: any) {
        console.error("Biometric registration error:", error);

        if (error.name === "NotAllowedError") {
            return { success: false, error: "Biometric registration was cancelled" };
        }

        return { success: false, error: error.message || "Failed to register biometric" };
    }
}

/**
 * Authenticate using biometric credential
 */
export async function authenticateBiometric(userEmail: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Get stored credential ID for this specific email
        const storageKey = `biometric_credential_${userEmail}`;
        const storedCredentialId = localStorage.getItem(storageKey);

        if (!storedCredentialId) {
            return { success: false, error: "No biometric credential found. Please register first." };
        }

        // Generate a random challenge
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        // Create authentication options
        const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
            challenge,
            allowCredentials: [
                {
                    id: base64ToArrayBuffer(storedCredentialId),
                    type: "public-key",
                    transports: ["internal"],
                },
            ],
            timeout: 60000,
            userVerification: "required",
            rpId: RP_ID,
        };

        // Get credential
        const assertion = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions,
        }) as PublicKeyCredential;

        if (!assertion) {
            return { success: false, error: "Authentication failed" };
        }

        return { success: true };
    } catch (error: any) {
        console.error("Biometric authentication error:", error);

        if (error.name === "NotAllowedError") {
            return { success: false, error: "Authentication was cancelled" };
        }

        return { success: false, error: error.message || "Authentication failed" };
    }
}

/**
 * Check if user has registered biometric credential for specific email
 */
export function isBiometricRegistered(userEmail: string): boolean {
    if (typeof window === "undefined") return false;
    const storageKey = `biometric_credential_${userEmail}`;
    return !!localStorage.getItem(storageKey);
}

/**
 * Clear stored biometric credentials for specific email
 */
export function clearBiometricCredentials(userEmail: string): void {
    if (typeof window === "undefined") return;
    const storageKey = `biometric_credential_${userEmail}`;
    localStorage.removeItem(storageKey);
}

/**
 * Clear ALL biometric credentials (for logout/cleanup)
 */
export function clearAllBiometricCredentials(): void {
    if (typeof window === "undefined") return;
    // Clear all biometric_credential_* keys
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.startsWith("biometric_credential_")) {
            localStorage.removeItem(key);
        }
    });
}

// Helper functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}
