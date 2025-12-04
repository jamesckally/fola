'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Login() {
    const [email, setEmail] = useState('');

    const handleLogin = () => {
        // Mock Gmail whitelist
        if (email.endsWith('@gmail.com')) {
            // Redirect to seed or dashboard
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="glass p-8 rounded-2xl w-full max-w-md">
                <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>
                <input
                    type="email"
                    placeholder="Gmail address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 bg-card rounded-xl mb-4"
                />
                <button onClick={handleLogin} className="btn-primary w-full">Continue</button>
                <Link href="/register" className="text-secondary text-center block mt-4">Don't have an account?</Link>
            </div>
        </div>
    );
}