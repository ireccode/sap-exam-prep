import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/types/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type Subscription = Database['public']['Tables']['customer_subscriptions']['Row'];

interface SubscriptionContextType {
  subscription: Subscription | null;
  isLoading: boolean;
  createCheckoutSession: (priceId: string) => Promise<void>;
  createCustomerPortalSession: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
  reactivateSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Add SUPABASE_URL constant
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    // Fetch initial subscription data
    fetchSubscription();

    // Subscribe to subscription changes
    const subscriptionChannel = supabase
      .channel('subscription_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresChangesPayload<Subscription>) => {
          if (payload.eventType === 'DELETE') {
            setSubscription(null);
          } else {
            setSubscription(payload.new as Subscription);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscriptionChannel);
    };
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createCheckoutSession = async (priceId: string) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ price_id: priceId }),
      });

      const { session_url, error } = await response.json();
      if (error) throw new Error(error);

      window.location.href = session_url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  };

  const createCustomerPortalSession = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ return_url: window.location.origin + '/subscription' }),
      });

      const { portal_url, error } = await response.json();
      if (error) throw new Error(error);

      window.location.href = portal_url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  };

  const cancelSubscription = async () => {
    if (!subscription) return;

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ subscription_id: subscription.subscription_id }),
      });

      const { error } = await response.json();
      if (error) throw new Error(error);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  };

  const reactivateSubscription = async () => {
    if (!subscription) return;

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/reactivate-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ subscription_id: subscription.subscription_id }),
      });

      const { error } = await response.json();
      if (error) throw new Error(error);
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        createCheckoutSession,
        createCustomerPortalSession,
        cancelSubscription,
        reactivateSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
} 