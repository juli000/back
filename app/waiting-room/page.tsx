import { Suspense } from 'react';
import WaitingRoomContent from './WaitingRoomContent';

export default function WaitingRoom() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    }>
      <WaitingRoomContent />
    </Suspense>
  );
} 