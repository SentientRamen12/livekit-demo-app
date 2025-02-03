'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [username, setUsername] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      alert('Please enter your name');
      return;
    }
    sessionStorage.setItem('username', username.trim());
    router.push('/gameroom');
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md p-8 bg-background border border-gray-200 rounded-lg">
        <h1 className="text-2xl font-bold text-center mb-8">Enter Chat Room</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground"
            required
          />
          <button 
            type="submit"
            className="w-full p-3 rounded-lg bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
          >
            Join Room
          </button>
        </form>
      </div>
    </main>
  );
}