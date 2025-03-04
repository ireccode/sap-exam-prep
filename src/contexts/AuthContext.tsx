import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { useProgressStore } from '@/store/useProgressStore';
import { useTrainingStore } from '@/store/useTrainingStore';
import { UserService, UserRecord } from '@/services/UserService';
import { Profile } from '@/types/profile';

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

  // Initialize UserService
  const userService = new UserService(supabase);

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
          async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);
            
            if (session?.user) {
              if (event === 'SIGNED_IN') {
                // Check subscription status and update profile if needed
                const hasActiveSubscription = await checkSubscriptionStatus(session.user.id);
                if (!hasActiveSubscription) {
                  await updateProfile({ is_premium: false });
                }
              }
              await fetchUserData(session.user.id);
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

  async function fetchUserData(userId: string) {
    console.log('Fetching user data for:', userId);
    try {
      // Get the current session to ensure we have a fresh user object
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No user found');
      }

      // Fetch both profile and user record
      const [profileResponse, userRecord] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        userService.getUserById(userId)
      ]);

      // Handle profile
      if (profileResponse.error) {
        console.log('Profile not found, attempting to create one');
        const newProfile = await createProfile(userId, user.email || '');
        
        // If profile creation failed, throw error
        if (!newProfile) {
          throw new Error('Failed to create profile');
        }

        setState({
          session: null,
          user,
          userRecord,
          profile: newProfile,
          loading: false,
          error: null,
        });
        return;
      }

      console.log('Fetched profile:', profileResponse.data);
      console.log('Fetched user record:', userRecord);

      setState({
        session: null,
        user,
        userRecord,
        profile: profileResponse.data,
        loading: false,
        error: null,
      });
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
      
      const { data: subscription, error } = await supabase
        .from('customer_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('price_id', import.meta.env.VITE_PREMIUM_PRICE_ID)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Error checking subscription:', error);
        return false;
      }

      const isActive = !!subscription;
      console.log('Subscription status:', isActive ? 'active' : 'inactive');
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

      // Check subscription and fetch user data
      if (data.user) {
        const hasActiveSubscription = await checkSubscriptionStatus(data.user.id);
        if (!hasActiveSubscription) {
          await updateProfile({ is_premium: false });
        }
        await fetchUserData(data.user.id);
      }

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

      // Create initial user record
      try {
        const userRecord = await userService.createInitialUser({
          id: authData.user.id,
          email: authData.user.email || '', // Handle potential undefined
          credits: 0,
          web_ui_enabled: false,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        console.log('Created initial user record:', userRecord);
      } catch (userError) {
        console.error('Error creating user record:', userError);
        // Continue with sign up even if user record creation fails
      }

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
    } catch (error) {
      console.error('Sign out error:', error);
      setState(s => ({ ...s, loading: false }));
    }
  }

  async function updateProfile(updates: Partial<Profile>) {
    try {
      if (!state.user) throw new Error('No user logged in');

      setState(s => ({ ...s, loading: true }));
      
      // Add updated_at to the updates
      const updatesWithTimestamp = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updatesWithTimestamp)
        .eq('id', state.user.id);

      if (error) throw error;

      // Fetch the updated profile to ensure we have the latest data
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', state.user.id)
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

      setState(s => ({ ...s, loading: true }));

      const updatedRecord = await userService.upsertUser({
        ...updates,
        id: state.user.id
      });

      setState(s => ({
        ...s,
        userRecord: updatedRecord,
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