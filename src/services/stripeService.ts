import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabaseClient';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const stripeService = {
  async createCheckoutSession(priceId: string) {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ 
          priceId,
          userId: session?.user?.id 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Checkout session error:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (!data.url) {
        throw new Error('No checkout URL returned');
      }

      console.log('Redirecting to Stripe checkout:', data.url);
      
      // Redirect to the Stripe Checkout URL
      window.location.href = data.url;
      return data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
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

      const { data: history, error } = await supabase
        .from('billing_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return history || [];
    } catch (error) {
      console.error('Error getting billing history:', error);
      throw error;
    }
  }
}; 