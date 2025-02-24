import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const stripeService = {
  async createCheckoutSession(priceId: string) {
    try {
      console.log('Creating checkout session for price:', priceId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      console.log('Invoking Edge Function with:', { priceId, userId: user.id });
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId, userId: user.id }
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw error;
      }

      console.log('Received response:', data);
      if (!data?.url) {
        throw new Error('No checkout URL received from server');
      }

      return data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },

  async createCustomerPortalSession() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { userId: user.id }
      });

      if (error) throw error;
      return data.url;
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      throw error;
    }
  },

  async cancelSubscription(subscriptionId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  },

  async reactivateSubscription(subscriptionId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase.functions.invoke('reactivate-subscription', {
        body: { subscriptionId }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  },

  async getSubscriptionStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      return {
        isPremium: profile?.is_premium || false
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      throw error;
    }
  },

  async getBillingHistory() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('billing_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting billing history:', error);
      throw error;
    }
  }
}; 