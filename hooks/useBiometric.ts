import { useState, useEffect } from "react";
import {
    isBiometricAvailable,
    registerBiometric,
    authenticateBiometric,
    isBiometricRegistered,
} from "@/lib/biometric";

export function useBiometric(userEmail?: string) {
    const [isAvailable, setIsAvailable] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    useEffect(() => {
        // Check availability on mount
        isBiometricAvailable().then(setIsAvailable);

        // Check if registered for this specific email
        if (userEmail) {
            setIsRegistered(isBiometricRegistered(userEmail));
        } else {
            setIsRegistered(false);
        }
    }, [userEmail]);

    /**
     * Authenticate user with biometric
     */
    const authenticate = async (): Promise<{ success: boolean; error?: string }> => {
        if (!isAvailable) {
            return { success: false, error: "Biometric authentication not available on this device" };
        }

        if (!isRegistered) {
            return { success: false, error: "Biometric not registered. Please register first." };
        }

        if (!userEmail) {
            return { success: false, error: "User email is required for authentication" };
        }

        setIsAuthenticating(true);
        try {
            const result = await authenticateBiometric(userEmail);
            return result;
        } finally {
            setIsAuthenticating(false);
        }
    };

    /**
     * Register biometric credential for user
     */
    const register = async (email: string): Promise<{ success: boolean; error?: string }> => {
        if (!isAvailable) {
            return { success: false, error: "Biometric authentication not available on this device" };
        }

        setIsRegistering(true);
        try {
            const result = await registerBiometric(email);
            if (result.success) {
                setIsRegistered(true);
            }
            return result;
        } finally {
            setIsRegistering(false);
        }
    };

    return {
        isAvailable,
        isRegistered,
        isAuthenticating,
        isRegistering,
        authenticate,
        register,
    };
}
