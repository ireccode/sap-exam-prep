import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { BottomNav } from './components/mobile/BottomNav';
import { AIChat } from './components/chat/AIChat';
import { MiniExam } from './components/exam/MiniExam';
import { useEffect } from 'react';
import { questionBank } from '@/services/questionBank';
import { TrainingDeck } from './components/training/TrainingDeck';
import { useProgressStore } from '@/store/useProgressStore';
import { AuthProvider } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Profile } from '@/components/profile/Profile';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { SubscriptionPage } from '@/pages/SubscriptionPage';
import { SubscriptionSuccessPage } from '@/pages/subscription/SubscriptionSuccessPage';
import { SubscriptionCancelPage } from '@/pages/subscription/SubscriptionCancelPage';
import { RoadmapPage } from './components/roadmap/RoadmapPage';
import { TermsAndConditions } from './components/legal/TermsAndConditions';
import { ContactPage } from '@/pages/ContactPage';
import { UpdatePassword } from '@/components/auth/UpdatePassword';
import { Toaster } from 'react-hot-toast';

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
    <ProtectedRoute requireSubscription>
      <AIChat />
    </ProtectedRoute>
  </ErrorBoundary>
);

const SafeMiniExam = () => (
  <ErrorBoundary>
    <ProtectedRoute>
      <MiniExam />
    </ProtectedRoute>
  </ErrorBoundary>
);

const SafeTrainingDeck = () => (
  <ErrorBoundary>
    <ProtectedRoute>
      <TrainingDeck />
    </ProtectedRoute>
  </ErrorBoundary>
);

// Update SafeProfileForm component
const SafeProfileForm = () => (
  <ErrorBoundary>
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  </ErrorBoundary>
);

const SafeRoadmap = () => (
  <ErrorBoundary>
    <ProtectedRoute>
      <RoadmapPage />
    </ProtectedRoute>
  </ErrorBoundary>
);

export function App() {
  return (
      <Router>
        <AuthProvider>
          <SubscriptionProvider>
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <Header />
              <main className="container mx-auto px-4 py-8 flex-grow">
                <Routes>
                  <Route path="/login" element={<LoginForm />} />
                  <Route path="/" element={
                    <Navigate to="/dashboard" replace />
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/terms" element={<TermsAndConditions />} />
                  <Route path="/roadmap" element={<SafeRoadmap />} />
                  <Route path="/training" element={<SafeTrainingDeck />} />
                  <Route path="/mini-exam" element={<SafeMiniExam />} />
                  <Route path="/ai-chat" element={<SafeAIChat />} />
                  <Route path="/profile" element={<SafeProfileForm />} />
                  <Route path="/subscription" element={<SubscriptionPage />} />
                  <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />
                  <Route path="/subscription/cancel" element={<SubscriptionCancelPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/update-password" element={<UpdatePassword />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
              <Footer />
              <BottomNav />
            </div>
          </SubscriptionProvider>
        </AuthProvider>
      </Router>
  );
}

function Dashboard() {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 pb-20 md:pb-0">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center">
        Welcome to SAP Architect Exam Prep
      </h1>
      <p className="text-lg md:text-xl text-gray-600 max-w-2xl text-center px-4">
        Your comprehensive preparation platform for SAP Architect certification exams.
        Choose from our training deck, practice with mini exams, or get help from our AI assistant.
      </p>
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="100" viewBox="0 0 400 100" className="mt-8">
        {/* Background */}
        <rect width="400" height="100" fill="#f4f6f9" rx="10" />

        {/* Book Icon */}
        <g transform="translate(20, 20)">
          <rect x="0" y="0" width="40" height="60" fill="#0073e6" rx="5"/>
          <line x1="10" y1="10" x2="30" y2="10" stroke="#fff" strokeWidth="2"/>
          <line x1="10" y1="20" x2="30" y2="20" stroke="#fff" strokeWidth="2"/>
          <line x1="10" y1="30" x2="30" y2="30" stroke="#fff" strokeWidth="2"/>
        </g>

        {/* AI Brain Icon */}
        <g transform="translate(80, 20)">
          <circle cx="20" cy="30" r="20" fill="#ffcc00"/>
          <path d="M15,15 Q20,5 25,15 Q35,25 25,35 Q20,45 15,35 Q5,25 15,15 Z"
                fill="#fff"/>
        </g>

        {/* Text */}
        <text x="140" y="50" fontFamily="Arial, sans-serif"
              fontSize="20px"
              fontWeight="bold"
              fill="#333">
          SAP Architect Exam Prep
        </text>
        
        {/* Subtext */}
        <text x="140" y="75"
              fontFamily="Arial, sans-serif"
              fontSize="14px"
              fill="#555">
          Learn | Practice | Succeed with AI
        </text>
      </svg>
      <img 
        src="/sap_architect_logo01.jpg" 
        alt="SAP Architect Logo" 
        className="w-full h-auto max-h-[600px] object-contain md:max-w-[600px] mx-auto"
        loading="eager"
        decoding="async"
        style={{ imageRendering: 'crisp-edges' }}
      />
    </div>
  );
}

export default App;