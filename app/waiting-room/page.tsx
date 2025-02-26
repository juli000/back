'use client';

import { useSearchParams } from 'next/navigation';
import { sharedStyles } from '../layout/styles';

export default function WaitingRoom() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get('gameId');

  return (
    <div className={sharedStyles.container}>
      <div className={sharedStyles.contentWrapper}>
        <h1 className={sharedStyles.heading}>Waiting Room</h1>
        
        <div className={sharedStyles.card}>
          <div className={sharedStyles.infoBox}>
            <div className="text-center space-y-4">
              <h2 className={sharedStyles.subHeading}>Waiting for Player 2</h2>
              <p className="text-gray-400">
                Your payment has been confirmed. Please wait while another player joins the game.
              </p>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 