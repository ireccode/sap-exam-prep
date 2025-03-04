import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { UserService } from '@/services/UserService';
import { User, Session, AuthError } from '@supabase/supabase-js';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    })),
  },
}));

// Mock stores
vi.mock('@/store/useProgressStore', () => ({
  useProgressStore: {
    getState: vi.fn(() => ({
      reset: vi.fn(),
    })),
  },
}));

vi.mock('@/store/useTrainingStore', () => ({
  useTrainingStore: {
    getState: vi.fn(() => ({
      resetTraining: vi.fn(),
    })),
  },
}));

// Test component to access auth context
function TestComponent() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="loading">{auth.loading.toString()}</div>
      <div data-testid="user">{auth.user?.email || 'no user'}</div>
      <div data-testid="premium">{auth.isPremium.toString()}</div>
    </div>
  );
}

describe('AuthContext Integration', () => {
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  };

  const mockSession: Session = {
    user: mockUser,
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
  };

  const mockProfile = {
    id: mockUser.id,
    email: mockUser.email || '',
    is_premium: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockUserRecord = {
    id: mockUser.id,
    email: mockUser.email || '',
    credits: 0,
    web_ui_enabled: false,
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let userService: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    userService = new UserService(supabase);
    vi.spyOn(userService, 'getUserById').mockImplementation(async () => mockUserRecord);
  });

  describe('initialization', () => {
    it('should initialize with no user', async () => {
      // Mock getSession to return no session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
      });

      expect(screen.getByTestId('user')).toHaveTextContent('no user');
      expect(screen.getByTestId('premium')).toHaveTextContent('false');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    it('should initialize with existing user', async () => {
      // Mock getSession to return a session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock getUser to return the user
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock profile fetch
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      } as any);

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
      });

      expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email || '');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });

  describe('auth operations', () => {
    it('should handle sign in with subscription check', async () => {
      // Mock successful sign in
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      // Mock getUser for fetchUserData
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock subscription check
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'customer_subscriptions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        } as any;
      });

      let signIn: (email: string, password: string) => Promise<any>;

      await act(async () => {
        render(
          <AuthProvider>
            {(() => {
              const auth = useAuth();
              signIn = auth.signIn;
              return <TestComponent />;
            })()}
          </AuthProvider>
        );
      });

      await act(async () => {
        await signIn!('test@example.com', 'password');
      });

      // Verify subscription check and profile update
      expect(supabase.from).toHaveBeenCalledWith('customer_subscriptions');
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(screen.getByTestId('premium')).toHaveTextContent('false');
    });

    it('should handle sign up', async () => {
      // Mock successful sign up
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      // Mock getUser for fetchUserData
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock profile fetch/create
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      } as any);

      let signUp: (email: string, password: string) => Promise<any>;

      await act(async () => {
        render(
          <AuthProvider>
            {(() => {
              const auth = useAuth();
              signUp = auth.signUp;
              return <TestComponent />;
            })()}
          </AuthProvider>
        );
      });

      await act(async () => {
        await signUp!('test@example.com', 'password');
      });

      expect(userService.upsertUser).toHaveBeenCalledWith(expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
        credits: 0,
        web_ui_enabled: false,
        role: 'user',
      }));
      expect(userService.getUserById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should handle sign out', async () => {
      // Mock successful sign out
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      let signOut: () => Promise<void>;

      await act(async () => {
        render(
          <AuthProvider>
            {(() => {
              const auth = useAuth();
              signOut = auth.signOut;
              return <TestComponent />;
            })()}
          </AuthProvider>
        );
      });

      await act(async () => {
        await signOut!();
      });

      expect(screen.getByTestId('user')).toHaveTextContent('no user');
      expect(screen.getByTestId('premium')).toHaveTextContent('false');
    });

    it('should handle auth state change with subscription check', async () => {
      // Mock getSession to return a session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock subscription check
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'customer_subscriptions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: { status: 'active' }, 
              error: null 
            }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        } as any;
      });

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
      });

      // Simulate auth state change
      const authStateChange = vi.mocked(supabase.auth.onAuthStateChange).mock.calls[0][0];
      await act(async () => {
        await authStateChange('SIGNED_IN', mockSession);
      });

      // Verify subscription check
      expect(supabase.from).toHaveBeenCalledWith('customer_subscriptions');
      expect(screen.getByTestId('premium')).toHaveTextContent('true');
    });
  });

  describe('error handling', () => {
    it('should handle sign in errors', async () => {
      // Create a mock AuthError
      const mockError = new Error('Invalid credentials') as AuthError;
      Object.assign(mockError, {
        name: 'AuthApiError',
        status: 400,
        __isAuthError: true,
      });

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      let signIn: (email: string, password: string) => Promise<any>;
      let error: any = null;

      await act(async () => {
        render(
          <AuthProvider>
            {(() => {
              const auth = useAuth();
              signIn = auth.signIn;
              return <TestComponent />;
            })()}
          </AuthProvider>
        );
      });

      await act(async () => {
        const result = await signIn!('test@example.com', 'password');
        error = result.error;
      });

      expect(error).toEqual(mockError);
      expect(screen.getByTestId('user')).toHaveTextContent('no user');
    });

    it('should handle profile fetch errors', async () => {
      // Mock getSession to return a session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock getUser
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock failed profile fetch
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      } as any);

      // Mock failed user record fetch
      vi.spyOn(userService, 'getUserById').mockRejectedValue(new Error('Database error'));

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
      });

      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('premium')).toHaveTextContent('false');
    });
  });
}); 