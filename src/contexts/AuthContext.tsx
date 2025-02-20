import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => Promise<{ error: Error | null }>;
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
    user: null,
    profile: null,
    isLoading: true,
  });

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
            setState(s => ({ ...s, isLoading: false }));
          }
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);
            
            if (session?.user) {
              await fetchUserData(session.user.id);
            } else {
              if (mounted) {
                setState({
                  user: null,
                  profile: null,
                  isLoading: false,
                });
              }
            }
          }
        );

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setState(s => ({ ...s, isLoading: false }));
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

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.log('Profile not found, attempting to create one');
        const newProfile = await createProfile(userId, user.email || '');
        
        setState({
          user,
          profile: newProfile,
          isLoading: false,
        });
        return;
      }

      console.log('Fetched profile:', profile);

      setState({
        user,
        profile,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Don't clear user on profile error
      setState(s => ({ 
        ...s,
        isLoading: false 
      }));
    }
  }

  async function signIn(email: string, password: string) {
    console.log('Attempting sign in for:', email);
    setState(s => ({ ...s, isLoading: true }));
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Sign in error:', error);
        setState(s => ({ ...s, isLoading: false }));
        return { error };
      }

      // Don't wait for profile fetch to complete
      if (data.user) {
        fetchUserData(data.user.id).catch(console.error);
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      setState(s => ({ ...s, isLoading: false }));
      return { error: error as AuthError };
    }
  }

  async function signUp(email: string, password: string) {
    console.log('Attempting sign up for:', email);
    setState(s => ({ ...s, isLoading: true }));
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            is_premium: false
          }
        }
      });
      if (error) {
        console.error('Sign up error:', error);
        setState(s => ({ ...s, isLoading: false }));
        return { error };
      }

      // Don't wait for profile creation to complete
      if (data.user) {
        fetchUserData(data.user.id).catch(console.error);
      }

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      setState(s => ({ ...s, isLoading: false }));
      return { error: error as AuthError };
    }
  }

  async function signOut() {
    console.log('Signing out');
    setState(s => ({ ...s, isLoading: true }));
    try {
      await supabase.auth.signOut();
      setState({
        user: null,
        profile: null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      setState(s => ({ ...s, isLoading: false }));
    }
  }

  async function updateProfile(updates: Partial<Profile>) {
    try {
      if (!state.user) throw new Error('No user logged in');

      setState(s => ({ ...s, isLoading: true }));
      
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
        isLoading: false
      }));

      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      setState(s => ({ ...s, isLoading: false }));
      return { error: error as Error };
    }
  }

  const value = {
    ...state,
    signIn,
    signUp,
    signOut,
    updateProfile,
    isPremium: state.profile?.is_premium ?? false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 