'use client';

import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sharedStyles } from './layout/styles';
import { useEffect, useState } from 'react';
import RecentOutcomes from './components/RecentOutcomes';

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
      <div className="flex items-center p-4 bg-[#1a1a1a] gap-4">
        <div className="flex items-center gap-3">
          <img src="/favicon.ico" alt="Logo" className="w-8 h-8" />
          <h1 className="text-2xl font-bold text-white">DnDFlips</h1>
        </div>
        <a 
          href="https://discord.gg/s5FhyRty2S"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z"/>
          </svg>
          Discord
        </a>
        <div className="flex-grow"></div>
        <Link href="/create">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Create Game
          </button>
        </Link>
      </div>

      <RecentOutcomes />

      <div className="px-4 pb-4 mt-4">
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
