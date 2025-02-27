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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('adminAuth', 'true');
        setError('');
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuth');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800 rounded-lg p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-white focus:outline-none"
                placeholder="Enter admin password"
              />
            </div>
            
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            
            <button
              type="submit"
              className="w-full bg-white text-black py-2 rounded hover:bg-gray-200 transition-colors"
            >
              Login
            </button>
          </form>
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