'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPendingGame } from '@/app/actions';

export default function CreateGame() {
  const router = useRouter();
  const [keyType, setKeyType] = useState('Skull Keys');
  const [numKeys, setNumKeys] = useState(4);
  const [call, setCall] = useState('Tails');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !numKeys) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const pendingGame = await createPendingGame({
        name,
        call,
        numKeys,
        keyType,
      });
      
      router.push(`/payment-confirmation?bet=${numKeys}&keyType=${keyType}&gameId=${pendingGame.id}&name=${name}`);
    } catch (error) {
      console.error('Failed to create game:', error);
      alert('Failed to create game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center pt-12">
      <h1 className="text-4xl font-bold mb-8">Create New Game</h1>
      
      <div className="bg-[#1a1a1a] rounded-lg p-8 w-full max-w-md">
        <div className="space-y-6">
          <div>
            <label className="block text-white mb-2">In-Game Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#2a2a2a] rounded p-2 text-white"
            />
          </div>

          <div>
            <label className="block text-white mb-2">Your Call</label>
            <select
              value={call}
              onChange={(e) => setCall(e.target.value)}
              className="w-full bg-[#2a2a2a] rounded p-2 text-white"
            >
              <option>Heads</option>
              <option>Tails</option>
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-white mb-2">Number of Keys</label>
              <input
                type="number"
                min="1"
                value={numKeys}
                onChange={(e) => setNumKeys(Number(e.target.value))}
                className="w-full bg-[#2a2a2a] rounded p-2 text-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-white mb-2">Key Type</label>
              <select
                value={keyType}
                onChange={(e) => setKeyType(e.target.value)}
                className="w-full bg-[#2a2a2a] rounded p-2 text-white"
              >
                <option>Skull Keys</option>
                <option>Gold Keys</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button 
              onClick={() => router.push('/')}
              className="flex-1 bg-[#2a2a2a] text-white py-3 rounded hover:bg-[#3a3a3a]"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 bg-white text-black py-3 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Game'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 