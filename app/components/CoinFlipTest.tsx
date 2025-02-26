"use client";

import { useState } from 'react';
import CoinFlip from './CoinFlip';

export default function CoinFlipTest() {
  const [showAnimations, setShowAnimations] = useState(false);

  return (
    <div className="min-h-screen bg-[#121212] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Coin Flip Animation Test</h1>
          <button
            onClick={() => setShowAnimations(true)}
            className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded"
          >
            Start Both Animations
          </button>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Heads Animation */}
          <div className="bg-[#1a1a1a] rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-center">Heads Result</h2>
            <CoinFlip
              result="Heads"
              shouldStartCountdown={showAnimations}
              onAnimationEnd={() => console.log('Heads animation complete')}
            />
          </div>

          {/* Tails Animation */}
          <div className="bg-[#1a1a1a] rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-center">Tails Result</h2>
            <CoinFlip
              result="Tails"
              shouldStartCountdown={showAnimations}
              onAnimationEnd={() => console.log('Tails animation complete')}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 