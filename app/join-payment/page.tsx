import { Suspense } from 'react';
import JoinPaymentContent from './JoinPaymentContent';

export default function JoinPayment() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    }>
      <JoinPaymentContent />
    </Suspense>
  );
} 