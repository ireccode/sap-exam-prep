import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Book, Brain, MessageSquare, Home } from 'lucide-react';
import { useExamStore } from "@/store/useExamStore";
import { useTrainingStore } from "@/store/useTrainingStore";

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const resetExam = useExamStore(state => state.endExam);
  const resetTraining = useTrainingStore(state => state.resetTraining);

  const handleNavigation = (path: string) => {
    // Reset both stores when navigating
    resetExam();
    resetTraining();
    navigate(path);
  };

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
            onClick={() => handleNavigation(path)}
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