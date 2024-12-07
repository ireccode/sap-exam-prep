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

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-red-800 font-bold mb-2">Something went wrong</h2>
          <p className="text-red-600">{this.state.error?.message}</p>
          <button
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap components that might throw errors with ErrorBoundary
const SafeAIChat = () => (
  <ErrorBoundary>
    <AIChat />
  </ErrorBoundary>
);

const SafeMiniExam = () => (
  <ErrorBoundary>
    <MiniExam />
  </ErrorBoundary>
);

const SafeTrainingDeck = () => (
  <ErrorBoundary>
    <TrainingDeck />
  </ErrorBoundary>
);

export function App() {
  const initializeApp = async () => {
    try {
      await questionBank.initialize();
      
      const progressStore = useProgressStore.getState();
      progressStore.categoryProgress = {};
      progressStore.examHistory = [];
      
      const categories = questionBank.getCategories();
      
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
        <ErrorBoundary>
          <Header />
        </ErrorBoundary>
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/training" element={<SafeTrainingDeck />} />
            <Route path="/mini-exam" element={<SafeMiniExam />} />
            <Route path="/ai-chat" element={<SafeAIChat />} />
          </Routes>
        </main>
        <ErrorBoundary>
          <BottomNav />
        </ErrorBoundary>
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