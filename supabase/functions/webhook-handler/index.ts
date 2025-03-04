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

        console.log('Processing checkout.session.completed for user:', userId);

        try {
          // First check if customer already exists
          const { data: existingCustomer, error: customerFetchError } = await supabaseAdmin
            .from('customers')
            .select('stripe_customer_id')
            .eq('user_id', userId)
            .single();

          if (customerFetchError && customerFetchError.code !== 'PGRST116') {
            console.error('Error fetching existing customer:', customerFetchError);
            throw customerFetchError;
          }

          // Only create/update customer if they don't exist or have different stripe_customer_id
          if (!existingCustomer || existingCustomer.stripe_customer_id !== session.customer) {
            const { error: customerError } = await supabaseAdmin.from('customers').upsert({
              user_id: userId,
              stripe_customer_id: session.customer as string,
              created_at: new Date().toISOString()
            });

            if (customerError) {
              console.error('Error updating customers table:', customerError);
              throw customerError;
            }
          }

          // Get subscription details with expanded price
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
            {
              expand: ['items.data.price']
            }
          );

          console.log('Retrieved subscription:', {
            id: subscription.id,
            status: subscription.status,
            priceId: subscription.items.data[0]?.price?.id
          });

          // Update customer_subscriptions table with upsert
          const subscriptionData = {
            id: crypto.randomUUID(),
            user_id: userId,
            subscription_id: subscription.id,
            price_id: subscription.items.data[0]?.price?.id,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            created_at: new Date().toISOString()
          };

          console.log('Upserting subscription data:', subscriptionData);

          const { error: subscriptionError } = await supabaseAdmin
            .from('customer_subscriptions')
            .upsert(subscriptionData);

          if (subscriptionError) {
            console.error('Error updating customer_subscriptions table:', subscriptionError);
            throw subscriptionError;
          }

          // Update user's premium status
          const { error: profileError } = await supabaseAdmin.from('profiles').update({
            is_premium: true,
            updated_at: new Date().toISOString()
          }).eq('id', userId);

          if (profileError) {
            console.error('Error updating profile:', profileError);
            throw profileError;
          }

          // Check if billing history entry already exists
          const { data: existingBilling } = await supabaseAdmin
            .from('billing_history')
            .select('id')
            .eq('user_id', userId)
            .eq('amount', session.amount_total ? session.amount_total / 100 : 0)
            .eq('status', 'succeeded')
            .maybeSingle();

          if (!existingBilling) {
            // Add billing history only if it doesn't exist
            const { error: billingError } = await supabaseAdmin.from('billing_history').insert({
              user_id: userId,
              amount: session.amount_total ? session.amount_total / 100 : 0,
              currency: session.currency || 'usd',
              status: 'succeeded',
              invoice_url: null // Will be updated when invoice is generated
            });

            if (billingError) {
              console.error('Error updating billing history:', billingError);
              throw billingError;
            }
          }

          console.log('Successfully processed checkout session for user:', userId);
        } catch (error) {
          console.error('Error processing checkout session:', error);
          throw error;
        }

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

        // Update subscription status by subscription_id, not id
        await supabaseAdmin.from('customer_subscriptions').update({
          price_id: subscription.items.data[0].price.id,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
          trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
        }).eq('subscription_id', subscription.id);

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