import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, GraduationCap, BookMarked, Trophy, Mail, Store, FileEdit, AlertCircle, Heart } from 'lucide-react';

function Sidebar() {
  const location = useLocation();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: '2-digit' });

  const menuItems = [
    { icon: BookOpen, text: 'Training Deck', path: '/' },
    { icon: GraduationCap, text: 'Mini Exam Deck', path: '/exam' },
    { icon: BookMarked, text: 'SAP Glossary', path: '/glossary' },
    { icon: Trophy, text: 'My Scores', path: '/scores' },
  ];

  const bottomItems = [
    { icon: Mail, text: 'Email Feedback' },
    { icon: Store, text: 'App Store Listing' },
    { icon: FileEdit, text: 'Write A Review' },
    { icon: AlertCircle, text: 'Disclaimer' },
    { icon: Heart, text: 'About' },
  ];

  return (
    <div className="w-64 bg-blue-600 text-white min-h-screen p-4 flex flex-col">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold mb-2">Menu</h1>
        <p className="text-sm opacity-80">Today is {today}</p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xs uppercase tracking-wider mb-3">CERTIFICATION</h2>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.text}
                  to={item.path}
                  className={`flex items-center space-x-3 p-2 rounded-lg ${
                    location.pathname === item.path ? 'bg-blue-700' : 'hover:bg-blue-700'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.text}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto">
          <h2 className="text-xs uppercase tracking-wider mb-3">ABOUT US</h2>
          <nav className="space-y-2">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.text}
                  href="#"
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-700"
                >
                  <Icon size={20} />
                  <span>{item.text}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="mt-auto pt-6 text-center text-xs opacity-80">
        <p>v2024.01.b2024011</p>
        <p>Copyright © SAP Exam Prep 2024</p>
      </div>
    </div>
  );
}

export default Sidebar;