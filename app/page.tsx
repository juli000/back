'use client';

import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sharedStyles } from './layout/styles';
import { useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    fetchGames();

    // Subscribe to changes
    const channel = supabase
      .channel('home-games')
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
    const { data } = await supabase
      .from('instruments')
      .select()
      .order('date_created', { ascending: false });
    setGames(data || []);
  };

  const handleJoinGame = (gameId: number) => {
    router.push(`/game-view?gameId=${gameId}`);
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      <div className="flex justify-between items-center p-4 bg-[#1a1a1a]">
        <h1 className="text-2xl font-bold text-white">DnDFlips</h1>
        <Link href="/create">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Create Game
          </button>
        </Link>
      </div>

      <div className="p-4">
        {games?.map((game) => (
          <div key={game.id} className="bg-[#1a1a1a] rounded-lg p-6 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl text-white">
                  {game.user1} - {game.bet} {game.key_type}
                </h2>
                <p className="text-gray-400">Status: Waiting for Player 2</p>
              </div>
              <button 
                onClick={() => handleJoinGame(game.id)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Join Game
              </button>
            </div>

            <div className="mt-4 flex justify-between text-gray-400">
              <p>Players: {game.users_paid}/2</p>
              <p>Created: {new Date(game.date_created).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
