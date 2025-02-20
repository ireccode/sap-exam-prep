import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@12.4.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No signature found in request');
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        // Get the Supabase user ID from the customer
        const { data: customer } = await supabaseClient
          .from('customers')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!customer) {
          throw new Error('No customer found');
        }

        // Update subscription in database
        await supabaseClient.from('customer_subscriptions').upsert({
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
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        });

        // Update user's premium status
        await supabaseClient
          .from('profiles')
          .update({
            is_premium: subscription.status === 'active' || subscription.status === 'trialing',
            updated_at: new Date().toISOString(),
          })
          .eq('id', customer.user_id);

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        // Get the Supabase user ID from the customer
        const { data: customer } = await supabaseClient
          .from('customers')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!customer) {
          throw new Error('No customer found');
        }

        // Record successful payment in billing history
        await supabaseClient.from('billing_history').insert({
          user_id: customer.user_id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: invoice.status,
          invoice_url: invoice.hosted_invoice_url,
        });

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        // Get the Supabase user ID from the customer
        const { data: customer } = await supabaseClient
          .from('customers')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!customer) {
          throw new Error('No customer found');
        }

        // Record failed payment in billing history
        await supabaseClient.from('billing_history').insert({
          user_id: customer.user_id,
          amount: invoice.amount_due,
          currency: invoice.currency,
          status: 'failed',
          invoice_url: invoice.hosted_invoice_url,
        });

        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
}); 