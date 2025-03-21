import { serve } from 'https://deno.land/std@0.200.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Stripe from 'https://esm.sh/stripe@12.4.0?deno-std=0.200.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16', // Use a stable API version
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

serve(async (req) => {
  console.log('Received request:', {
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

    // Get the request body
    const { priceId, userId } = await req.json();
    console.log('Request body:', { priceId, userId });

    // Verify that the userId matches the authenticated user
    if (userId !== user.id) {
      console.error('User ID mismatch:', { providedId: userId, authenticatedId: user.id });
      throw new Error('User ID mismatch');
    }

    // Get or create customer
    let customerId: string;
    const { data: existingCustomer, error: customerError } = await supabaseClient
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (customerError) {
      console.error('Error checking for existing customer:', customerError);
    }

    if (existingCustomer?.stripe_customer_id) {
      customerId = existingCustomer.stripe_customer_id;
      console.log('Found existing customer:', { customerId });
    } else {
      // Create a new customer in Stripe
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            supabase_user_id: user.id
          }
        });
        customerId = customer.id;
        console.log('Created new customer:', { customerId });

        // Save the customer in Supabase
        const { error: insertError } = await supabaseClient.from('customers').insert({
          user_id: user.id,
          stripe_customer_id: customerId
        });

        if (insertError) {
          console.error('Error saving customer to Supabase:', insertError);
          // Continue anyway since we have the Stripe customer
        }
      } catch (stripeError) {
        console.error('Error creating Stripe customer:', stripeError);
        throw new Error('Failed to create customer');
      }
    }

    // Create the checkout session
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${Deno.env.get('CLIENT_URL')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${Deno.env.get('CLIENT_URL')}/subscription/cancel`,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      console.log('Created checkout session:', {
        sessionId: session.id,
        url: session.url,
        successUrl: `${Deno.env.get('CLIENT_URL')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${Deno.env.get('CLIENT_URL')}/subscription/cancel`,
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (stripeError) {
      console.error('Error creating checkout session:', stripeError);
      throw new Error('Failed to create checkout session');
    }
  } catch (error) {
    console.error('Error in create-checkout-session:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}); 