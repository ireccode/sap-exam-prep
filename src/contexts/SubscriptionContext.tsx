import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { stripeService } from '@/services/stripeService';

interface SubscriptionContextType {
  isLoading: boolean;
  isPremium: boolean;
  createCheckoutSession: (priceId: string) => Promise<string | null>;
  error: string | null;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isLoading: true,
  isPremium: false,
  createCheckoutSession: async () => null,
  error: null,
});

export { SubscriptionContext };

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setIsPremium(false);
      return;
    }

    const fetchSubscriptionStatus = async () => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_premium')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setIsPremium(profile?.is_premium ?? false);
      } catch (err) {
        console.error('Error fetching subscription status:', err);
        setError('Failed to fetch subscription status');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionStatus();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel(`public:profiles:id=eq.${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, (payload) => {
        setIsPremium(payload.new.is_premium);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const createCheckoutSession = async (priceId: string): Promise<string | null> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const url = await stripeService.createCheckoutSession(priceId);
      return url;
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create checkout session');
      return null;
    }
  };

  return (
    <SubscriptionContext.Provider value={{
      isLoading,
      isPremium,
      createCheckoutSession,
      error,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}; 