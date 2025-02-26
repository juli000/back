'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function PaymentConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentCode, setPaymentCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  
  const gameId = searchParams.get('gameId');
  const bet = searchParams.get('bet');
  const keyType = searchParams.get('keyType');
  const tax = searchParams.get('tax');
  const isPlayer2 = searchParams.get('isPlayer2') === 'true';
  const userName = searchParams.get('name');

  useEffect(() => {
    if (!gameId) return;
    
    const supabase = createClient();

    const checkVerification = async () => {
      if (isPlayer2) {
        // For player 2, check instruments table
        const { data: game } = await supabase
          .from('instruments')
          .select('*')
          .eq('id', gameId)
          .single();

        if (game?.user2_payment) {
          setIsVerified(true);
          router.push(`/game-view?gameId=${gameId}`);
        } else {
          setPaymentCode(searchParams.get('paymentCode') || '');
        }
      } else {
        // For player 1, first check pending_games
        const { data: pendingGame } = await supabase
          .from('pending_games')
          .select('payment_code')
          .eq('id', gameId)
          .single();

        if (!pendingGame) {
          // If not in pending_games, check instruments
          const { data: game } = await supabase
            .from('instruments')
            .select('*')
            .eq('user1', userName)
            .order('date_created', { ascending: false })
            .limit(1)
            .single();

          if (game) {
            setIsVerified(true);
            router.push(`/game-view?gameId=${game.id}`);
          }
        } else {
          setPaymentCode(pendingGame.payment_code);
        }
      }
    };

    // Set up real-time subscriptions
    const channel = supabase
      .channel('payment-verification')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'instruments'
      }, async (payload: any) => {
        console.log('Instruments change:', payload);
        
        if (isPlayer2 && payload.new.id === Number(gameId)) {
          // For player 2, check if their payment was verified
          if (payload.new.user2_payment) {
            setIsVerified(true);
            router.push(`/game-view?gameId=${gameId}`);
          }
        } else if (!isPlayer2 && payload.new.user1 === userName) {
          // For player 1, check if this is their new game
          setIsVerified(true);
          router.push(`/game-view?gameId=${payload.new.id}`);
        }
      })
      .subscribe();

    // Initial check
    checkVerification();

    // Poll for changes every 2 seconds as backup
    const intervalId = setInterval(checkVerification, 2000);

    return () => {
      channel.unsubscribe();
      clearInterval(intervalId);
    };
  }, [gameId, router, isPlayer2, searchParams, userName]);

  if (isVerified) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center pt-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        <p className="mt-4">Payment verified! Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center pt-12">
      <h1 className="text-4xl font-bold mb-8">Payment Required</h1>
      
      <div className="bg-[#1a1a1a] rounded-lg p-8 w-full max-w-md">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
            <div className="bg-[#2a2a2a] p-4 rounded-lg">
              <p className="mb-2">Amount: {bet} {keyType}</p>
              <p className="mb-4">Tax: {tax}</p>
              <p className="text-gray-400">Send to bot: @DnDFlips</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Your Unique Code</h2>
            <div className="bg-[#2a2a2a] p-4 rounded-lg">
              <p className="font-mono text-xl text-center select-all">{paymentCode}</p>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Copy this code and paste it in the game chat after sending payment
            </p>
          </div>

          <div className="bg-[#2a2a2a] p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>Send the required payment to @DnDFlips</li>
              <li>Copy your unique code</li>
              <li>Paste the code in game chat</li>
              <li>Wait for admin confirmation</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 