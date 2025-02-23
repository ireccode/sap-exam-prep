import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { TrainingDeck } from '@/components/training/TrainingDeck';
import { MiniExam } from '@/components/exam/MiniExam';
import { CategoryCard } from '@/components/training/CategoryCard';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { questionBank } from '@/services/questionBank';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import type { User } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn()
    },
    from: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { is_premium: false }, error: null }),
      update: vi.fn().mockResolvedValue({ data: {}, error: null })
    }))
  }
}));

// Mock Auth Context
vi.mock('@/contexts/AuthContext', async () => {
  const actual = await vi.importActual('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn().mockReturnValue({
      user: {
        id: 'test-user',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        role: 'authenticated',
        email: 'test@example.com'
      },
      profile: {
        id: 'test-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        username: 'testuser',
        full_name: 'Test User',
        avatar_url: null,
        email: 'test@example.com',
        website: null,
        bio: null,
        is_premium: false
      },
      isPremium: false,
      isLoading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      updateProfile: vi.fn()
    })
  };
});

// Mock Subscription Context
vi.mock('@/contexts/SubscriptionContext', async () => {
  const actual = await vi.importActual('@/contexts/SubscriptionContext');
  return {
    ...actual,
    useSubscription: vi.fn().mockReturnValue({
      createCheckoutSession: vi.fn().mockImplementation(() => {
        window.location.href = 'https://checkout.stripe.com/test';
        return Promise.resolve();
      }),
      isLoading: false,
      error: null,
      isPremium: false
    }),
    SubscriptionProvider: ({ children }: { children: React.ReactNode }) => children
  };
});

// Mock QuestionBank Service
vi.mock('@/services/questionBank', () => ({
  questionBank: {
    initialize: vi.fn().mockResolvedValue(undefined),
    getCategories: vi.fn().mockImplementation(({ isPremium }) => ['BTP', 'Security']),
    getCategoryCount: vi.fn().mockReturnValue(10),
    getQuestionsByCategory: vi.fn().mockImplementation(({ isPremium }) => []),
    getAdaptiveQuestions: vi.fn().mockImplementation((count, { isPremium }) => [{
      id: '1',
      category: 'BTP',
      question: 'Test Question',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 0,
      explanation: 'Test explanation',
      difficulty: 1,
      isPremium
    }])
  }
}));

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TrainingDeck Integration', () => {
    it('filters premium content for non-premium users', async () => {
      // Mock non-premium user
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: 'test-user',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          role: 'authenticated',
          email: 'test@example.com'
        },
        profile: {
          id: 'test-user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          username: 'testuser',
          full_name: 'Test User',
          avatar_url: null,
          email: 'test@example.com',
          website: null,
          bio: null,
          is_premium: false
        },
        isPremium: false,
        isLoading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        updateProfile: vi.fn()
      });

      render(
        <BrowserRouter>
          <TrainingDeck />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(questionBank.getCategories).toHaveBeenCalledWith({ isPremium: false });
        expect(questionBank.getCategories).not.toHaveBeenCalledWith({ isPremium: true });
      });
    });
  });

  describe('MiniExam Integration', () => {
    it('loads adaptive questions based on subscription status', async () => {
      // Mock premium user
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: 'test-user',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          role: 'authenticated',
          email: 'test@example.com'
        },
        profile: {
          id: 'test-user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          username: 'testuser',
          full_name: 'Test User',
          avatar_url: null,
          email: 'test@example.com',
          website: null,
          bio: null,
          is_premium: true
        },
        isPremium: true,
        isLoading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        updateProfile: vi.fn()
      });

      render(
        <BrowserRouter>
          <MiniExam />
        </BrowserRouter>
      );

      // Simulate clicking the start exam button
      const startButton = await screen.findByText('Start Exam');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(questionBank.getAdaptiveQuestions).toHaveBeenCalledWith(expect.any(Number), { isPremium: true });
      });
    });
  });
});

describe('CategoryCard Integration', () => {
  test('displays premium indicator for premium content', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CategoryCard
            title="Test Category"
            questionCount={10}
            completedCount={5}
            correctCount={4}
            isStarted={true}
            hasPremium={true}
            onClick={() => {}}
          />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByTitle(/Premium/)).toBeInTheDocument();
  });
});

describe('SubscriptionPlans Integration', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com'
  };

  const mockBasicProfile = {
    id: mockUser.id,
    email: mockUser.email || null,
    is_premium: false,
    created_at: new Date().toISOString()
  };

  const mockPremiumProfile = {
    ...mockBasicProfile,
    is_premium: true
  };

  const mockCreateCheckoutSession = vi.fn().mockImplementation(() => {
    window.location.href = 'https://checkout.stripe.com/test';
    return Promise.resolve();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSubscription).mockReturnValue({
      createCheckoutSession: mockCreateCheckoutSession,
      isLoading: false,
      error: null,
      isPremium: false
    });
  });

  test('handles subscription button click', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
            <SubscriptionPlans />
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    const subscribeButton = screen.getByText('Subscribe Now');
    fireEvent.click(subscribeButton);

    await waitFor(() => {
      expect(mockCreateCheckoutSession).toHaveBeenCalled();
      expect(window.location.href).toBe('https://checkout.stripe.com/test');
    });
  });

  test('handles subscription errors gracefully', async () => {
    const mockError = 'Failed to create checkout session';
    vi.mocked(useSubscription).mockReturnValue({
      createCheckoutSession: vi.fn().mockRejectedValue(new Error(mockError)),
      isLoading: false,
      error: mockError,
      isPremium: false
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
            <SubscriptionPlans />
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    const subscribeButton = screen.getByText('Subscribe Now');
    fireEvent.click(subscribeButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to create checkout session/)).toBeInTheDocument();
    });
  });
}); 