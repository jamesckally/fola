'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Register() {
    const [email, setEmail] = useState('');

    const router = useRouter();

    const handleRegister = () => {
        // Whitelist check + generate seed
        router.push('/seed');
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="glass p-8 rounded-2xl w-full max-w-md">
                <h1 className="text-2xl font-bold text-center mb-6">Sign Up</h1>
                <input
                    type="email"
                    placeholder="Gmail address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 bg-card rounded-xl mb-4"
                />
                <button onClick={handleRegister} className="btn-primary w-full">Create Account</button>
                <Link href="/login" className="text-secondary text-center block mt-4">Already have an account?</Link>
            </div>
        </div>
    );
}