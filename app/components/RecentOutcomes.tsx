'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Outcome {
  id: number;
  predetermined_result: 'Heads' | 'Tails';
}

export default function RecentOutcomes() {
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    
    const fetchOutcomes = async () => {
      try {
        setLoading(true);
        const { data, error: queryError } = await supabase
          .from('instruments')
          .select('id, predetermined_result')
          .not('predetermined_result', 'is', null)
          .order('date_created', { ascending: false })
          .limit(10);
        
        if (queryError) {
          throw queryError;
        }
        
        setOutcomes(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching outcomes:', err);
        setError('Failed to fetch outcomes');
      } finally {
        setLoading(false);
      }
    };

    fetchOutcomes();

    // Subscribe to changes
    const channel = supabase
      .channel('recent-outcomes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'instruments'
      }, () => {
        fetchOutcomes();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <div className="pt-4 pb-2">
      {loading && (
        <div className="text-gray-400 px-4">Loading outcomes...</div>
      )}
      
      {error && (
        <div className="text-red-500 px-4">Error: {error}</div>
      )}
      
      {!loading && !error && outcomes.length === 0 && (
        <div className="text-gray-400 px-4">No recent outcomes available</div>
      )}
      
      {!loading && !error && outcomes.length > 0 && (
        <div className="flex items-center gap-4 px-4 overflow-hidden">
          <div className="text-white font-medium whitespace-nowrap">Recent flips:</div>
          <div className="flex gap-2 flex-1">
            {outcomes.map((outcome) => (
              <div
                key={outcome.id}
                className="flex-1 bg-[#2a2a2a] p-1 rounded-lg text-center"
              >
                <div className={`text-base font-bold ${
                  outcome.predetermined_result === 'Heads' 
                    ? 'text-yellow-500' 
                    : 'text-blue-500'
                }`}>
                  {outcome.predetermined_result}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 