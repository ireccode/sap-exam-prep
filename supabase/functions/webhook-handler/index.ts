import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@12.4.0?target=deno';

// Initialize Stripe with runtime config
const stripe = Stripe(Deno.env.get('PRIVATE_STRIPE_KEY') || '', {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient()
});

const webhookSecret = Deno.env.get('PRIVATE_WEBHOOK_SECRET') || '';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Log request details for debugging
    console.log('Webhook request received:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });

    // Get the signature from headers
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('No stripe-signature header found');
      throw new Error('No stripe-signature header');
    }

    // Log signature details
    console.log('Stripe signature received:', {
      signatureHeader: signature,
      webhookSecretLength: webhookSecret.length,
      webhookSecretPrefix: webhookSecret.substring(0, 10) + '...'
    });

    const body = await req.text();
    console.log('Request body details:', {
      length: body.length,
      preview: body.substring(0, 100) + '...'
    });

    let event;
    try {
      // Use Stripe's built-in verification
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        Stripe.createSubtleCryptoProvider()
      );
      console.log('Webhook verified successfully:', {
        eventId: event.id,
        eventType: event.type
      });
    } catch (err) {
      console.error('Webhook signature verification failed:', {
        error: err.message,
        type: err.type,
        code: err.code,
        stack: err.stack
      });
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Processing webhook event:', event.type, event.id);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;

        if (!userId) {
          throw new Error('No user ID in session metadata');
        }

        // Update customers table
        await supabaseAdmin.from('customers').upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          created_at: new Date().toISOString()
        });

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

        // Update customer_subscriptions table
        await supabaseAdmin.from('customer_subscriptions').insert({
          id: subscription.id,
          user_id: userId,
          subscription_id: subscription.id,
          price_id: subscription.items.data[0].price.id,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
          trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
        });

        // Update user's premium status
        await supabaseAdmin.from('profiles').update({
          is_premium: true,
          updated_at: new Date().toISOString()
        }).eq('id', userId);

        // Add billing history
        await supabaseAdmin.from('billing_history').insert({
          user_id: userId,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency || 'usd',
          status: 'succeeded',
          invoice_url: null // Will be updated when invoice is generated
        });

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Get user from customers table
        const { data: customer } = await supabaseAdmin
          .from('customers')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer)
          .single();

        if (!customer) break;

        // Update subscription status
        await supabaseAdmin.from('customer_subscriptions').upsert({
          id: subscription.id,
          user_id: customer.user_id,
          subscription_id: subscription.id,
          price_id: subscription.items.data[0].price.id,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
          trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
        });

        // Update user's premium status
        await supabaseAdmin.from('profiles').update({
          is_premium: subscription.status === 'active' || subscription.status === 'trialing',
          updated_at: new Date().toISOString()
        }).eq('id', customer.user_id);

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Get user from customers table
        const { data: customer } = await supabaseAdmin
          .from('customers')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer)
          .single();

        if (!customer) break;

        // Update subscription status
        await supabaseAdmin.from('customer_subscriptions').update({
          status: subscription.status,
          canceled_at: new Date().toISOString(),
          ended_at: new Date().toISOString()
        }).eq('subscription_id', subscription.id);

        // Update user's premium status
        await supabaseAdmin.from('profiles').update({
          is_premium: false,
          updated_at: new Date().toISOString()
        }).eq('id', customer.user_id);

        break;
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 