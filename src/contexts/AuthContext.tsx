import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, AuthError, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { useProgressStore } from '@/store/useProgressStore';
import { useTrainingStore } from '@/store/useTrainingStore';
import { UserService, UserRecord } from '@/services/UserService';

type Profile = Database['public']['Tables']['profiles']['Row'];

type AuthState = {
  session: Session | null;
  user: User | null;
  userRecord: UserRecord | null;
  profile: Profile | null;
  loading: boolean;
  error: AuthError | null;
};

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  updateUserRecord: (updates: Partial<UserRecord>) => Promise<{ error: Error | null }>;
  isPremium: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    userRecord: null,
    profile: null,
    loading: true,
    error: null,
  });

  // Add debounce ref
  const lastSignInTime = useRef<number>(0);
  const DEBOUNCE_DELAY = 1000; // 1 second

  // We don't use public.users table, but keep the import for type compatibility
  // const userService = new UserService(supabase);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        console.log('Initializing auth state...');
        
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        console.log('Initial session:', session?.user?.email);

        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          if (mounted) {
            setState(s => ({ ...s, loading: false }));
          }
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event: AuthChangeEvent, session) => {
            console.log('Auth state changed:', event, session?.user?.email);
            
            if (session?.user) {
              // Skip fetching user data for certain events where it's handled elsewhere
              const skipFetchEvents: AuthChangeEvent[] = ['INITIAL_SESSION', 'TOKEN_REFRESHED', 'USER_UPDATED'];
              
              if (!skipFetchEvents.includes(event)) {
                if (event === 'SIGNED_IN') {
                  // Debounce SIGNED_IN events
                  const now = Date.now();
                  if (now - lastSignInTime.current < DEBOUNCE_DELAY) {
                    console.log('Debouncing SIGNED_IN event');
                    return;
                  }
                  lastSignInTime.current = now;

                  // Check if this is a new user signup by looking at the URL
                  const isNewSignup = window.location.href.includes('type=signup');
                  console.log('Is new signup:', isNewSignup);

                  // First fetch user data with isSignUp flag for new users
                  await fetchUserData(session.user.id, isNewSignup);
                  
                  // Then check subscription status
                  console.log('Checking subscription after sign in');
                  const hasActiveSubscription = await checkSubscriptionStatus(session.user.id);
                  
                  // Update profile if needed and not already premium
                  if (!hasActiveSubscription && state.profile && !state.profile.is_premium) {
                    console.log('No active subscription and profile not premium, updating profile');
                    await updateProfile({ is_premium: false });
                  } else if (hasActiveSubscription && state.profile && !state.profile.is_premium) {
                    console.log('Active subscription found but profile not premium, updating profile');
                    await updateProfile({ is_premium: true });
                  } else {
                    console.log('Profile premium status matches subscription status:', state.profile?.is_premium);
                  }
                } else {
                  await fetchUserData(session.user.id);
                }
              }
            } else {
              if (mounted) {
                setState({
                  session: null,
                  user: null,
                  userRecord: null,
                  profile: null,
                  loading: false,
                  error: null,
                });
              }
            }
          }
        );

        // Subscribe to user record changes
        const userSubscription = session?.user ? supabase
          .channel(`public:users:id=eq.${session.user.id}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${session.user.id}`,
          }, payload => {
            if (mounted) {
              setState(s => ({
                ...s,
                userRecord: payload.new as UserRecord
              }));
            }
          })
          .subscribe() : null;

        return () => {
          mounted = false;
          subscription.unsubscribe();
          if (userSubscription) {
            userSubscription.unsubscribe();
          }
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setState(s => ({ ...s, loading: false }));
        }
      }
    }

    initialize();
  }, []);

  async function createProfile(userId: string, email: string): Promise<Profile | null> {
    try {
      console.log('Creating new profile for user:', userId);
      const newProfile = {
        id: userId,
        email,
        is_premium: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }

      console.log('Created new profile:', data);
      return data;
    } catch (error) {
      console.error('Error in createProfile:', error);
      return null;
    }
  }

  async function fetchUserData(userId: string, isSignUp = false) {
    console.log('Fetching user data for:', userId, 'isSignUp:', isSignUp);
    try {
      // Get the current session to ensure we have a fresh user object
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No user found');
      }

      // Fetch the profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Handle profile
      if (profileError) {
        console.log('Profile not found or error:', profileError.code, profileError.message);
        console.log('Attempting to create profile for user:', userId);
        
        // Try to create profile directly
        const newProfile = await createProfile(userId, user.email || '');
        
        if (!newProfile) {
          console.warn('Failed to create profile, will proceed with null profile');
        }
        
        setState({
          session: null,
          user,
          userRecord: null, // No userRecord - not using public.users
          profile: newProfile,
          loading: false,
          error: null,
        });
      } else {
        console.log('Fetched profile:', profile);

        setState({
          session: null,
          user,
          userRecord: null, // No userRecord - not using public.users
          profile,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setState(s => ({ 
        session: null,
        user: null,
        userRecord: null,
        profile: null,
        loading: false,
        error: error as AuthError,
      }));
    }
  }

  async function checkSubscriptionStatus(userId: string): Promise<boolean> {
    try {
      console.log('Checking subscription status for user:', userId);
      
      // Skip subscription check if price ID is not configured
      if (!import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID) {
        console.log('Premium price ID not configured, skipping subscription check');
        return false;
      }

      console.log('Using price ID:', import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID);

      // First, log all subscriptions for debugging
      const { data: allSubs, error: debugError } = await supabase
        .from('customer_subscriptions')
        .select('*')
        .eq('user_id', userId);
      
      if (debugError) {
        console.error('Error fetching all subscriptions:', debugError);
      } else {
        console.log('All subscriptions for user:', allSubs);
      }

      // Then check for active subscription
      const { data: subscription, error } = await supabase
        .from('customer_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('price_id', import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        // PGRST116 means no rows, which is expected for non-premium users
        if (error.code === 'PGRST116') {
          console.log('No active subscription found (expected for non-premium users)');
          return false;
        }
        console.error('Error checking subscription:', error);
        return false;
      }

      const isActive = !!subscription;
      console.log('Subscription check result:', {
        subscription,
        isActive,
        priceId: import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID
      });
      return isActive;
    } catch (error) {
      console.error('Error in checkSubscriptionStatus:', error);
      return false;
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error };
      }

      // Reset stores when user signs in
      useProgressStore.getState().reset();
      useTrainingStore.getState().resetTraining();

      // Let the auth state change handler handle the rest
      return { error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error: error as AuthError };
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign up user:', email);
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        return { error: signUpError };
      }

      if (!authData.user) {
        const error = new Error('No user data returned from sign up') as AuthError;
        return { error };
      }

      console.log('User signed up successfully:', authData.user.id);

      // Let the database trigger handle_new_user() create the profile
      // and wait a moment to allow the database triggers to execute
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fetch user data with isSignUp flag
      await fetchUserData(authData.user.id, true);

      return { error: null };
    } catch (error) {
      console.error('Error in signUp:', error);
      return { error: error as AuthError };
    }
  };

  async function signOut() {
    console.log('Signing out');
    setState(s => ({ ...s, loading: true }));
    try {
      await supabase.auth.signOut();
      // Reset stores on sign out
      useProgressStore.getState().reset();
      useTrainingStore.getState().resetTraining();
      setState({
        session: null,
        user: null,
        userRecord: null,
        profile: null,
        loading: false,
        error: null,
      });
      
      // Force a page reload after a short delay to ensure complete state reset
      console.log('Sign out successful, reloading page...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 300);
    } catch (error) {
      console.error('Sign out error:', error);
      setState(s => ({ ...s, loading: false }));
      
      // Even if there's an error, force a reload to recover
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    }
  }

  async function updateProfile(updates: Partial<Profile>) {
    try {
      setState(s => ({ ...s, loading: true }));

      // Get fresh user data to avoid race conditions
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found, cannot update profile');
        setState(s => ({ ...s, loading: false }));
        return { error: new Error('No user logged in') };
      }
      
      // Add updated_at to the updates
      const updatesWithTimestamp = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updatesWithTimestamp)
        .eq('id', user.id);

      if (error) throw error;

      // Fetch the updated profile to ensure we have the latest data
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      setState(s => ({
        ...s,
        profile,
        loading: false
      }));

      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      setState(s => ({ ...s, loading: false }));
      return { error: error as Error };
    }
  }

  async function updateUserRecord(updates: Partial<UserRecord>) {
    try {
      if (!state.user) throw new Error('No user logged in');

      console.log('Skipping user record update (using auth.users):', updates);
      
      // Since we don't use public.users table, we just log the attempt
      // and return a mock updated record for backward compatibility
      const mockUpdatedRecord: UserRecord = {
        id: state.user.id,
        email: state.user.email || '',
        credits: updates.credits || 0,
        web_ui_enabled: updates.web_ui_enabled || false,
        role: updates.role || 'user',
        created_at: state.user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setState(s => ({
        ...s,
        userRecord: mockUpdatedRecord,
        loading: false
      }));

      return { error: null };
    } catch (error) {
      console.error('Error updating user record:', error);
      setState(s => ({ ...s, loading: false }));
      return { error: error as Error };
    }
  }

  const value = {
    ...state,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updateUserRecord,
    isPremium: state.profile?.is_premium ?? false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 