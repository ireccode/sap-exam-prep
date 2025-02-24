import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Stripe from 'https://esm.sh/stripe@12.4.0?target=deno'

const stripe = new Stripe(Deno.env.get('PRIVATE_STRIPE_KEY') || '', {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

serve(async (req) => {
  console.log('Received portal session request:', {
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-client-info',
      },
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('No authorization header');
    }

    // Get the JWT token
    const token = authHeader.replace('Bearer ', '');
    console.log('Processing request with token:', token.substring(0, 10) + '...');

    // Get the user from Supabase
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      console.error('Error getting user:', userError);
      throw new Error('Invalid user token');
    }
    if (!user) {
      console.error('No user found for token');
      throw new Error('Invalid user token');
    }

    console.log('User authenticated:', { userId: user.id, email: user.email });

    // Get the customer ID from Supabase
    const { data: customer, error: customerError } = await supabaseClient
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (customerError || !customer?.stripe_customer_id) {
      console.error('Error getting customer:', customerError);
      throw new Error('Customer not found');
    }

    console.log('Found customer:', { stripeCustomerId: customer.stripe_customer_id });

    // Create the portal session
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customer.stripe_customer_id,
        return_url: `${Deno.env.get('CLIENT_URL')}/subscription`,
      });

      console.log('Created portal session:', {
        sessionId: session.id,
        url: session.url,
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (stripeError) {
      console.error('Error creating portal session:', stripeError);
      throw new Error('Failed to create portal session');
    }
  } catch (error) {
    console.error('Error in create-portal-session:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}); 