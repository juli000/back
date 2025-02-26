'use client';

import { createClient } from '@/utils/supabase/server';
import { sharedStyles } from '../layout/styles';
import { useState, useEffect } from 'react';
import { verifyPayment, verifyPlayer2Payment, deleteGame, setCoinResult } from '@/app/actions';
import { useRouter } from 'next/navigation';
import AdminGameList from './AdminGameList';

interface Game {
  id: number;
  bet: number;
  key_type: string;
  date_created: string;
  user1: string;
  user1_call: string;
  payment_code?: string;
  user2?: string;
  user2_call?: string;
  user2_payment_code?: string;
  users_paid: number;
  user1_payment: boolean;
  user2_payment: boolean;
  isPending?: boolean;
  predetermined_result?: 'Heads' | 'Tails';
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // Check for existing auth state on mount
  useEffect(() => {
    const authState = localStorage.getItem('adminAuth');
    if (authState === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // You should move this to an environment variable in production
    const correctPassword = 'admin123';
    
    if (password === correctPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuth');
  };

  if (!isAuthenticated) {
    return (
      <div className={sharedStyles.container}>
        <div className={sharedStyles.contentWrapper}>
          <h1 className={sharedStyles.heading}>Admin Login</h1>
          
          <div className={sharedStyles.card}>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={sharedStyles.container}>
      <div className={sharedStyles.contentWrapper}>
        <div className="flex justify-between items-center mb-8">
          <h1 className={sharedStyles.heading}>Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
        <AdminGameList />
      </div>
    </div>
  );
}