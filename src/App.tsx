import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/mobile/BottomNav';
import { AIChat } from './components/chat/AIChat';
import { TrainingModule } from './components/training/TrainingModule';
import { MiniExam } from './components/exam/MiniExam';

function App() {
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

function TrainingDeck() {
  const modules = [
    {
      title: "SAP Architecture Fundamentals",
      description: "Learn the core concepts of SAP architecture and system design principles.",
      progress: 65,
    },
    {
      title: "Integration Patterns",
      description: "Master various integration patterns and their implementation in SAP systems.",
      progress: 30,
    },
    {
      title: "Security & Compliance",
      description: "Understand SAP security architecture and compliance requirements.",
      progress: 45,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 md:pb-0">
      {modules.map((module, index) => (
        <TrainingModule
          key={index}
          {...module}
          onStart={() => console.log(`Starting module: ${module.title}`)}
        />
      ))}
    </div>
  );
}

export default App;