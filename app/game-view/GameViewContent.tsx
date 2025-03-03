'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { sharedStyles } from '../layout/styles';
import CoinFlip from '@/app/components/CoinFlip';

interface Game {
  id: number;
  bet: number;
  key_type: string;
  user1: string;
  user1_call: string;
  user2?: string;
  users_paid: number;
  date_created: string;
  user2_call?: string;
  result?: string;
  completed_games?: {
    coin_result: 'Heads' | 'Tails';
    winner_name: string;
  };
  predetermined_result?: 'Heads' | 'Tails';
}

export default function GameViewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [showCoinFlip, setShowCoinFlip] = useState(false);
  const [coinResult, setCoinResult] = useState<'Heads' | 'Tails'>('Heads');
  const [winner, setWinner] = useState<'player1' | 'player2' | null>(null);
  const [hasSpun, setHasSpun] = useState(false);
  const [shouldStartCountdown, setShouldStartCountdown] = useState(false);
  const [isFirstSpin, setIsFirstSpin] = useState(true);
  const [showWinner, setShowWinner] = useState(false);
  const gameId = searchParams.get('gameId');

  const determineWinner = async (result: 'Heads' | 'Tails') => {
    if (!game || !game.user2) return;
    
    // Determine winner based on the coin result and player calls
    const player1Call = game.user1_call;
    const player2Call = player1Call === 'Heads' ? 'Tails' : 'Heads';
    
    // The winner is the player whose call matches the result
    const winnerName = result === player1Call ? game.user1 : game.user2;
    setWinner(result === player1Call ? 'player1' : 'player2');

    // Show winner after animation completes
    setShowWinner(true);
    setIsFirstSpin(false);
  };

  useEffect(() => {
    const fetchGame = async () => {
      // Use the client-side Supabase instance
      const supabase = createClient();
      const { data: game } = await supabase
        .from('instruments')
        .select('*')
        .eq('id', gameId)
        .single();

      if (game) {
        setGame(game);
        if (game.predetermined_result && game.users_paid === 2) {
          // For games with a predetermined result, show the coin but don't show winner yet
          setCoinResult(game.predetermined_result);
          setShowCoinFlip(true);
          setShouldStartCountdown(true);
          setIsFirstSpin(true);
          setShowWinner(false);
        }
      }
    };

    if (gameId) {
      fetchGame();
      
      // Set up real-time subscription for payment updates
      const supabase = createClient();
      const channel = supabase
        .channel('game-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'instruments',
          filter: `id=eq.${gameId}`
        }, (payload: any) => {
          if (payload.new && payload.new.users_paid === 2) {
            fetchGame();
          }
        })
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [gameId]);

  const handleJoinGame = () => {
    if (!game) return;
    router.push(`/join-payment?gameId=${game.id}&bet=${game.bet}&keyType=${game.key_type}&player1Call=${game.user1_call}`);
  };

  const handleExit = () => {
    router.push('/');
  };

  if (!game) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center relative overflow-hidden">
      <div className="fixed top-4 left-4 z-10">
        <button
          onClick={handleExit}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold
            transform hover:-translate-y-1 transition-all duration-200
            shadow-[0_8px_0_rgb(185,28,28),0_15px_20px_rgba(0,0,0,0.35)]
            active:translate-y-1 active:shadow-[0_4px_0_rgb(185,28,28),0_8px_10px_rgba(0,0,0,0.35)]
            border-b-4 border-red-700 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l5.293 5.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Exit Game
        </button>
      </div>

      <div className="w-full max-w-4xl px-4">
        <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-300">Coin Flip</h1>
        
        <div className="bg-[#1a1a1a]/80 backdrop-blur-md rounded-lg p-8
          shadow-[0_0_15px_rgba(255,255,255,0.1),inset_0_0_15px_rgba(255,255,255,0.05)]
          border border-white/10 hover:border-white/20 transition-all duration-300
          bg-gradient-to-b from-white/5 to-transparent min-h-[600px]">
          <div className="space-y-8 h-full flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl text-white">
                  {game.bet} {game.key_type}
                </h2>
                <p className="text-gray-400 mt-1">Created: {new Date(game.date_created).toLocaleString()}</p>
              </div>
              <div className="bg-blue-500/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                {game.users_paid}/2 Players
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 flex-shrink-0">
              {/* Player 1 */}
              <div 
                className={`bg-[#1a1a1a]/50 backdrop-blur-sm rounded-lg p-6 min-h-[180px]
                  shadow-[0_0_10px_rgba(255,255,255,0.05)]
                  border border-white/5 transition-all duration-500
                  ${winner === 'player1' && showWinner ? 'border-2 border-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : ''}`}
              >
                <h3 className="font-semibold mb-2">Player 1</h3>
                <div className="space-y-2">
                  <p className="text-gray-400">Name</p>
                  <p className="font-semibold">{game?.user1}</p>
                  <p className="text-gray-400">Call</p>
                  <p className="font-semibold">{game?.user1_call}</p>
                  {winner === 'player1' && showWinner && (
                    <div className="text-green-500 font-bold mt-2 animate-bounce">Winner! 🎉</div>
                  )}
                </div>
              </div>

              {/* Player 2 */}
              <div 
                className={`bg-[#1a1a1a]/50 backdrop-blur-sm rounded-lg p-6 min-h-[180px]
                  shadow-[0_0_10px_rgba(255,255,255,0.05)]
                  border border-white/5 transition-all duration-500
                  ${winner === 'player2' && showWinner ? 'border-2 border-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : ''}`}
              >
                <h3 className="font-semibold mb-2">Player 2</h3>
                {game?.user2 ? (
                  <div className="space-y-2">
                    <p className="text-gray-400">Name</p>
                    <p className="font-semibold">{game.user2}</p>
                    <p className="text-gray-400">Call</p>
                    <p className="font-semibold">{game.user2_call || (game.user1_call === 'Heads' ? 'Tails' : 'Heads')}</p>
                    {winner === 'player2' && showWinner && (
                      <div className="text-green-500 font-bold mt-2 animate-bounce">Winner! 🎉</div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-24 space-y-4">
                    <p className="text-gray-400">Waiting for player to join...</p>
                    <button
                      onClick={handleJoinGame}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold
                        transform hover:-translate-y-1 transition-all duration-200
                        shadow-[0_8px_0_rgb(29,78,216),0_15px_20px_rgba(0,0,0,0.35)]
                        active:translate-y-1 active:shadow-[0_4px_0_rgb(29,78,216),0_8px_10px_rgba(0,0,0,0.35)]
                        border-b-4 border-blue-700"
                    >
                      Join Game
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Coin Flip */}
            <div className="flex-grow flex flex-col items-center justify-center min-h-[250px]">
              {showCoinFlip && game?.users_paid === 2 ? (
                <CoinFlip 
                  result={coinResult}
                  onAnimationEnd={() => {
                    setHasSpun(true);
                    determineWinner(coinResult);
                  }}
                  isCompleted={!!game.completed_games}
                  shouldStartCountdown={shouldStartCountdown}
                  isFirstSpin={isFirstSpin}
                />
              ) : (
                <p className="text-gray-400 text-center">
                  {game?.users_paid === 2 
                    ? 'Preparing game...'
                    : 'Waiting for second player to join'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 