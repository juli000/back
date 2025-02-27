'use client';

import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sharedStyles } from './layout/styles';
import { useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    
    const fetchGames = async () => {
      const { data } = await supabase
        .from('instruments')
        .select()
        .order('date_created', { ascending: false });
      
      // Sort games: joinable games first, then by date
      const sortedGames = data?.sort((a, b) => {
        // First, sort by joinable status (users_paid < 2)
        if (a.users_paid < 2 && b.users_paid === 2) return -1;
        if (a.users_paid === 2 && b.users_paid < 2) return 1;
        
        // If both games have the same joinable status, sort by date (newest first)
        return new Date(b.date_created).getTime() - new Date(a.date_created).getTime();
      });

      setGames(sortedGames || []);
    };

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

  const handleJoinGame = (gameId: number) => {
    router.push(`/game-view?gameId=${gameId}`);
  };

  const getKeyColor = (keyType: string) => {
    return keyType === 'Gold Keys' ? 'text-yellow-500' : 'text-blue-700';
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      <div className="flex justify-between items-center p-4 bg-[#1a1a1a] relative">
        <a 
          href="https://discord.gg/kJjsweaB"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded"
        >
          Discord
        </a>
        <h1 className="text-2xl font-bold text-white absolute left-1/2 -translate-x-1/2">DnDFlips</h1>
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
                <h2 className="text-xl text-white mb-2">
                  {game.user1}&nbsp;&nbsp;&nbsp;&nbsp;{game.bet}{' '}
                  <span className={getKeyColor(game.key_type)}>
                    {game.key_type}
                  </span>
                </h2>
                {game.user2 && (
                  <p className="text-gray-400">
                    vs {game.user2}
                  </p>
                )}
              </div>
              <button 
                onClick={() => handleJoinGame(game.id)}
                className={`${
                  game.users_paid === 2 
                    ? 'bg-gray-500 hover:bg-gray-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white px-4 py-2 rounded`}
              >
                {game.users_paid === 2 ? 'View Game' : 'Join Game'}
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
