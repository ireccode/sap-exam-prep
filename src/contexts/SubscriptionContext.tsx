import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { stripeService } from '@/services/stripeService';

type CustomerSubscription = Database['public']['Tables']['customer_subscriptions']['Row'];

interface SubscriptionContextType {
  isLoading: boolean;
  isPremium: boolean;
  subscription: CustomerSubscription | null;
  createCheckoutSession: (priceId: string) => Promise<string | null>;
  createCustomerPortalSession: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
  reactivateSubscription: () => Promise<void>;
  error: string | null;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isLoading: true,
  isPremium: false,
  subscription: null,
  createCheckoutSession: async () => null,
  createCustomerPortalSession: async () => {},
  cancelSubscription: async () => {},
  reactivateSubscription: async () => {},
  error: null,
});

export { SubscriptionContext };

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [subscription, setSubscription] = useState<CustomerSubscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setIsPremium(false);
      setSubscription(null);
      return;
    }

    const fetchSubscriptionStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setSubscription(null);
          setIsPremium(false);
          return;
        }

        // Get the most recent subscription
        const { data: subscriptions, error: subscriptionError } = await supabase
          .from('customer_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (subscriptionError) {
          console.error('Error fetching subscription:', subscriptionError);
          setError('Failed to fetch subscription status');
          return;
        }

        // If no subscription found, set defaults
        if (!subscriptions || subscriptions.length === 0) {
          setSubscription(null);
          setIsPremium(false);
          return;
        }

        const currentSubscription = subscriptions[0];
        
        // Check if subscription is active
        const isActive = currentSubscription.status === 'active' || 
                        currentSubscription.status === 'trialing';
        const isPastDue = currentSubscription.status === 'past_due';
        const isCanceled = currentSubscription.status === 'canceled';
        const isExpired = currentSubscription.current_period_end && 
                         new Date(currentSubscription.current_period_end) < new Date();

        // Set subscription state
        setSubscription(currentSubscription);
        
        // Set premium status based on subscription state
        setIsPremium(isActive && !isExpired && !isCanceled);

      } catch (error) {
        console.error('Error in fetchSubscriptionStatus:', error);
        setError('Failed to fetch subscription status');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionStatus();

    // Subscribe to realtime changes
    const profileSubscription = supabase
      .channel(`public:profiles:id=eq.${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, payload => {
        setIsPremium(payload.new.is_premium);
      })
      .subscribe();

    const subscriptionChannel = supabase
      .channel(`public:customer_subscriptions:user_id=eq.${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'customer_subscriptions',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        if (payload.eventType === 'DELETE') {
          setSubscription(null);
        } else {
          setSubscription(payload.new as CustomerSubscription);
        }
      })
      .subscribe();

    return () => {
      profileSubscription.unsubscribe();
      subscriptionChannel.unsubscribe();
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

  const createCustomerPortalSession = async (): Promise<void> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const url = await stripeService.createCustomerPortalSession();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error('Error creating customer portal session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create customer portal session');
    }
  };

  const cancelSubscription = async (): Promise<void> => {
    try {
      if (!user || !subscription) {
        throw new Error('No active subscription found');
      }

      await stripeService.cancelSubscription(subscription.subscription_id);
    } catch (err) {
      console.error('Error canceling subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    }
  };

  const reactivateSubscription = async (): Promise<void> => {
    try {
      if (!user || !subscription) {
        throw new Error('No active subscription found');
      }

      await stripeService.reactivateSubscription(subscription.subscription_id);
    } catch (err) {
      console.error('Error reactivating subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to reactivate subscription');
    }
  };

  return (
    <SubscriptionContext.Provider value={{
      isLoading,
      isPremium,
      subscription,
      createCheckoutSession,
      createCustomerPortalSession,
      cancelSubscription,
      reactivateSubscription,
      error,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}; 