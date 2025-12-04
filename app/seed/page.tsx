'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CardCenter from '../../components/layout/CardCenter';

export default function Seed() {
  const router = useRouter();
  const [seed] = useState('word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12');

  const handleSaved = () => {
    // Save seed to localStorage (encrypted in real version)
    localStorage.setItem('seed_saved', 'true');
    router.push('/verify'); // This was missing!
  };

  return (
    <CardCenter>
      <div className="glass p-8 rounded-2xl text-center space-y-6">
        <h1 className="text-2xl font-bold">Your Seed Phrase</h1>
        <p className="text-secondary">Save this securely</p>
        <div className="bg-card p-6 rounded-xl font-mono text-sm break-all">
          {seed}
        </div>
        <button onClick={handleSaved} className="btn-primary w-full text-lg">
          I Have Saved It
        </button>
      </div>
    </CardCenter>
  );
}