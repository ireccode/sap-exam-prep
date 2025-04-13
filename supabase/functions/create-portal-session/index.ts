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
 
     // Get customer ID from the customers table
     const { data: customerData, error: customerError } = await supabase
       .from('customers')
       .select('stripe_customer_id')
       .eq('user_id', user.id)
       .single()
 
     if (customerError || !customerData?.stripe_customer_id) {
       throw new Error('Customer not found')
     }
 
     // Create a Stripe Portal session
     const session = await stripe.billingPortal.sessions.create({
       customer: customerData.stripe_customer_id,
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