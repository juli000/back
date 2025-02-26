'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { joinGame } from '@/app/actions';
import { sharedStyles } from '../layout/styles';

export default function JoinPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const gameId = searchParams.get('gameId');
  const bet = searchParams.get('bet');
  const keyType = searchParams.get('keyType');
  const player1Call = searchParams.get('player1Call');
  const player2Call = player1Call === 'Heads' ? 'Tails' : 'Heads';

  const handleSubmit = async () => {
    if (!name || !gameId) {
      alert('Please enter your in-game name');
      return;
    }

    setIsLoading(true);
    try {
      const result = await joinGame({
        gameId: Number(gameId),
        name,
        call: player2Call
      });

      if (result.success && result.payment_code) {
        router.push(`/payment-confirmation?gameId=${gameId}&bet=${bet}&keyType=${keyType}&isPlayer2=true&name=${name}&paymentCode=${result.payment_code}`);
      }
    } catch (error) {
      console.error('Error joining game:', error);
      alert('Failed to join game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={sharedStyles.container}>
      <div className={sharedStyles.contentWrapper}>
        <h1 className={sharedStyles.heading}>Join Game</h1>
        
        <div className={sharedStyles.card}>
          <div className="space-y-6">
            <div>
              <label className="block text-white mb-2">In-Game Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#2a2a2a] rounded p-2 text-white"
                placeholder="Enter your in-game name"
              />
            </div>

            <div>
              <label className="block text-white mb-2">Your Call</label>
              <div className="bg-[#2a2a2a] p-4 rounded">
                <p className="text-white">{player2Call}</p>
                <p className="text-gray-400 text-sm mt-1">
                  (Automatically assigned as opposite of Player 1's call: {player1Call})
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
              <div className={sharedStyles.infoBox}>
                <p className="mb-2">Amount: {bet} {keyType}</p>
                <p className="text-gray-400">Send to bot: @DnDFlips</p>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full ${sharedStyles.button.primary}`}
            >
              {isLoading ? 'Joining...' : 'Continue to Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 