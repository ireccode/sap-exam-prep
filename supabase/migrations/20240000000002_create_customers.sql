-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own customer data" ON public.customers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all customer data" ON public.customers
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes
CREATE INDEX customers_user_id_idx ON public.customers(user_id);
CREATE INDEX customers_stripe_customer_id_idx ON public.customers(stripe_customer_id);

-- Set up realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime (updated_at); 