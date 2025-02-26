import { Suspense } from 'react';
import GameViewContent from './GameViewContent';

export default function GameView() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    }>
      <GameViewContent />
    </Suspense>
  );
} 