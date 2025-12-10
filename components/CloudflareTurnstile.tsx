"use client";

import { Turnstile } from "@marsidev/react-turnstile";

interface CloudflareTurnstileProps {
    onSuccess: (token: string) => void;
    onError?: () => void;
    onExpire?: () => void;
}

export function CloudflareTurnstile({ onSuccess, onError, onExpire }: CloudflareTurnstileProps) {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!siteKey) {
        console.error("Turnstile site key not found");
        return null;
    }

    return (
        <div className="flex justify-center">
            <Turnstile
                siteKey={siteKey}
                onSuccess={onSuccess}
                onError={onError}
                onExpire={onExpire}
                options={{
                    theme: "dark",
                    size: "normal",
                }}
            />
        </div>
    );
}
