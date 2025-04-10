import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'
 
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient()
})
 
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}
 
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Function to get user's stripe customer id
    async function getStripeCustomerId(userId: string) {
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single()

      if (customerError || !customerData?.stripe_customer_id) {
        throw new Error('Customer not found')
      }
      return customerData.stripe_customer_id;
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Handle billing portal session creation
    if (!path || path === 'create-portal-session') {
      const stripeCustomerId = await getStripeCustomerId(user.id);
      
      // Create a Stripe Portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${Deno.env.get('CLIENT_URL')}/profile`,
      })

      return new Response(
        JSON.stringify({ url: session.url }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      )
    }
    
    // Handle refund requests
    if (path === 'create-refund') {
      const { chargeId } = await req.json();

      if (!chargeId) {
        return new Response(
          JSON.stringify({ error: 'Missing chargeId' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Get charge details to verify it belongs to this customer and is within 48 hours
      const charge = await stripe.charges.retrieve(chargeId);
      const stripeCustomerId = await getStripeCustomerId(user.id);
      
      // Verify the charge belongs to this customer
      if (charge.customer !== stripeCustomerId) {
        return new Response(
          JSON.stringify({ error: 'Charge does not belong to this customer' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      // Verify the charge is within 48 hours
      const chargeTime = new Date(charge.created * 1000);
      const now = new Date();
      const hoursDifference = (now.getTime() - chargeTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursDifference > 48) {
        return new Response(
          JSON.stringify({ 
            error: 'We apologize but according to our refund policy the refund not available after 48 hours from purchase',
            purchaseDate: chargeTime.toISOString(),
            hoursElapsed: hoursDifference
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      try {
        // Process the full refund
        const refund = await stripe.refunds.create({
          charge: chargeId,
        });

        // Log the refund in the database
        await supabase
          .from('refund_logs')
          .insert({
            user_id: user.id,
            charge_id: chargeId,
            amount: charge.amount,
            refund_id: refund.id,
            status: refund.status,
          });

        return new Response(
          JSON.stringify({ 
            success: true,
            refund: {
              id: refund.id,
              amount: refund.amount,
              status: refund.status,
              created: new Date(refund.created * 1000).toISOString()
            }
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
            status: 200,
          }
        );
      } catch (stripeError) {
        return new Response(
          JSON.stringify({ error: stripeError.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // If the path doesn't match any handlers
    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    )
  }
})
