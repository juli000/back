'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { verifyPayment, verifyPlayer2Payment, deleteGame, setCoinResult } from '@/app/actions';

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
  payment_code?: string;
  user2_payment_code?: string;
  user1_payment: boolean;
  user2_payment: boolean;
  isPending?: boolean;
  predetermined_result?: 'Heads' | 'Tails';
}

export default function AdminGameList() {
  const supabase = createClient();
  const [games, setGames] = useState<Game[]>([]);
  const [verifyingGames, setVerifyingGames] = useState<Record<number, boolean>>({});
  const [deletingGames, setDeletingGames] = useState<Record<number, boolean>>({});
  const [settingResult, setSettingResult] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchGames();

    // Subscribe to changes in both tables
    const channel = supabase
      .channel('admin-games')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pending_games'
      }, () => {
        fetchGames();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'instruments'
      }, () => {
        fetchGames();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchGames = async () => {
    // Fetch pending games
    const { data: pendingGames } = await supabase
      .from('pending_games')
      .select()
      .order('date_created', { ascending: false });

    // Fetch active games
    const { data: activeGames } = await supabase
      .from('instruments')
      .select()
      .order('date_created', { ascending: false });

    // Transform pending games to match the Game interface
    const transformedPendingGames = (pendingGames || []).map(game => ({
      id: game.id,
      bet: game.bet,
      key_type: game.key_type,
      date_created: game.date_created,
      user1: game.user1,
      user1_call: game.user1_call,
      payment_code: game.payment_code,
      users_paid: 0,
      user1_payment: false,
      user2_payment: false,
      isPending: true
    }));

    // Filter out pending games that have already been moved to instruments
    const filteredPendingGames = transformedPendingGames.filter(pendingGame => {
      return !activeGames?.some(activeGame => 
        activeGame.user1 === pendingGame.user1 && 
        activeGame.bet === pendingGame.bet &&
        activeGame.key_type === pendingGame.key_type &&
        new Date(activeGame.date_created).getTime() === new Date(pendingGame.date_created).getTime()
      );
    });

    // Add isPending: false to active games
    const transformedActiveGames = (activeGames || []).map(game => ({
      ...game,
      isPending: false
    }));

    // Combine and sort all games by date
    const allGames = [...filteredPendingGames, ...transformedActiveGames]
      .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());

    setGames(allGames);
  };

  const handleVerifyPayment = async (gameId: number, isPlayer2: boolean) => {
    setVerifyingGames(prev => ({ ...prev, [gameId]: true }));
    try {
      if (isPlayer2) {
        await verifyPlayer2Payment(gameId);
      } else {
        await verifyPayment(gameId);
      }
      await fetchGames();
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Failed to verify payment. Please check console for details.');
    } finally {
      setVerifyingGames(prev => ({ ...prev, [gameId]: false }));
    }
  };

  const handleDeleteGame = async (gameId: number, isPending: boolean) => {
    if (!confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
      return;
    }

    setDeletingGames(prev => ({ ...prev, [gameId]: true }));
    try {
      await deleteGame(gameId, isPending);
      await fetchGames();
    } catch (error) {
      console.error('Error deleting game:', error);
      alert('Failed to delete game. Please check console for details.');
    } finally {
      setDeletingGames(prev => ({ ...prev, [gameId]: false }));
    }
  };

  const handleSetCoinResult = async (gameId: number, result: 'Heads' | 'Tails') => {
    setSettingResult(prev => ({ ...prev, [gameId]: true }));
    try {
      await setCoinResult(gameId, result);
      await fetchGames();
    } catch (error) {
      console.error('Error setting coin result:', error);
      alert('Failed to set coin result. Please check console for details.');
    } finally {
      setSettingResult(prev => ({ ...prev, [gameId]: false }));
    }
  };

  return (
    <div className="space-y-4">
      {games?.map((game) => (
        <div key={game.id} className="bg-[#1a1a1a] rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl text-white">
                {game.bet} {game.key_type} Game
                {game.isPending && (
                  <span className="ml-2 text-sm bg-yellow-500 text-black px-2 py-1 rounded">
                    Pending
                  </span>
                )}
              </h2>
              <p className="text-gray-400">Created: {new Date(game.date_created).toLocaleString()}</p>
              {game.payment_code && (
                <p className="text-gray-400 mt-1">Payment Code: {game.payment_code}</p>
              )}
              {!game.isPending && (
                <div className="mt-2">
                  <p className="text-gray-400">Coin Result: {game.predetermined_result || 'Not Set'}</p>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => handleSetCoinResult(game.id, 'Heads')}
                      disabled={settingResult[game.id]}
                      className={`px-3 py-1 rounded ${
                        game.predetermined_result === 'Heads'
                          ? 'bg-green-600'
                          : 'bg-blue-500 hover:bg-blue-600'
                      } text-white disabled:opacity-50`}
                    >
                      Heads
                    </button>
                    <button
                      onClick={() => handleSetCoinResult(game.id, 'Tails')}
                      disabled={settingResult[game.id]}
                      className={`px-3 py-1 rounded ${
                        game.predetermined_result === 'Tails'
                          ? 'bg-green-600'
                          : 'bg-blue-500 hover:bg-blue-600'
                      } text-white disabled:opacity-50`}
                    >
                      Tails
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 px-3 py-1 rounded-full text-sm">
                {game.users_paid}/2 Players Paid
              </div>
              <button
                onClick={() => handleDeleteGame(game.id, game.isPending || false)}
                disabled={deletingGames[game.id]}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {deletingGames[game.id] ? 'Deleting...' : 'Delete Game'}
              </button>
            </div>
          </div>

          {/* Player 1 Section */}
          <div className="bg-[#2a2a2a] p-4 rounded mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg text-white mb-2">Player 1: {game.user1}</h3>
                <p className="text-gray-400">Call: {game.user1_call}</p>
                {game.payment_code && (
                  <p className="text-gray-400 mt-1">Payment Code: {game.payment_code}</p>
                )}
              </div>
              {!game.user1_payment && (
                <button
                  onClick={() => handleVerifyPayment(game.id, false)}
                  disabled={verifyingGames[game.id]}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {verifyingGames[game.id] ? 'Verifying...' : 'Verify Payment'}
                </button>
              )}
              {game.user1_payment && (
                <span className="text-green-500">✓ Payment Verified</span>
              )}
            </div>
          </div>

          {/* Player 2 Section */}
          <div className="bg-[#2a2a2a] p-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                {game.user2 ? (
                  <>
                    <h3 className="text-lg text-white mb-2">Player 2: {game.user2}</h3>
                    <p className="text-gray-400">Call: {game.user2_call}</p>
                    {game.user2_payment_code && (
                      <p className="text-gray-400 mt-1">Payment Code: {game.user2_payment_code}</p>
                    )}
                  </>
                ) : (
                  <h3 className="text-lg text-gray-400">Waiting for Player 2 to join...</h3>
                )}
              </div>
              {game.user2 && !game.user2_payment && (
                <button
                  onClick={() => handleVerifyPayment(game.id, true)}
                  disabled={verifyingGames[game.id]}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {verifyingGames[game.id] ? 'Verifying...' : 'Verify Payment'}
                </button>
              )}
              {game.user2_payment && (
                <span className="text-green-500">✓ Payment Verified</span>
              )}
            </div>
          </div>

          {/* Game Status */}
          <div className="mt-4 text-gray-400">
            <p>Status: {
              game.users_paid === 2 
                ? 'Game Ready' 
                : game.user2 
                  ? 'Waiting for Payments' 
                  : 'Waiting for Player 2'
            }</p>
          </div>
        </div>
      ))}
    </div>
  );
} 