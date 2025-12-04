'use client';
import { useRouter } from 'next/navigation';
import CardCenter from '../../components/layout/CardCenter';

export default function Verify() {
  const router = useRouter();

  const handleVerify = () => {
    // In real version: check words match
    router.push('/dashboard');
  };

  return (
    <CardCenter>
      <div className="glass p-8 rounded-2xl text-center space-y-6">
        <h1 className="text-2xl font-bold">Verify Seed Phrase</h1>
        <p className="text-secondary">Enter word #4 and #9</p>
        <input placeholder="Word 4" className="w-full p-3 bg-card rounded-xl mb-4" />
        <input placeholder="Word 9" className="w-full p-3 bg-card rounded-xl mb-6" />
        <button onClick={handleVerify} className="btn-primary w-full text-lg">
          Create Wallet
        </button>
      </div>
    </CardCenter>
  );
}