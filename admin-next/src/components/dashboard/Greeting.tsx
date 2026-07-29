'use client';
import { useEffect, useState } from 'react';

export default function Greeting() {
  const [greeting, setGreeting] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) setGreeting('Bonjour');
    else if (hour < 18) setGreeting('Bon après-midi');
    else setGreeting('Bonsoir');
    
    setDate(now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  }, []);

  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center text-2xl">
        {greeting === 'Bonjour' ? '🌅' : greeting === 'Bon après-midi' ? '☀️' : '🌙'}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">{greeting} !</p>
        <p className="text-xs text-gray-400 capitalize">{date}</p>
      </div>
    </div>
  );
}
