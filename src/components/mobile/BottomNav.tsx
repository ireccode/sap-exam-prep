import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Book, Brain, MessageSquare, Home } from 'lucide-react';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/training', icon: Book, label: 'Training' },
    { path: '/mini-exam', icon: Brain, label: 'Exam' },
    { path: '/ai-chat', icon: MessageSquare, label: 'Chat' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1
              ${location.pathname === path ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}