import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/mobile/BottomNav';
import { AIChat } from './components/chat/AIChat';
import { MiniExam } from './components/exam/MiniExam';
import { useEffect } from 'react';
import { questionBank } from '@/services/questionBank';
import { TrainingDeck } from './components/training/TrainingDeck';
import { useProgressStore } from '@/store/useProgressStore';

export function App() {
  const initializeApp = async () => {
    try {
      // Initialize question bank first
      await questionBank.initialize();
      
      // Reset progress store
      const progressStore = useProgressStore.getState();
      progressStore.categoryProgress = {};
      progressStore.examHistory = [];
      
      // Get categories after reset
      const categories = questionBank.getCategories();
      
      // Initialize empty progress for each category
      categories.forEach(category => {
        progressStore.categoryProgress[category] = {
          completedCount: 0,
          correctCount: 0,
          answeredQuestions: {},
          weakAreas: [],
          strengths: []
        };
      });
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  useEffect(() => {
    initializeApp();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/training" element={<TrainingDeck />} />
            <Route path="/mini-exam" element={<MiniExam />} />
            <Route path="/ai-chat" element={<AIChat />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </Router>
  );
}

function Home() {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 pb-20 md:pb-0">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center">
        Welcome to SAP Architect Exam Prep
      </h1>
      <p className="text-lg md:text-xl text-gray-600 max-w-2xl text-center px-4">
        Your comprehensive preparation platform for SAP Architect certification exams.
        Choose from our training deck, practice with mini exams, or get help from our AI assistant.
      </p>
    </div>
  );
}

export default App;