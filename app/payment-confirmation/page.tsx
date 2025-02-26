import { Suspense } from 'react';
import PaymentConfirmationContent from './PaymentConfirmationContent';

export default function PaymentConfirmation() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    }>
      <PaymentConfirmationContent />
    </Suspense>
  );
} 